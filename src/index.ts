import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface TsConfig {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
}

interface PackageJson {
  devDependencies?: Record<string, string>;
}

export function addAliases(projectRoot: string, aliases: Record<string, string[]> = {}) {
  console.log('Starting addAliases in project:', projectRoot);

  const packageJsonPath = path.join(projectRoot, 'package.json');
  let packageJson: PackageJson = {};
  if (fs.existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      console.log('package.json found and parsed successfully');
    } catch (e) {
      console.error('Error parsing package.json:', e);
      process.exit(1);
    }
  } else {
    console.error('package.json not found in project root.');
    process.exit(1);
  }

  const isTypesNodeInstalled = packageJson.devDependencies?.['@types/node'];
  console.log('isTypesNodeInstalled:', isTypesNodeInstalled);

  if (!isTypesNodeInstalled) {
    try {
      console.log('Installing @types/node as devDependency...');
      execSync('npm install --save-dev @types/node', {
        cwd: projectRoot,
        stdio: 'inherit',
      });
      console.log('@types/node installed successfully!');
    } catch (e: any) {
      console.error('Error installing @types/node:', e);
      process.exit(1);
    }
  } else {
    console.log('@types/node is already installed in devDependencies.');
  }

  console.log('Checking tsconfig.json...');
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
  let tsConfig: TsConfig = {};

  if (fs.existsSync(tsConfigPath)) {
    const fileContent = fs.readFileSync(tsConfigPath, 'utf-8');
    try {
      tsConfig = JSON.parse(fileContent);
      console.log('tsconfig.json found and parsed successfully');
    } catch (e) {
      console.error('Error parsing tsconfig.json:', e);
      process.exit(1);
    }
  } else {
    console.log('tsconfig.json not found, creating new one...');
    tsConfig = {};
  }

  tsConfig.compilerOptions = tsConfig.compilerOptions || {};
  tsConfig.compilerOptions.baseUrl = tsConfig.compilerOptions.baseUrl || 'src';
  tsConfig.compilerOptions.paths = tsConfig.compilerOptions.paths || {};

  const defaultAliases = {
    '@/*': ['./src/*'],
    ...aliases,
  };

  for (const [alias, aliasPath] of Object.entries(defaultAliases)) {
    tsConfig.compilerOptions.paths[alias] = aliasPath;
  }

  try {
    console.log('Attempting to write tsconfig.json...');
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2), 'utf-8');
    console.log('Aliases added to tsconfig.json successfully!');
  } catch (e) {
    console.error('Error writing to tsconfig.json:', e);
    process.exit(1);
  }

  console.log('Checking vite.config.ts...');
  const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
  const viteConfigTemplate = `import type { AliasOptions } from 'vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const root = path.resolve(__dirname, 'src');

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': root,
    } as AliasOptions,
  },
});
`;

  if (!fs.existsSync(viteConfigPath)) {
    try {
      console.log('Creating vite.config.ts...');
      fs.writeFileSync(viteConfigPath, viteConfigTemplate, 'utf-8');
      console.log('vite.config.ts created with alias configuration!');
    } catch (e) {
      console.error('Error creating vite.config.ts:', e);
      process.exit(1);
    }
  } else {
    let viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');

    const aliasRegex = /resolve\s*:\s*{[^}]*alias\s*:\s*{[^}]*@[^}]*}/;
    if (!aliasRegex.test(viteConfigContent)) {
      const importSection = `import type { AliasOptions } from 'vite';\nimport path from 'path';\n\nconst root = path.resolve(__dirname, 'src');\n\n`;
      const resolveSection = `resolve: {\n    alias: {\n      '@': root,\n    } as AliasOptions,\n  },`;

      if (!viteConfigContent.includes('defineConfig')) {
        console.error('Existing vite.config.ts does not use defineConfig. Manual update required.');
        return;
      }

      if (!viteConfigContent.includes("import path from 'path'")) {
        viteConfigContent = importSection + viteConfigContent;
      }

      const configStart = viteConfigContent.indexOf('defineConfig({') + 'defineConfig({'.length;
      viteConfigContent =
        viteConfigContent.slice(0, configStart) + '\n  ' + resolveSection + '\n' + viteConfigContent.slice(configStart);

      try {
        console.log('Updating vite.config.ts...');
        fs.writeFileSync(viteConfigPath, viteConfigContent, 'utf-8');
        console.log('vite.config.ts updated with alias configuration!');
      } catch (e) {
        console.error('Error updating vite.config.ts:', e);
        process.exit(1);
      }
    } else {
      console.log('Alias configuration already exists in vite.config.ts. Skipping update.');
    }
  }
}

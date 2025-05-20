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
  const packageJsonPath = path.join(projectRoot, 'package.json');
  let packageJson: PackageJson = {};
  if (fs.existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    } catch (e) {
      console.error('Error parsing package.json:', e);
      process.exit(1);
    }
  } else {
    console.error('package.json not found in project root.');
    process.exit(1);
  }

  const isLocalPackage = __filename.includes('node_modules/react-ts-aliases') || __filename.includes('work/alias-npm');
  const isPackageInstalled = packageJson.devDependencies?.['react-ts-aliases'];
  const isTypesNodeInstalled = packageJson.devDependencies?.['@types/node'];

  if (!isPackageInstalled || !isTypesNodeInstalled) {
    try {
      const dependenciesToInstall = [];
      if (!isPackageInstalled && !isLocalPackage) {
        dependenciesToInstall.push('react-ts-aliases');
      }
      if (!isTypesNodeInstalled) {
        dependenciesToInstall.push('@types/node');
      }

      if (dependenciesToInstall.length > 0) {
        console.log(`Installing ${dependenciesToInstall.join(' and ')} as devDependencies...`);
        execSync(`npm install --save-dev ${dependenciesToInstall.join(' ')}`, {
          cwd: projectRoot,
          stdio: 'inherit',
        });
        console.log('Dependencies installed successfully!');
      } else {
        console.log('All required dependencies are already installed.');
      }
    } catch (e: any) {
      if (e.message.includes('E404') && e.message.includes('react-ts-aliases')) {
        console.warn('Warning: react-ts-aliases not found in npm registry. This is expected during local testing.');
        console.warn('To use this package in production, publish it to npm with "npm publish".');
        console.warn('Continuing without installing react-ts-aliases...');
      } else {
        console.error('Error installing dependencies:', e);
        process.exit(1);
      }
    }
  } else {
    console.log('react-ts-aliases and @types/node are already installed in devDependencies.');
  }

  // Обновление tsconfig.json
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
  let tsConfig: TsConfig = {};

  if (fs.existsSync(tsConfigPath)) {
    const fileContent = fs.readFileSync(tsConfigPath, 'utf-8');
    try {
      tsConfig = JSON.parse(fileContent);
    } catch (e) {
      console.error('Error parsing tsconfig.json:', e);
      process.exit(1);
    }
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
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2), 'utf-8');
    console.log('Aliases added to tsconfig.json successfully!');
  } catch (e) {
    console.error('Error writing to tsconfig.json:', e);
    process.exit(1);
  }

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

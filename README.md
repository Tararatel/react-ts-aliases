# react-ts-aliases

`react-ts-aliases` — это CLI-инструмент для автоматического добавления путевых алиасов в проекты на React с TypeScript. Он упрощает настройку алиасов, таких как `@/*` для папки `src`, в файлах `tsconfig.json` и `vite.config.ts`, а также добавляет необходимые зависимости в `package.json`.

## Установка

Установите пакет как dev-зависимость:

```bash
npm install react-ts-aliases
```

При установке пакет автоматически выполнит настройку алиасов, добавив их в `tsconfig.json` и `vite.config.ts`, а также установит зависимость `@types/node`, если она ещё не установлена.

## Использование

После установки пакета алиасы добавляются автоматически благодаря скрипту `postinstall`. Если вы хотите вручную запустить настройку алиасов, выполните:

```bash
npx react-ts-aliases init
```

Эта команда:
- Добавляет в `tsconfig.json`:
  ```json
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
  ```
- Создаёт или обновляет `vite.config.ts` с алиасом `@` для папки `src`.
- Добавляет `react-ts-aliases` и `@types/node` в `devDependencies` в `package.json`.

## Пример

После выполнения команды в проекте появятся или обновятся следующие файлы:

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### `vite.config.ts`
```typescript
import type { AliasOptions } from 'vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const root = path.resolve(__dirname, 'src');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': root,
    } as AliasOptions,
  },
});
```

## Зависимости

Пакет автоматически устанавливает:
- `react-ts-aliases` (в `devDependencies`)
- `@types/node` (в `devDependencies`)

## Репозиторий

Исходный код и дополнительная информация доступны на GitHub: [https://github.com/Tararatel/react-ts-aliases](https://github.com/Tararatel/react-ts-aliases)

## Лицензия

MIT License

## Автор

Алексей Сидоров (tararatel)
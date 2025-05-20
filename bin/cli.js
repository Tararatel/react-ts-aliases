#!/usr/bin/env node

const { addAliases } = require('../dist/index.js');

const [, , command, ...args] = process.argv;

if (command === 'init') {
  addAliases(process.cwd());
} else {
  console.error('Unknown command. Use "react-ts-aliases init" to add aliases.');
  process.exit(1);
}

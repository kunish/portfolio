---
title: 'Node.js CLI Development: Building Command Line Apps from Scratch'
description: 'Master command argument parsing, interactive prompts, progress bars and npm package publishing'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'nodejs-cli-guide'
---

Command line tools are powerful weapons for developers. This article explores how to build professional CLI applications with Node.js.

## Project Initialization

### Basic Structure

```
my-cli/
├── src/
│   ├── index.ts        # Entry file
│   ├── commands/       # Command modules
│   │   ├── init.ts
│   │   └── build.ts
│   └── utils/          # Utilities
├── bin/
│   └── cli.js          # Executable
├── package.json
└── tsconfig.json
```

```json
// package.json
{
  "name": "my-awesome-cli",
  "version": "1.0.0",
  "bin": {
    "mycli": "./bin/cli.js"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "inquirer": "^9.0.0"
  }
}
```

## Command Parsing

### Commander.js Basics

```typescript
// src/index.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('mycli')
  .description('A powerful CLI tool')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a new project')
  .argument('[name]', 'Project name', 'my-project')
  .option('-t, --template <type>', 'Template type', 'default')
  .action((name, options) => {
    console.log(`Creating project: ${name}`);
  });

program
  .command('add <component>')
  .description('Add a component')
  .action((component) => {
    console.log(`Adding: ${component}`);
  });

program.parse();
```

### Subcommand Grouping

```typescript
// src/commands/config.ts
import { Command } from 'commander';

export const configCommand = new Command('config')
  .description('Manage configuration');

configCommand
  .command('get <key>')
  .action((key) => console.log(`Getting: ${key}`));

configCommand
  .command('set <key> <value>')
  .action((key, value) => console.log(`Setting ${key} = ${value}`));
```

## Terminal Styling

### Chalk Color Output

```typescript
import chalk from 'chalk';

console.log(chalk.red('Error!'));
console.log(chalk.green('Success!'));
console.log(chalk.yellow('Warning!'));
console.log(chalk.blue('Info'));

console.log(chalk.bgRed.white(' ERROR '));
console.log(chalk.bold.underline('Important'));

console.log(chalk`
  {bold.cyan mycli} - A powerful tool

  {yellow Usage:}
    $ mycli <command> [options]

  {yellow Commands:}
    {green init}     Initialize project
    {green build}    Build project
`);
```

### Logger Utility

```typescript
// src/utils/logger.ts
import chalk from 'chalk';

const prefix = {
  info: chalk.blue('ℹ'),
  success: chalk.green('✓'),
  warning: chalk.yellow('⚠'),
  error: chalk.red('✖'),
};

export const logger = {
  info: (msg: string) => console.log(`${prefix.info} ${msg}`),
  success: (msg: string) => console.log(`${prefix.success} ${chalk.green(msg)}`),
  warning: (msg: string) => console.log(`${prefix.warning} ${chalk.yellow(msg)}`),
  error: (msg: string) => console.error(`${prefix.error} ${chalk.red(msg)}`),
};
```

## Interactive Prompts

### Inquirer Q&A

```typescript
import inquirer from 'inquirer';

async function promptProjectInfo() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: 'my-project',
      validate: (input) => /^[a-z0-9-]+$/.test(input) || 'Invalid name format'
    },
    {
      type: 'list',
      name: 'template',
      message: 'Select template:',
      choices: [
        { name: 'React + TypeScript', value: 'react-ts' },
        { name: 'Vue + TypeScript', value: 'vue-ts' },
        { name: 'Node.js API', value: 'node-api' }
      ]
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features:',
      choices: [
        { name: 'ESLint', value: 'eslint', checked: true },
        { name: 'Prettier', value: 'prettier', checked: true },
        { name: 'Testing', value: 'testing' }
      ]
    },
    {
      type: 'confirm',
      name: 'git',
      message: 'Initialize Git?',
      default: true
    }
  ]);
}
```

## Progress Indicators

### Ora Loading Animation

```typescript
import ora from 'ora';

async function installDependencies() {
  const spinner = ora('Installing dependencies...').start();

  try {
    await runInstall();
    spinner.succeed('Dependencies installed');
  } catch (error) {
    spinner.fail('Failed to install');
    throw error;
  }
}

async function buildProject() {
  const steps = [
    { text: 'Compiling...', fn: compile },
    { text: 'Bundling...', fn: bundle },
    { text: 'Optimizing...', fn: optimize },
  ];

  for (const step of steps) {
    const spinner = ora(step.text).start();
    try {
      await step.fn();
      spinner.succeed();
    } catch {
      spinner.fail();
      throw new Error('Build failed');
    }
  }
}
```

### Progress Bar

```typescript
import cliProgress from 'cli-progress';

async function downloadFiles(files: string[]) {
  const bar = new cliProgress.SingleBar({
    format: 'Download |{bar}| {percentage}% | {value}/{total}',
    barCompleteChar: '█',
    barIncompleteChar: '░',
  });

  bar.start(files.length, 0);

  for (let i = 0; i < files.length; i++) {
    await downloadFile(files[i]);
    bar.update(i + 1);
  }

  bar.stop();
}
```

## File Operations

### Template Generation

```typescript
import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';

interface TemplateData {
  projectName: string;
  description: string;
}

async function generateFromTemplate(
  templateDir: string,
  targetDir: string,
  data: TemplateData
) {
  await fs.ensureDir(targetDir);
  const files = await fs.readdir(templateDir);

  for (const file of files) {
    const sourcePath = path.join(templateDir, file);
    const targetPath = path.join(targetDir, file);

    const content = await fs.readFile(sourcePath, 'utf-8');
    const template = Handlebars.compile(content);
    const result = template(data);

    await fs.writeFile(targetPath, result);
  }
}
```

### Config File Management

```typescript
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

interface Config {
  token?: string;
  template?: string;
}

class ConfigManager {
  private configPath: string;
  private config: Config = {};

  constructor() {
    this.configPath = path.join(os.homedir(), '.myclirc');
    this.load();
  }

  private load() {
    if (fs.existsSync(this.configPath)) {
      this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
    }
  }

  private save() {
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  set<K extends keyof Config>(key: K, value: Config[K]) {
    this.config[key] = value;
    this.save();
  }
}
```

## Publishing npm Package

### Prepare for Publishing

```json
{
  "name": "@username/my-cli",
  "version": "1.0.0",
  "bin": { "mycli": "./bin/cli.js" },
  "files": ["bin", "dist"],
  "engines": { "node": ">=18" },
  "publishConfig": { "access": "public" }
}
```

### Commands

```bash
# Build
npm run build

# Test locally
npm link
mycli --help

# Publish
npm publish --access public
```

## Best Practices Summary

```
CLI Tool Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   User Experience                                   │
│   ├── Clear help information                       │
│   ├── Meaningful error messages                    │
│   ├── Progress feedback                            │
│   └── Support --quiet and --verbose               │
│                                                     │
│   Code Quality                                      │
│   ├── Use TypeScript                               │
│   ├── Modular command structure                    │
│   ├── Comprehensive error handling                 │
│   └── Unit test coverage                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Library | Purpose |
|---------|---------|
| Commander | Command parsing |
| Chalk | Color output |
| Inquirer | Interactive prompts |
| Ora | Loading animations |

---

*Good CLI tools make developers twice as productive.*

---
title: 'Node.js CLI 工具开发：从零打造命令行应用'
description: '掌握命令行参数解析、交互式提示、进度条和发布 npm 包'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'nodejs-cli-guide'
---

命令行工具是开发者的利器。本文探讨如何使用 Node.js 构建专业的 CLI 应用。

## 项目初始化

### 基础结构

```
my-cli/
├── src/
│   ├── index.ts        # 入口文件
│   ├── commands/       # 命令模块
│   │   ├── init.ts
│   │   └── build.ts
│   └── utils/          # 工具函数
├── bin/
│   └── cli.js          # 可执行文件
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

## 命令解析

### Commander.js 基础

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

### 子命令分组

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

## 终端样式

### Chalk 颜色输出

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

### 日志工具封装

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

## 交互式提示

### Inquirer 问答

```typescript
import inquirer from 'inquirer';

async function promptProjectInfo() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: '项目名称:',
      default: 'my-project',
      validate: (input) => /^[a-z0-9-]+$/.test(input) || '名称格式错误'
    },
    {
      type: 'list',
      name: 'template',
      message: '选择模板:',
      choices: [
        { name: 'React + TypeScript', value: 'react-ts' },
        { name: 'Vue + TypeScript', value: 'vue-ts' },
        { name: 'Node.js API', value: 'node-api' }
      ]
    },
    {
      type: 'checkbox',
      name: 'features',
      message: '选择功能:',
      choices: [
        { name: 'ESLint', value: 'eslint', checked: true },
        { name: 'Prettier', value: 'prettier', checked: true },
        { name: 'Testing', value: 'testing' }
      ]
    },
    {
      type: 'confirm',
      name: 'git',
      message: '初始化 Git?',
      default: true
    }
  ]);
}
```

## 进度指示

### Ora 加载动画

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

### 进度条

```typescript
import cliProgress from 'cli-progress';

async function downloadFiles(files: string[]) {
  const bar = new cliProgress.SingleBar({
    format: '下载进度 |{bar}| {percentage}% | {value}/{total}',
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

## 文件操作

### 模板生成

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

### 配置文件管理

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

## 发布 npm 包

### 准备发布

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

### 命令

```bash
# 构建
npm run build

# 本地测试
npm link
mycli --help

# 发布
npm publish --access public
```

## 最佳实践总结

```
CLI 工具最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   用户体验                                          │
│   ├── 清晰的帮助信息                               │
│   ├── 有意义的错误提示                             │
│   ├── 进度反馈                                     │
│   └── 支持 --quiet 和 --verbose                    │
│                                                     │
│   代码质量                                          │
│   ├── 使用 TypeScript                              │
│   ├── 模块化命令结构                               │
│   ├── 完善的错误处理                               │
│   └── 单元测试覆盖                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 库 | 用途 |
|----|------|
| Commander | 命令解析 |
| Chalk | 颜色输出 |
| Inquirer | 交互提示 |
| Ora | 加载动画 |

---

*好的 CLI 工具让开发者事半功倍。*

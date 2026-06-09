# 石坤 · 个人作品集与技术博客 🚀

> 前端工程师的个人站点 —— 中英双语、248+ 篇技术博客、动态 OG 配图,基于 Astro 构建的极速静态站。

![Astro](https://img.shields.io/badge/Astro-6-BC52EE?logo=astro&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-F38020?logo=cloudflare&logoColor=white)
[![Deploy](https://github.com/kunish/portfolio/actions/workflows/deploy.yml/badge.svg)](https://github.com/kunish/portfolio/actions/workflows/deploy.yml)

🔗 **在线预览**:<https://profolio-1ur.pages.dev>

---

## ✨ 特性

- 🌍 **中英双语 i18n** —— 中文默认、英文以 `/en` 前缀路由,文章通过 `translationKey` 互相关联
- 📝 **内容集合驱动** —— 248+ 篇博客以 Markdown / MDX 编写,frontmatter 经 Zod schema 类型校验
- 🖼️ **动态 OG 图** —— 为每篇文章用 [Satori](https://github.com/vercel/satori) + resvg 自动生成社交分享配图
- 📡 **RSS + 🗺️ Sitemap** —— 开箱即用的订阅源与站点地图
- 🔍 **SEO 友好** —— canonical URL、OpenGraph、关键词元信息一应俱全
- ⚡ **极速静态站** —— Astro 全量静态输出,零运行时 JS 负担
- 🎨 **Tailwind CSS 4** —— 通过 Vite 插件接入的现代原子化样式
- 🚢 **双部署方案** —— Cloudflare Pages(CI 自动发布)或 Docker 自托管

## 🛠️ 技术栈

| 类别       | 技术                                                            |
| :--------- | :-------------------------------------------------------------- |
| 框架       | [Astro 6](https://astro.build)(`output: static`)              |
| 样式       | [Tailwind CSS 4](https://tailwindcss.com) + `@tailwindcss/vite` |
| 语言       | [TypeScript](https://www.typescriptlang.org)                   |
| 内容       | Markdown / [MDX](https://mdxjs.com)、Astro Content Collections  |
| OG 图生成  | `satori` + `satori-html` + `@resvg/resvg-wasm`                 |
| 图像处理   | `sharp`                                                        |
| 包管理     | [pnpm](https://pnpm.io) 10                                     |
| 部署       | [Cloudflare Pages](https://pages.cloudflare.com) / Docker + Nginx |

## 🚀 快速开始

**前置要求**:Node.js **22+**(Astro 6 引擎要求)、pnpm **10+**。

```sh
# 克隆仓库
git clone git@github.com:kunish/portfolio.git
cd portfolio

# 安装依赖
pnpm install

# 启动开发服务器(http://localhost:4321)
pnpm dev
```

## 🧞 常用命令

所有命令均在项目根目录执行:

| 命令             | 作用                                       |
| :--------------- | :----------------------------------------- |
| `pnpm install`   | 安装依赖                                   |
| `pnpm dev`       | 启动本地开发服务器(`localhost:4321`)      |
| `pnpm build`     | 构建生产站点到 `./dist/`                    |
| `pnpm preview`   | 部署前本地预览构建产物                      |
| `pnpm deploy`    | 构建并部署到 Cloudflare Pages              |
| `pnpm astro ...` | 运行 Astro CLI(如 `astro add`、`astro check`) |

## 📁 项目结构

```text
portfolio/
├── public/                  # 静态资源(favicon、字体等)
├── src/
│   ├── components/          # Astro 组件(Header、Footer、LanguageSwitcher…)
│   ├── content/
│   │   └── blog/            # 博客文章(Markdown / MDX,中英双语)
│   ├── content.config.ts    # 内容集合 schema(Zod 校验 frontmatter)
│   ├── fonts/               # OG 图渲染字体(Inter-Bold.ttf)
│   ├── i18n/                # 国际化:ui.ts(文案字典)+ utils.ts(语言工具)
│   ├── layouts/             # 页面布局
│   ├── pages/
│   │   ├── blog/            # 中文博客路由
│   │   ├── en/              # 英文站点路由
│   │   ├── og/              # 动态 OG 图端点 [...slug].png.ts
│   │   └── rss.xml.js       # RSS 订阅源
│   ├── styles/              # 全局样式(global.css)
│   ├── utils/               # 工具函数(og-image.ts)
│   └── consts.ts            # 站点配置(个人信息、技能、社交链接、导航)
├── .github/workflows/       # CI:deploy.yml(自动发布到 Cloudflare Pages)
├── astro.config.mjs         # Astro 配置(i18n、sitemap、mdx、tailwind)
├── wrangler.toml            # Cloudflare Pages 配置
├── Dockerfile               # 多阶段构建 → Nginx 镜像
└── docker-compose.yml       # Docker 自托管编排
```

## 🌍 国际化(i18n)

- 默认语言为**中文**,英文站点统一挂在 `/en` 前缀下(`prefixDefaultLocale: false`)。
- UI 文案集中维护在 [`src/i18n/ui.ts`](src/i18n/ui.ts);路由与语言切换工具在 [`src/i18n/utils.ts`](src/i18n/utils.ts)。
- 博客文章通过 frontmatter 的 `lang`(`zh` / `en`)区分语言,并用相同的 `translationKey` 关联同一篇文章的双语版本,供语言切换器跳转。

## ✍️ 写一篇博客

在 `src/content/blog/` 下新建 `.md` / `.mdx`,frontmatter 字段(schema 见 [`src/content.config.ts`](src/content.config.ts)):

```yaml
---
title: '文章标题'
description: '一句话摘要(用于列表与 SEO)'
pubDate: 'Jan 28 2025'
updatedDate: 'Feb 01 2025'        # 可选
heroImage: 'https://...'          # 可选,封面图 URL
lang: 'zh'                        # 'zh' | 'en',默认 'zh'
translationKey: 'my-post-slug'    # 可选,关联另一语言的同篇文章
---
```

> 约定:中英双语文章使用 `*-zh` / `*-en` 文件名后缀,并共享同一个 `translationKey`。

## 🚢 部署

### Cloudflare Pages(推荐)

- **自动部署**:推送到 `main` 即触发 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),自动构建并发布。需在仓库 *Settings → Secrets* 配置:
  - `CLOUDFLARE_API_TOKEN`(Cloudflare Pages 编辑权限)
  - `CLOUDFLARE_ACCOUNT_ID`
- **手动部署**:本地登录 wrangler 后执行 `pnpm deploy`。

### Docker 自托管

多阶段构建产出 Nginx 静态镜像:

```sh
docker compose up -d        # 构建并启动,映射到 http://localhost:3000
```

## 📝 Git 提交规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 约定。

### 格式

```text
<type>(<scope>): <subject>

[可选正文:说明改动的 what 与 why]

[可选页脚:BREAKING CHANGE / 关联 issue]
```

### type 类型

| type       | 说明                                             |
| :--------- | :----------------------------------------------- |
| `feat`     | 新功能(新文章、新页面、新组件)                 |
| `fix`      | 修复 bug                                          |
| `docs`     | 文档变更(README、注释)                         |
| `style`    | 代码格式(空格、分号、Prettier;不影响逻辑)     |
| `refactor` | 重构(既不修 bug 也不加功能)                    |
| `perf`     | 性能优化                                          |
| `test`     | 测试相关                                          |
| `build`    | 构建系统或依赖变更(pnpm、Astro 升级)           |
| `ci`       | CI 配置(GitHub Actions、deploy.yml)            |
| `chore`    | 杂项(不涉及 src 或 test 的改动)                |
| `revert`   | 回滚之前的提交                                    |

### scope 范围(可选)

按改动所属模块填写,例如:`blog`、`i18n`、`og`、`components`、`ci`、`deploy`、`deps`、`config`。

### 约定

- subject 使用祈使语气、简洁明了,**句末不加句号**,建议 ≤ 72 字符。
- 一次提交只做一件事,保持改动聚焦。
- 破坏性变更在页脚以 `BREAKING CHANGE:` 标注。

### 示例(取自本仓库真实历史)

```text
feat(blog): add canvas graphics programming guide
fix(ci): bump CI Node.js to 22 for Astro 6 engine requirement
refactor: replace local blog placeholders with Unsplash CDN images
chore: point site URL to Cloudflare Pages domain
```

## 📄 许可

本仓库为个人作品集站点,博客内容版权归 **石坤** 所有,代码未附开源许可证(All Rights Reserved)。

主题最初基于 [Bear Blog](https://github.com/HermanMartinus/bearblog/) 与 [Astro Blog 模板](https://github.com/withastro/astro/tree/main/examples/blog) 构建,在此致谢 🙏。

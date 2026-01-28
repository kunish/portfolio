export const languages = {
  zh: '中文',
  en: 'English',
} as const;

export const defaultLang = 'zh';

export type Lang = keyof typeof languages;

export const ui = {
  zh: {
    // Navigation
    'nav.home': '首页',
    'nav.blog': '博客',
    'nav.about': '关于',

    // Site
    'site.title': '石坤',
    'site.description': '前端工程师 - 专注于创建优雅、高效的用户界面体验',

    // Hero
    'hero.greeting': '你好，我是',
    'hero.role': '前端工程师',
    'hero.title.line1': '构建',
    'hero.title.line2': '卓越的',
    'hero.title.line3': '数字体验',
    'hero.description': '热衷于用代码创造美好体验的前端开发者，专注于 React、Vue、TypeScript 和现代 Web 技术。',
    'hero.cta.work': '查看作品',
    'hero.cta.contact': '联系我',
    'hero.status': '状态',
    'hero.available': '可接项目',
    'hero.location': '位置',
    'hero.focus': '专注领域',
    'hero.focusValue': 'Web 应用开发',

    // Stats
    'stats.experience': '年经验',
    'stats.projects': '个项目',
    'stats.clients': '位客户',

    // Sections
    'section.skills': '技能专长',
    'section.latestPosts': '最新文章',
    'section.viewAll': '查看全部',
    'section.readMore': '阅读更多',

    // Skills
    'skills.frontend': '前端框架',
    'skills.languages': '语言',
    'skills.tools': '工具',
    'skills.other': '其他',

    // About
    'about.title': '关于我',
    'about.intro': '一位热爱技术、追求卓越的前端工程师',
    'about.description1': '我是一名专注于用户体验的前端工程师，拥有多年的 Web 开发经验。我热衷于使用现代技术栈构建高性能、可访问的 Web 应用。',
    'about.description2': '在工作中，我注重代码质量和团队协作，善于将复杂的业务需求转化为优雅的技术方案。',
    'about.skillsTitle': '技能 & 工具',
    'about.contactTitle': '联系方式',
    'about.contactDescription': '如果你有项目想法或合作意向，欢迎随时联系我。',
    'about.email': '发送邮件',

    // Blog
    'blog.title': '博客',
    'blog.description': '分享技术见解、开发经验和学习心得',
    'blog.featured': '精选文章',
    'blog.allPosts': '所有文章',
    'blog.noTranslation': '此文章暂无翻译版本',
    'blog.readInLang': '阅读{lang}版本',

    // Footer
    'footer.rights': '保留所有权利',
    'footer.builtWith': '使用 Astro 构建',

    // CTA
    'cta.title': '让我们一起创造',
    'cta.description': '无论是新项目还是合作机会，我都很乐意听取您的想法',
    'cta.button': '开始对话',

    // Common
    'common.loading': '加载中...',
    'common.error': '出错了',
    'common.back': '返回',
    'common.close': '关闭',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.blog': 'Blog',
    'nav.about': 'About',

    // Site
    'site.title': 'Shi Kun',
    'site.description': 'Frontend Engineer - Focused on creating elegant and efficient user interface experiences',

    // Hero
    'hero.greeting': "Hi, I'm",
    'hero.role': 'Frontend Engineer',
    'hero.title.line1': 'Crafting',
    'hero.title.line2': 'Exceptional',
    'hero.title.line3': 'Digital Experiences',
    'hero.description': 'A passionate frontend developer dedicated to creating beautiful experiences with code, focusing on React, Vue, TypeScript, and modern web technologies.',
    'hero.cta.work': 'View Work',
    'hero.cta.contact': 'Contact Me',
    'hero.status': 'Status',
    'hero.available': 'Available for Work',
    'hero.location': 'Location',
    'hero.focus': 'Focus',
    'hero.focusValue': 'Web App Development',

    // Stats
    'stats.experience': 'Years Exp.',
    'stats.projects': 'Projects',
    'stats.clients': 'Clients',

    // Sections
    'section.skills': 'Skills & Expertise',
    'section.latestPosts': 'Latest Posts',
    'section.viewAll': 'View All',
    'section.readMore': 'Read More',

    // Skills
    'skills.frontend': 'Frontend Frameworks',
    'skills.languages': 'Languages',
    'skills.tools': 'Tools',
    'skills.other': 'Other',

    // About
    'about.title': 'About Me',
    'about.intro': 'A technology enthusiast and excellence-driven frontend engineer',
    'about.description1': "I'm a frontend engineer focused on user experience with years of web development experience. I'm passionate about building high-performance, accessible web applications using modern tech stacks.",
    'about.description2': 'At work, I prioritize code quality and team collaboration, excelling at transforming complex business requirements into elegant technical solutions.',
    'about.skillsTitle': 'Skills & Tools',
    'about.contactTitle': 'Get in Touch',
    'about.contactDescription': "If you have a project idea or collaboration opportunity, feel free to reach out.",
    'about.email': 'Send Email',

    // Blog
    'blog.title': 'Blog',
    'blog.description': 'Sharing technical insights, development experiences, and learning notes',
    'blog.featured': 'Featured Post',
    'blog.allPosts': 'All Posts',
    'blog.noTranslation': 'No translation available for this post',
    'blog.readInLang': 'Read in {lang}',

    // Footer
    'footer.rights': 'All rights reserved',
    'footer.builtWith': 'Built with Astro',

    // CTA
    'cta.title': "Let's Create Together",
    'cta.description': "Whether it's a new project or collaboration opportunity, I'd love to hear your ideas",
    'cta.button': 'Start a Conversation',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.back': 'Back',
    'common.close': 'Close',
  },
} as const;

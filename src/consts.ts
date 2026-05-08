// Site configuration
export const SITE_TITLE = '石坤';
export const SITE_DESCRIPTION = '前端工程师 | 专注于 React、Vue、TypeScript 和现代 Web 技术，创建优雅高效的用户界面体验';
export const SITE_KEYWORDS = '石坤,前端开发,React,Vue,TypeScript,JavaScript,Web开发,Frontend Developer';

// Hero 配图（Unsplash 远程图，按编号 1-5 在博客 frontmatter 中引用）
const UNSPLASH_HERO_PARAMS = '?auto=format&fit=crop&w=1200&q=80';
export const HERO_IMAGES = {
  1: `https://images.unsplash.com/photo-1461749280684-dccba630e2f6${UNSPLASH_HERO_PARAMS}`,
  2: `https://images.unsplash.com/photo-1517694712202-14dd9538aa97${UNSPLASH_HERO_PARAMS}`,
  3: `https://images.unsplash.com/photo-1555066931-4365d14bab8c${UNSPLASH_HERO_PARAMS}`,
  4: `https://images.unsplash.com/photo-1542831371-29b0f74f9713${UNSPLASH_HERO_PARAMS}`,
  5: `https://images.unsplash.com/photo-1504384308090-c894fdcc538d${UNSPLASH_HERO_PARAMS}`,
} as const;

// 默认 OG 图（BaseHead fallback）
export const FALLBACK_OG_IMAGE = HERO_IMAGES[1];

// Personal information
export const PERSONAL_INFO = {
  name: '石坤',
  role: '前端工程师',
  email: 'kunish.butt@gmail.com',
  location: '北京',
  bio: '热衷于用代码创造美好体验的前端开发者，专注于 React、Vue、TypeScript 和现代 Web 技术。',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
};

// Social links
export const SOCIAL_LINKS = {
  github: 'https://github.com/kunish',
};

// Navigation
export const NAV_ITEMS = [
  { label: '首页', href: '/' },
  { label: '博客', href: '/blog' },
  { label: '关于', href: '/about' },
];

// Skills
export const SKILLS = [
  {
    category: '前端框架',
    items: ['React', 'Vue.js', 'Next.js', 'Astro'],
  },
  {
    category: '语言',
    items: ['TypeScript', 'JavaScript', 'HTML5', 'CSS3'],
  },
  {
    category: '工具',
    items: ['Git', 'Vite', 'Webpack', 'Tailwind CSS'],
  },
  {
    category: '其他',
    items: ['Node.js', 'REST API', 'GraphQL', 'Docker'],
  },
];

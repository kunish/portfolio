import { ui, defaultLang, type Lang } from './ui';

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function useTranslatedPath(lang: Lang) {
  return function translatePath(path: string, targetLang: Lang = lang): string {
    const pathWithoutLang = path.replace(/^\/(zh|en)/, '');
    const cleanPath = pathWithoutLang || '/';

    if (targetLang === defaultLang) {
      return cleanPath;
    }
    return `/${targetLang}${cleanPath === '/' ? '' : cleanPath}`;
  };
}

export function getRouteFromUrl(url: URL): string {
  const pathname = url.pathname;
  const parts = pathname.split('/').filter(Boolean);

  // Remove language prefix if present
  if (parts[0] && parts[0] in ui) {
    parts.shift();
  }

  return '/' + parts.join('/');
}

export function getLocalizedUrl(url: URL, targetLang: Lang): string {
  let route = getRouteFromUrl(url);

  // 处理博客文章的语言后缀切换
  // 例如: /blog/browser-storage-guide-zh -> /blog/browser-storage-guide-en
  if (route.startsWith('/blog/') && route !== '/blog/') {
    const blogSlugMatch = route.match(/^\/blog\/(.+?)(?:-(zh|en))?$/);
    if (blogSlugMatch) {
      const baseSlug = blogSlugMatch[1].replace(/-(zh|en)$/, '');
      route = `/blog/${baseSlug}-${targetLang}`;
    }
  }

  if (targetLang === defaultLang) {
    return route || '/';
  }
  return `/${targetLang}${route}`;
}

// Get all supported languages
export function getLanguages(): { code: Lang; name: string }[] {
  return [
    { code: 'zh', name: '中文' },
    { code: 'en', name: 'English' },
  ];
}

---
title: 'Web 图片优化：从格式选择到自动化处理'
description: '掌握图片格式、响应式图片、懒加载、CDN 分发和自动化优化工具'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'image-optimization-guide'
---

图片通常占网页总大小的 50% 以上。本文探讨图片优化的各种技术和最佳实践。

## 图片格式选择

### 现代图片格式

```
图片格式对比：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   WebP                                              │
│   ├── 比 JPEG 小 25-35%                            │
│   ├── 支持透明度和动画                              │
│   ├── 浏览器支持 95%+                              │
│   └── 推荐作为默认格式                              │
│                                                     │
│   AVIF                                              │
│   ├── 比 WebP 小 20%+                              │
│   ├── 更好的压缩质量                                │
│   ├── 浏览器支持 85%+                              │
│   └── 编码速度较慢                                  │
│                                                     │
│   JPEG/PNG                                          │
│   ├── 通用兼容性                                    │
│   ├── 作为后备格式                                  │
│   └── 适合老旧浏览器                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 格式 | 适用场景 | 压缩 |
|------|----------|------|
| AVIF | 高质量照片 | 有损 |
| WebP | 通用图片 | 有损/无损 |
| PNG | 透明/图标 | 无损 |
| SVG | 矢量图形 | 无损 |

### 格式选择策略

```html
<!-- 使用 picture 元素提供多格式 -->
<picture>
  <!-- 首选 AVIF -->
  <source type="image/avif" srcset="image.avif" />
  <!-- 次选 WebP -->
  <source type="image/webp" srcset="image.webp" />
  <!-- 后备 JPEG -->
  <img src="image.jpg" alt="描述文字" />
</picture>

<!-- 带尺寸的响应式图片 -->
<picture>
  <source
    type="image/avif"
    srcset="image-400.avif 400w, image-800.avif 800w, image-1200.avif 1200w"
    sizes="(max-width: 600px) 100vw, 50vw"
  />
  <source
    type="image/webp"
    srcset="image-400.webp 400w, image-800.webp 800w, image-1200.webp 1200w"
    sizes="(max-width: 600px) 100vw, 50vw"
  />
  <img
    src="image-800.jpg"
    srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
    sizes="(max-width: 600px) 100vw, 50vw"
    alt="描述文字"
  />
</picture>
```

## 响应式图片

### srcset 和 sizes

```html
<!-- 基于像素密度 -->
<img
  src="photo.jpg"
  srcset="photo.jpg 1x, photo@2x.jpg 2x, photo@3x.jpg 3x"
  alt="照片"
/>

<!-- 基于视口宽度 -->
<img
  src="hero.jpg"
  srcset="hero-320.jpg 320w, hero-640.jpg 640w, hero-1280.jpg 1280w"
  sizes="100vw"
  alt="英雄图片"
/>

<!-- 复杂的 sizes -->
<img
  src="product.jpg"
  srcset="
    product-200.jpg 200w,
    product-400.jpg 400w,
    product-600.jpg 600w,
    product-800.jpg 800w
  "
  sizes="
    (max-width: 320px) 100vw,
    (max-width: 768px) 50vw,
    (max-width: 1200px) 33vw,
    400px
  "
  alt="产品图片"
/>
```

### CSS 中的响应式图片

```css
/* 背景图片响应式 */
.hero {
  background-image: url('hero-mobile.jpg');
  background-size: cover;
}

@media (min-width: 768px) {
  .hero {
    background-image: url('hero-tablet.jpg');
  }
}

@media (min-width: 1200px) {
  .hero {
    background-image: url('hero-desktop.jpg');
  }
}

/* 使用 image-set */
.hero {
  background-image: image-set(
    url('hero.avif') type('image/avif'),
    url('hero.webp') type('image/webp'),
    url('hero.jpg') type('image/jpeg')
  );
}

/* 高分辨率屏幕 */
.logo {
  background-image: url('logo.png');
}

@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .logo {
    background-image: url('logo@2x.png');
  }
}
```

## 懒加载

### 原生懒加载

```html
<!-- 原生 loading 属性 -->
<img src="photo.jpg" loading="lazy" alt="照片" />

<!-- 带尺寸防止布局偏移 -->
<img
  src="photo.jpg"
  loading="lazy"
  width="800"
  height="600"
  alt="照片"
/>

<!-- iframe 懒加载 -->
<iframe
  src="https://www.youtube.com/embed/xxxxx"
  loading="lazy"
  title="视频"
></iframe>

<!-- 首屏图片不要懒加载 -->
<img
  src="hero.jpg"
  loading="eager"
  fetchpriority="high"
  alt="首屏图片"
/>
```

### Intersection Observer 实现

```typescript
// 自定义懒加载
function lazyLoadImages() {
  const images = document.querySelectorAll<HTMLImageElement>('img[data-src]');

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    },
    {
      rootMargin: '50px 0px', // 提前 50px 开始加载
      threshold: 0.01,
    }
  );

  images.forEach((img) => imageObserver.observe(img));
}

// HTML 使用
// <img data-src="photo.jpg" data-srcset="photo-2x.jpg 2x" class="lazy" alt="照片" />
```

### React 懒加载组件

```tsx
import { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
}

function LazyImage({ src, alt, placeholder, className }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="image-container">
      {placeholder && !isLoaded && (
        <img src={placeholder} alt="" className="placeholder" />
      )}
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        alt={alt}
        className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
```

## 图片压缩

### Sharp 处理

```typescript
import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import path from 'path';

// 批量优化图片
async function optimizeImages(inputDir: string, outputDir: string) {
  await mkdir(outputDir, { recursive: true });

  const files = await readdir(inputDir);
  const imageFiles = files.filter((f) =>
    /\.(jpg|jpeg|png|gif)$/i.test(f)
  );

  for (const file of imageFiles) {
    const inputPath = path.join(inputDir, file);
    const baseName = path.parse(file).name;

    // 生成多尺寸
    const sizes = [400, 800, 1200, 1600];

    for (const size of sizes) {
      // WebP 格式
      await sharp(inputPath)
        .resize(size, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(outputDir, `${baseName}-${size}.webp`));

      // AVIF 格式
      await sharp(inputPath)
        .resize(size, null, { withoutEnlargement: true })
        .avif({ quality: 65 })
        .toFile(path.join(outputDir, `${baseName}-${size}.avif`));

      // JPEG 后备
      await sharp(inputPath)
        .resize(size, null, { withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(path.join(outputDir, `${baseName}-${size}.jpg`));
    }
  }
}

// 生成缩略图
async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  size: number
) {
  await sharp(inputPath)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 75 })
    .toFile(outputPath);
}

// 生成模糊占位图
async function generateBlurPlaceholder(inputPath: string): Promise<string> {
  const buffer = await sharp(inputPath)
    .resize(20, 20, { fit: 'inside' })
    .blur(5)
    .webp({ quality: 20 })
    .toBuffer();

  return `data:image/webp;base64,${buffer.toString('base64')}`;
}
```

### 构建时优化

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';

export default defineConfig({
  plugins: [
    imagetools({
      defaultDirectives: (url) => {
        if (url.searchParams.has('hero')) {
          return new URLSearchParams({
            format: 'avif;webp;jpg',
            w: '400;800;1200;1600',
            quality: '80',
          });
        }
        return new URLSearchParams();
      },
    }),
  ],
});

// 使用
// import heroImage from './hero.jpg?hero'
```

## 框架集成

### Next.js Image

```tsx
import Image from 'next/image';

// 基础用法
function Gallery() {
  return (
    <Image
      src="/photo.jpg"
      alt="照片"
      width={800}
      height={600}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}

// 响应式图片
function ResponsiveImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="英雄图片"
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      style={{ objectFit: 'cover' }}
      priority // 首屏图片
    />
  );
}

// next.config.js 配置
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    domains: ['cdn.example.com'],
  },
};
```

### Astro Image

```astro
---
import { Image, Picture } from 'astro:assets';
import heroImage from '../assets/hero.jpg';
---

<!-- 基础用法 -->
<Image src={heroImage} alt="英雄图片" />

<!-- 带尺寸 -->
<Image
  src={heroImage}
  alt="英雄图片"
  width={800}
  height={600}
  format="webp"
  quality={80}
/>

<!-- 多格式 -->
<Picture
  src={heroImage}
  formats={['avif', 'webp']}
  alt="英雄图片"
  widths={[400, 800, 1200]}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

## 性能指标

### Core Web Vitals

```typescript
// 监控图片对 LCP 的影响
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.entryType === 'largest-contentful-paint') {
      const lcp = entry as PerformanceEntry & { element?: Element };
      if (lcp.element?.tagName === 'IMG') {
        console.log('LCP element is an image:', lcp.element);
        console.log('LCP time:', entry.startTime);
      }
    }
  });
}).observe({ type: 'largest-contentful-paint', buffered: true });

// 预加载关键图片
// <link rel="preload" as="image" href="hero.webp" type="image/webp" />
```

## 最佳实践总结

```
图片优化最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   格式选择                                          │
│   ├── 优先使用 AVIF/WebP                           │
│   ├── 提供后备格式                                  │
│   ├── SVG 用于图标和矢量                           │
│   └── 适当的压缩质量                                │
│                                                     │
│   响应式                                            │
│   ├── 使用 srcset 和 sizes                         │
│   ├── 根据设备提供合适尺寸                          │
│   ├── 考虑高分辨率屏幕                              │
│   └── 设置正确的尺寸属性                            │
│                                                     │
│   加载策略                                          │
│   ├── 首屏图片优先加载                              │
│   ├── 非首屏图片懒加载                              │
│   ├── 使用占位符防止布局偏移                        │
│   └── 预加载关键图片                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 建议 |
|------|------|
| 首屏大图 | fetchpriority="high" + preload |
| 产品列表 | 懒加载 + 模糊占位 |
| 图标 | SVG 或 icon font |
| 用户上传 | CDN + 动态裁剪 |

---

*优化图片是提升页面性能最有效的方式之一。*

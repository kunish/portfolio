---
title: 'Web Image Optimization: From Format Selection to Automation'
description: 'Master image formats, responsive images, lazy loading, CDN delivery and automation tools'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'image-optimization-guide'
---

Images typically account for over 50% of total page size. This article explores various image optimization techniques and best practices.

## Image Format Selection

### Modern Image Formats

```
Image Format Comparison:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   WebP                                              │
│   ├── 25-35% smaller than JPEG                     │
│   ├── Supports transparency and animation          │
│   ├── Browser support 95%+                         │
│   └── Recommended as default format                │
│                                                     │
│   AVIF                                              │
│   ├── 20%+ smaller than WebP                       │
│   ├── Better compression quality                   │
│   ├── Browser support 85%+                         │
│   └── Slower encoding                              │
│                                                     │
│   JPEG/PNG                                          │
│   ├── Universal compatibility                      │
│   ├── Use as fallback                              │
│   └── For legacy browsers                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Format | Use Case | Compression |
|--------|----------|-------------|
| AVIF | High quality photos | Lossy |
| WebP | General images | Lossy/Lossless |
| PNG | Transparency/Icons | Lossless |
| SVG | Vector graphics | Lossless |

### Format Selection Strategy

```html
<!-- Use picture element for multiple formats -->
<picture>
  <!-- Prefer AVIF -->
  <source type="image/avif" srcset="image.avif" />
  <!-- Fallback to WebP -->
  <source type="image/webp" srcset="image.webp" />
  <!-- Fallback to JPEG -->
  <img src="image.jpg" alt="Description" />
</picture>

<!-- Responsive with sizes -->
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
    alt="Description"
  />
</picture>
```

## Responsive Images

### srcset and sizes

```html
<!-- Based on pixel density -->
<img
  src="photo.jpg"
  srcset="photo.jpg 1x, photo@2x.jpg 2x, photo@3x.jpg 3x"
  alt="Photo"
/>

<!-- Based on viewport width -->
<img
  src="hero.jpg"
  srcset="hero-320.jpg 320w, hero-640.jpg 640w, hero-1280.jpg 1280w"
  sizes="100vw"
  alt="Hero image"
/>

<!-- Complex sizes -->
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
  alt="Product image"
/>
```

### CSS Responsive Images

```css
/* Responsive background images */
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

/* Using image-set */
.hero {
  background-image: image-set(
    url('hero.avif') type('image/avif'),
    url('hero.webp') type('image/webp'),
    url('hero.jpg') type('image/jpeg')
  );
}

/* High resolution screens */
.logo {
  background-image: url('logo.png');
}

@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .logo {
    background-image: url('logo@2x.png');
  }
}
```

## Lazy Loading

### Native Lazy Loading

```html
<!-- Native loading attribute -->
<img src="photo.jpg" loading="lazy" alt="Photo" />

<!-- With dimensions to prevent layout shift -->
<img
  src="photo.jpg"
  loading="lazy"
  width="800"
  height="600"
  alt="Photo"
/>

<!-- iframe lazy loading -->
<iframe
  src="https://www.youtube.com/embed/xxxxx"
  loading="lazy"
  title="Video"
></iframe>

<!-- Don't lazy load above-the-fold images -->
<img
  src="hero.jpg"
  loading="eager"
  fetchpriority="high"
  alt="Hero image"
/>
```

### Intersection Observer Implementation

```typescript
// Custom lazy loading
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
      rootMargin: '50px 0px', // Start loading 50px before
      threshold: 0.01,
    }
  );

  images.forEach((img) => imageObserver.observe(img));
}

// HTML usage
// <img data-src="photo.jpg" data-srcset="photo-2x.jpg 2x" class="lazy" alt="Photo" />
```

### React Lazy Load Component

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

## Image Compression

### Sharp Processing

```typescript
import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import path from 'path';

// Batch optimize images
async function optimizeImages(inputDir: string, outputDir: string) {
  await mkdir(outputDir, { recursive: true });

  const files = await readdir(inputDir);
  const imageFiles = files.filter((f) =>
    /\.(jpg|jpeg|png|gif)$/i.test(f)
  );

  for (const file of imageFiles) {
    const inputPath = path.join(inputDir, file);
    const baseName = path.parse(file).name;

    // Generate multiple sizes
    const sizes = [400, 800, 1200, 1600];

    for (const size of sizes) {
      // WebP format
      await sharp(inputPath)
        .resize(size, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(outputDir, `${baseName}-${size}.webp`));

      // AVIF format
      await sharp(inputPath)
        .resize(size, null, { withoutEnlargement: true })
        .avif({ quality: 65 })
        .toFile(path.join(outputDir, `${baseName}-${size}.avif`));

      // JPEG fallback
      await sharp(inputPath)
        .resize(size, null, { withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(path.join(outputDir, `${baseName}-${size}.jpg`));
    }
  }
}

// Generate thumbnail
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

// Generate blur placeholder
async function generateBlurPlaceholder(inputPath: string): Promise<string> {
  const buffer = await sharp(inputPath)
    .resize(20, 20, { fit: 'inside' })
    .blur(5)
    .webp({ quality: 20 })
    .toBuffer();

  return `data:image/webp;base64,${buffer.toString('base64')}`;
}
```

### Build-Time Optimization

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

// Usage
// import heroImage from './hero.jpg?hero'
```

## Framework Integration

### Next.js Image

```tsx
import Image from 'next/image';

// Basic usage
function Gallery() {
  return (
    <Image
      src="/photo.jpg"
      alt="Photo"
      width={800}
      height={600}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}

// Responsive image
function ResponsiveImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero image"
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      style={{ objectFit: 'cover' }}
      priority // Above-the-fold image
    />
  );
}

// next.config.js configuration
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

<!-- Basic usage -->
<Image src={heroImage} alt="Hero image" />

<!-- With dimensions -->
<Image
  src={heroImage}
  alt="Hero image"
  width={800}
  height={600}
  format="webp"
  quality={80}
/>

<!-- Multiple formats -->
<Picture
  src={heroImage}
  formats={['avif', 'webp']}
  alt="Hero image"
  widths={[400, 800, 1200]}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

## Performance Metrics

### Core Web Vitals

```typescript
// Monitor image impact on LCP
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

// Preload critical images
// <link rel="preload" as="image" href="hero.webp" type="image/webp" />
```

## Best Practices Summary

```
Image Optimization Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Format Selection                                  │
│   ├── Prefer AVIF/WebP                             │
│   ├── Provide fallback formats                     │
│   ├── SVG for icons and vectors                    │
│   └── Appropriate compression quality              │
│                                                     │
│   Responsive                                        │
│   ├── Use srcset and sizes                         │
│   ├── Serve appropriate size for device            │
│   ├── Consider high-resolution screens             │
│   └── Set correct dimension attributes             │
│                                                     │
│   Loading Strategy                                  │
│   ├── Prioritize above-the-fold images             │
│   ├── Lazy load below-the-fold images              │
│   ├── Use placeholders to prevent CLS             │
│   └── Preload critical images                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommendation |
|----------|----------------|
| Hero images | fetchpriority="high" + preload |
| Product lists | Lazy load + blur placeholder |
| Icons | SVG or icon font |
| User uploads | CDN + dynamic cropping |

---

*Optimizing images is one of the most effective ways to improve page performance.*

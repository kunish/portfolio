---
title: 'Server-Side Rendering Guide: Deep Dive into SSR, SSG and ISR'
description: 'Master rendering mode selection and performance optimization in Next.js, Nuxt.js and other frameworks'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'ssr-rendering-guide'
---

Modern web applications have multiple rendering strategies to choose from. This article explores the principles and practices of SSR, SSG, ISR and CSR.

## Rendering Modes Comparison

### Four Main Modes

```
Rendering Modes Comparison:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   CSR (Client-Side Rendering)                       │
│   ├── Browser downloads empty HTML + JS            │
│   ├── Content renders after JS execution           │
│   ├── Slow first paint, poor SEO                   │
│   └── Good for admin dashboards                    │
│                                                     │
│   SSR (Server-Side Rendering)                       │
│   ├── Server generates complete HTML               │
│   ├── Renders on every request                     │
│   ├── Fast first paint, good SEO                   │
│   └── High server load                             │
│                                                     │
│   SSG (Static Site Generation)                      │
│   ├── Generates static HTML at build time          │
│   ├── CDN distributed, extremely fast              │
│   ├── Content updates require rebuild              │
│   └── Good for blogs, documentation                │
│                                                     │
│   ISR (Incremental Static Regeneration)             │
│   ├── Static generation + incremental updates      │
│   ├── Auto-regenerates in background               │
│   ├── Balance between performance and freshness    │
│   └── Good for e-commerce, news                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Mode | First Paint | SEO | Server Load | Data Freshness |
|------|-------------|-----|-------------|----------------|
| CSR | Slow | Poor | None | High |
| SSR | Fast | Good | High | High |
| SSG | Fastest | Good | None | Low |
| ISR | Fastest | Good | Low | Medium |

## Next.js Implementation

### SSR: getServerSideProps

```tsx
// pages/products/[id].tsx
import { GetServerSideProps } from 'next';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

export default function ProductPage({ product }: { product: Product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>Price: ${product.price}</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  const res = await fetch(`https://api.example.com/products/${id}`);

  if (!res.ok) {
    return { notFound: true };
  }

  const product = await res.json();
  return { props: { product } };
};
```

### SSG: getStaticProps + getStaticPaths

```tsx
// pages/posts/[slug].tsx
import { GetStaticProps, GetStaticPaths } from 'next';

interface Post {
  slug: string;
  title: string;
  content: string;
}

export default function PostPage({ post }: { post: Post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const res = await fetch('https://api.example.com/posts');
  const posts: Post[] = await res.json();

  const paths = posts.map((post) => ({
    params: { slug: post.slug }
  }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { slug } = context.params!;
  const res = await fetch(`https://api.example.com/posts/${slug}`);
  const post = await res.json();
  return { props: { post } };
};
```

### ISR: Incremental Static Regeneration

```tsx
// pages/news/[id].tsx
export const getStaticPaths = async () => {
  const res = await fetch('https://api.example.com/news/popular');
  const articles = await res.json();

  return {
    paths: articles.map((a: any) => ({ params: { id: a.id } })),
    fallback: 'blocking'
  };
};

export const getStaticProps = async (context: any) => {
  const { id } = context.params;
  const res = await fetch(`https://api.example.com/news/${id}`);
  const article = await res.json();

  return {
    props: { article },
    revalidate: 60 // Regenerate after 60 seconds
  };
};
```

### App Router (Next.js 13+)

```tsx
// app/products/[id]/page.tsx

// Dynamic rendering (SSR)
export const dynamic = 'force-dynamic';

async function getProduct(id: string) {
  const res = await fetch(`https://api.example.com/products/${id}`, {
    cache: 'no-store' // SSR: No cache
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export default async function ProductPage({
  params
}: {
  params: { id: string }
}) {
  const product = await getProduct(params.id);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}

export async function generateStaticParams() {
  const res = await fetch('https://api.example.com/products');
  const products = await res.json();
  return products.map((p: any) => ({ id: p.id }));
}
```

## Data Fetching Strategies

### Parallel Data Fetching

```tsx
// app/dashboard/page.tsx
async function getUser() {
  const res = await fetch('https://api.example.com/user');
  return res.json();
}

async function getStats() {
  const res = await fetch('https://api.example.com/stats');
  return res.json();
}

export default async function DashboardPage() {
  const [user, stats] = await Promise.all([
    getUser(),
    getStats()
  ]);

  return (
    <div>
      <UserProfile user={user} />
      <StatsPanel stats={stats} />
    </div>
  );
}
```

### Streaming SSR

```tsx
// app/products/page.tsx
import { Suspense } from 'react';

async function ProductList() {
  const res = await fetch('https://api.example.com/products');
  const products = await res.json();
  return <ul>{products.map((p: any) => <li key={p.id}>{p.name}</li>)}</ul>;
}

async function RecommendedProducts() {
  const res = await fetch('https://api.example.com/recommended');
  const products = await res.json();
  return <aside>{products.map((p: any) => <div key={p.id}>{p.name}</div>)}</aside>;
}

export default function ProductsPage() {
  return (
    <div>
      <Suspense fallback={<p>Loading products...</p>}>
        <ProductList />
      </Suspense>
      <Suspense fallback={<p>Loading recommendations...</p>}>
        <RecommendedProducts />
      </Suspense>
    </div>
  );
}
```

## Hydration

### Understanding Hydration Process

```tsx
// Hydration: Making static HTML interactive
// Server: <button>Clicks: 0</button>
// After hydration: <button onClick={handleClick}>Clicks: 0</button>

function Timer() {
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <p>Current time: {time}</p>;
}
```

### Avoiding Hydration Issues

```tsx
'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Method 1: Delay client content rendering
function ClientOnlyComponent({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;
  return <>{children}</>;
}

// Method 2: Use next/dynamic
const ClientSideChart = dynamic(() => import('./Chart'), {
  ssr: false,
  loading: () => <p>Loading chart...</p>
});
```

## SEO Optimization

### Metadata Configuration

```tsx
// app/products/[id]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({
  params
}: {
  params: { id: string }
}): Promise<Metadata> {
  const product = await getProduct(params.id);

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image]
    }
  };
}
```

## Performance Optimization

### Caching Strategies

```tsx
// Route-level caching
export const revalidate = 3600;

// Request-level caching
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600, tags: ['data'] }
  });
  return res.json();
}

// Manual revalidation
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  revalidateTag('data');
  return Response.json({ revalidated: true });
}
```

## Best Practices Summary

```
SSR Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Choosing Rendering Mode                           │
│   ├── Static content → SSG                         │
│   ├── Dynamic content + SEO → SSR                  │
│   ├── Frequent updates → ISR                       │
│   └── Pure interactive apps → CSR                  │
│                                                     │
│   Performance Optimization                          │
│   ├── Use Streaming SSR                            │
│   ├── Set proper caching strategies                │
│   ├── Fetch data in parallel                       │
│   └── Lazy load non-critical components            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Solution |
|----------|---------------------|
| Blog/Documentation | SSG |
| E-commerce Homepage | ISR |
| User Dashboard | SSR + Streaming |
| Admin Panel | CSR |

---

*Choose the right rendering strategy for both speed and user experience.*

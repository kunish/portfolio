---
title: '服务端渲染完全指南：SSR、SSG 与 ISR 深度解析'
description: '掌握 Next.js、Nuxt.js 等框架的渲染模式选择和性能优化'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'ssr-rendering-guide'
---

现代 Web 应用有多种渲染策略可选。本文深入探讨 SSR、SSG、ISR 和 CSR 的原理与实践。

## 渲染模式对比

### 四种主要模式

```
渲染模式对比：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   CSR (Client-Side Rendering)                       │
│   ├── 浏览器下载空 HTML + JS                       │
│   ├── JS 执行后渲染内容                            │
│   ├── 首屏慢，SEO 差                               │
│   └── 适合后台管理系统                             │
│                                                     │
│   SSR (Server-Side Rendering)                       │
│   ├── 服务器生成完整 HTML                          │
│   ├── 每次请求都渲染                               │
│   ├── 首屏快，SEO 好                               │
│   └── 服务器负载高                                 │
│                                                     │
│   SSG (Static Site Generation)                      │
│   ├── 构建时生成静态 HTML                          │
│   ├── CDN 分发，速度极快                           │
│   ├── 内容更新需重新构建                           │
│   └── 适合博客、文档                               │
│                                                     │
│   ISR (Incremental Static Regeneration)             │
│   ├── 静态生成 + 增量更新                          │
│   ├── 后台自动重新生成                             │
│   ├── 兼顾性能和实时性                             │
│   └── 适合电商、新闻                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 模式 | 首屏速度 | SEO | 服务器压力 | 数据实时性 |
|------|----------|-----|------------|------------|
| CSR | 慢 | 差 | 无 | 高 |
| SSR | 快 | 好 | 高 | 高 |
| SSG | 极快 | 好 | 无 | 低 |
| ISR | 极快 | 好 | 低 | 中 |

## Next.js 实现

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

interface Props {
  product: Product;
}

export default function ProductPage({ product }: Props) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>价格: ¥{product.price}</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
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

  return {
    paths,
    fallback: false
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { slug } = context.params!;
  const res = await fetch(`https://api.example.com/posts/${slug}`);
  const post = await res.json();

  return { props: { post } };
};
```

### ISR: 增量静态再生

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
    revalidate: 60 // 60秒后后台重新生成
  };
};
```

### App Router (Next.js 13+)

```tsx
// app/products/[id]/page.tsx

// 动态渲染 (SSR)
export const dynamic = 'force-dynamic';

async function getProduct(id: string) {
  const res = await fetch(`https://api.example.com/products/${id}`, {
    cache: 'no-store' // SSR: 不缓存
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

## 数据获取策略

### 并行数据获取

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
      <Suspense fallback={<p>加载商品中...</p>}>
        <ProductList />
      </Suspense>
      <Suspense fallback={<p>加载推荐中...</p>}>
        <RecommendedProducts />
      </Suspense>
    </div>
  );
}
```

## Hydration 水合

### 理解水合过程

```tsx
// 水合：将静态 HTML 变成交互式应用
// 服务端: <button>点击次数: 0</button>
// 客户端水合后: <button onClick={handleClick}>点击次数: 0</button>

function Timer() {
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <p>当前时间: {time}</p>;
}
```

### 避免水合问题

```tsx
'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 方法1: 延迟渲染客户端内容
function ClientOnlyComponent({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;
  return <>{children}</>;
}

// 方法2: 使用 next/dynamic
const ClientSideChart = dynamic(() => import('./Chart'), {
  ssr: false,
  loading: () => <p>加载图表中...</p>
});
```

## SEO 优化

### 元数据配置

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

## 性能优化

### 缓存策略

```tsx
// 路由级别缓存
export const revalidate = 3600;

// 请求级别缓存
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600, tags: ['data'] }
  });
  return res.json();
}

// 手动重新验证
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  revalidateTag('data');
  return Response.json({ revalidated: true });
}
```

## 最佳实践总结

```
SSR 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   选择渲染模式                                      │
│   ├── 静态内容 → SSG                               │
│   ├── 动态内容 + SEO → SSR                         │
│   ├── 频繁更新 → ISR                               │
│   └── 纯交互应用 → CSR                             │
│                                                     │
│   性能优化                                          │
│   ├── 使用 Streaming SSR                           │
│   ├── 合理设置缓存策略                             │
│   ├── 并行获取数据                                 │
│   └── 延迟加载非关键组件                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐方案 |
|------|----------|
| 博客/文档 | SSG |
| 电商首页 | ISR |
| 用户仪表盘 | SSR + Streaming |
| 管理后台 | CSR |

---

*选择正确的渲染策略，让应用既快又友好。*

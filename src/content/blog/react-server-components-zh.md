---
title: 'React Server Components：重新定义全栈开发'
description: '深入理解 React Server Components 的工作原理，掌握服务端优先的 React 开发模式'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'react-server-components'
---

React Server Components (RSC) 代表了 React 架构的根本性转变。它不只是一个新特性，而是对"组件应该在哪里运行"这一问题的重新思考。本文将带你深入理解 RSC 的核心概念和实践方法。

## 为什么需要 Server Components？

### 传统 React 的困境

```
传统 React 应用流程：
┌─────────────────────────────────────────────────────┐
│ 1. 浏览器请求页面                                     │
│ 2. 服务器返回 HTML（几乎是空的）                       │
│ 3. 浏览器下载 JavaScript bundle（可能很大）           │
│ 4. JavaScript 执行，组件渲染                         │
│ 5. 组件发起 API 请求获取数据                          │
│ 6. 数据返回，重新渲染                                 │
│                                                     │
│ 问题：                                               │
│ - bundle 越来越大                                    │
│ - 瀑布式请求（先加载 JS，再请求数据）                  │
│ - 客户端需要处理所有渲染逻辑                          │
└─────────────────────────────────────────────────────┘
```

### Server Components 的解决方案

```
React Server Components 流程：
┌─────────────────────────────────────────────────────┐
│ 1. 浏览器请求页面                                     │
│ 2. 服务器运行 Server Components                      │
│    - 直接访问数据库/API                               │
│    - 渲染组件为特殊格式                               │
│ 3. 返回渲染结果 + 必要的 Client Components            │
│ 4. 浏览器展示内容，水合 Client Components             │
│                                                     │
│ 优势：                                               │
│ - 零 bundle 大小（Server Components 不发送到客户端）  │
│ - 直接数据访问（无需 API 往返）                       │
│ - 流式传输（边渲染边发送）                            │
└─────────────────────────────────────────────────────┘
```

## 核心概念

### Server Components vs Client Components

```tsx
// 默认是 Server Component
// page.tsx
async function BlogPost({ slug }: { slug: string }) {
  // 直接访问数据库！
  const post = await db.posts.findUnique({ where: { slug } });

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      {/* 嵌入 Client Component */}
      <LikeButton postId={post.id} />
    </article>
  );
}
```

```tsx
// 需要交互的组件标记为 Client Component
// LikeButton.tsx
'use client';  // 👈 这个指令很重要

import { useState } from 'react';

export function LikeButton({ postId }: { postId: string }) {
  const [likes, setLikes] = useState(0);

  return (
    <button onClick={() => setLikes(l => l + 1)}>
      ❤️ {likes}
    </button>
  );
}
```

### 组件类型对比

| 特性 | Server Component | Client Component |
|------|-----------------|------------------|
| 运行环境 | 服务器 | 浏览器 |
| 可访问后端资源 | ✅ 直接访问 | ❌ 需要 API |
| 可使用 hooks | ❌ | ✅ |
| 可添加事件监听 | ❌ | ✅ |
| 可使用浏览器 API | ❌ | ✅ |
| bundle 大小 | 0 KB | 包含在 bundle |
| 可以 async/await | ✅ | ❌（需要 use） |

## 数据获取模式

### Server Component 中的数据获取

```tsx
// ✅ 直接 async/await
async function UserProfile({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { posts: true }
  });

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <PostList posts={user.posts} />
    </div>
  );
}
```

### 并行数据获取

```tsx
async function Dashboard() {
  // 并行获取多个数据源
  const [user, posts, analytics] = await Promise.all([
    getUser(),
    getPosts(),
    getAnalytics()
  ]);

  return (
    <div>
      <UserCard user={user} />
      <PostList posts={posts} />
      <AnalyticsChart data={analytics} />
    </div>
  );
}
```

### 使用 Suspense 流式加载

```tsx
import { Suspense } from 'react';

async function Page() {
  return (
    <div>
      {/* 这部分立即显示 */}
      <Header />

      {/* 这部分流式加载 */}
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>

      {/* 这部分也可以独立加载 */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </div>
  );
}

async function Posts() {
  // 这个请求不会阻塞页面显示
  const posts = await fetchPosts();
  return <PostList posts={posts} />;
}
```

## 组件组合模式

### Server Component 嵌套 Client Component

```tsx
// ✅ Server Component 可以将 Server Component 作为 props 传递
// Layout.tsx (Server Component)
import { Sidebar } from './Sidebar';
import { InteractivePanel } from './InteractivePanel';

async function Layout() {
  const data = await fetchData();

  return (
    <div>
      {/* Client Component */}
      <InteractivePanel>
        {/* Server Component 作为 children 传入 */}
        <Sidebar data={data} />
      </InteractivePanel>
    </div>
  );
}
```

```tsx
// InteractivePanel.tsx
'use client';

import { useState, ReactNode } from 'react';

export function InteractivePanel({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        Toggle
      </button>
      {isOpen && children}
    </div>
  );
}
```

### 避免的模式

```tsx
// ❌ Client Component 不能直接导入 Server Component
'use client';

import { ServerComponent } from './ServerComponent';  // ❌ 这会报错

export function ClientComponent() {
  return <ServerComponent />;  // ❌
}

// ✅ 正确方式：通过 props 传递
'use client';

export function ClientComponent({ children }: { children: ReactNode }) {
  return <div>{children}</div>;  // ✅ children 可以是 Server Component
}
```

## Server Actions

Server Actions 让你可以直接在组件中定义服务器端的函数：

```tsx
// actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await prisma.post.create({
    data: { title, content }
  });

  revalidatePath('/posts');
  redirect('/posts');
}

export async function likePost(postId: string) {
  await prisma.post.update({
    where: { id: postId },
    data: { likes: { increment: 1 } }
  });

  revalidatePath(`/posts/${postId}`);
}
```

### 在表单中使用

```tsx
// CreatePostForm.tsx (可以是 Server Component!)
import { createPost } from './actions';

export function CreatePostForm() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="标题" required />
      <textarea name="content" placeholder="内容" required />
      <button type="submit">发布</button>
    </form>
  );
}
```

### 在 Client Component 中使用

```tsx
// LikeButton.tsx
'use client';

import { useTransition } from 'react';
import { likePost } from './actions';

export function LikeButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          likePost(postId);
        });
      }}
    >
      {isPending ? '❤️...' : '❤️ 点赞'}
    </button>
  );
}
```

## 缓存策略

### 请求去重

```tsx
// React 自动去重相同的 fetch 请求
async function Component1() {
  const data = await fetch('/api/data');  // 请求 1
  return <div>{data}</div>;
}

async function Component2() {
  const data = await fetch('/api/data');  // 自动复用请求 1 的结果
  return <div>{data}</div>;
}
```

### 缓存控制

```tsx
// Next.js 扩展的 fetch 选项
// 默认缓存
const data = await fetch('https://api.example.com/data');

// 不缓存
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store'
});

// 定时重新验证
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 }  // 60 秒后重新验证
});

// 标签化缓存
const data = await fetch('https://api.example.com/data', {
  next: { tags: ['posts'] }
});

// 按需重新验证
import { revalidateTag } from 'next/cache';
revalidateTag('posts');
```

## 实战示例：博客应用

### 目录结构

```
app/
├── layout.tsx          # Server Component
├── page.tsx            # Server Component
├── posts/
│   ├── page.tsx        # Server Component
│   ├── [slug]/
│   │   └── page.tsx    # Server Component
│   └── new/
│       └── page.tsx    # Server Component
├── components/
│   ├── Header.tsx      # Server Component
│   ├── PostCard.tsx    # Server Component
│   ├── SearchBar.tsx   # 'use client'
│   └── LikeButton.tsx  # 'use client'
└── actions/
    └── posts.ts        # 'use server'
```

### 实现代码

```tsx
// app/posts/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { LikeButton } from '@/components/LikeButton';
import { Comments } from '@/components/Comments';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const post = await getPost(params.slug);
  return { title: post?.title ?? 'Not Found' };
}

export default async function PostPage({ params }: Props) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-2xl mx-auto">
      <header>
        <h1 className="text-4xl font-bold">{post.title}</h1>
        <time className="text-gray-500">
          {post.publishedAt.toLocaleDateString()}
        </time>
      </header>

      <div className="prose mt-8">
        {post.content}
      </div>

      <footer className="mt-8 flex items-center gap-4">
        <LikeButton postId={post.id} initialLikes={post.likes} />
      </footer>

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4">评论</h2>
        <Suspense fallback={<div>加载评论中...</div>}>
          <Comments postId={post.id} />
        </Suspense>
      </section>
    </article>
  );
}

async function getPost(slug: string) {
  return prisma.post.findUnique({
    where: { slug },
    include: { author: true }
  });
}
```

## 性能对比

```
传统 SPA：
┌────────────────────────────────────────────────┐
│ JavaScript Bundle: 250KB                       │
│ 首次请求: HTML → JS → 数据 → 渲染               │
│ 总时间: ~3s                                     │
└────────────────────────────────────────────────┘

React Server Components：
┌────────────────────────────────────────────────┐
│ JavaScript Bundle: 50KB（只有 Client 部分）    │
│ 首次请求: 直接返回渲染好的内容                   │
│ 总时间: ~0.8s                                   │
│                                                 │
│ 节省: 80% JS 体积，70% 加载时间                 │
└────────────────────────────────────────────────┘
```

## 最佳实践

### 1. 默认使用 Server Components

```tsx
// ✅ 推荐：只在需要时使用 'use client'
// 大部分组件都应该是 Server Component

// ❌ 避免：把所有东西都标记为 Client Component
```

### 2. 将 Client 逻辑下推

```tsx
// ❌ 整个页面变成 Client Component
'use client';
function Page() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <Header />
      <Content />
      <Counter count={count} setCount={setCount} />
      <Footer />
    </div>
  );
}

// ✅ 只有需要交互的部分是 Client Component
function Page() {
  return (
    <div>
      <Header />
      <Content />
      <Counter />  {/* 只有这个是 'use client' */}
      <Footer />
    </div>
  );
}
```

### 3. 避免在 Client 边界传递大对象

```tsx
// ❌ 传递整个对象
<ClientComponent user={user} />

// ✅ 只传递需要的数据
<ClientComponent userName={user.name} userAvatar={user.avatar} />
```

## 总结

React Server Components 代表了 React 的未来方向：

| 方面 | 传统 React | Server Components |
|------|-----------|-------------------|
| 渲染位置 | 全部客户端 | 服务端 + 客户端 |
| 数据获取 | useEffect/SWR | 直接 async/await |
| Bundle 大小 | 全部代码 | 只有交互代码 |
| 首屏性能 | 较慢 | 极快 |

**关键收获**：

1. Server Components 默认在服务器运行，零客户端成本
2. 只有需要交互的组件使用 `'use client'`
3. Server Actions 提供了类型安全的服务器函数
4. Suspense 实现流式加载，提升用户体验
5. 合理的组件边界划分是性能的关键

RSC 不是要取代 Client Components，而是让你在合适的地方使用合适的组件类型。

---

*服务端优先，客户端增强——这就是现代 React 的哲学。*

---
title: 'GraphQL 完全指南：构建灵活高效的 API'
description: '掌握 GraphQL 核心概念与实战技巧，使用 Apollo、Schema 设计、性能优化构建现代 API'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'graphql-api-guide'
---

GraphQL 改变了我们思考 API 的方式。客户端不再被动接受服务端返回的固定数据结构，而是主动描述自己需要什么。本文将带你从零掌握 GraphQL。

## 为什么选择 GraphQL？

### REST vs GraphQL

```
REST API 的问题：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   获取用户及其帖子需要多次请求：                      │
│                                                     │
│   GET /users/1           → { id, name, email }      │
│   GET /users/1/posts     → [{ id, title }, ...]     │
│   GET /posts/1/comments  → [{ id, text }, ...]      │
│                                                     │
│   问题：                                            │
│   • Over-fetching：返回不需要的字段                  │
│   • Under-fetching：需要多次请求                    │
│   • 版本管理困难：/api/v1, /api/v2                   │
│                                                     │
└─────────────────────────────────────────────────────┘

GraphQL 解决方案：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   一次请求获取所需数据：                             │
│                                                     │
│   query {                                           │
│     user(id: 1) {                                   │
│       name                                          │
│       posts {                                       │
│         title                                       │
│         comments { text }                           │
│       }                                             │
│     }                                               │
│   }                                                 │
│                                                     │
│   优势：                                            │
│   • 精确获取：只返回请求的字段                        │
│   • 单次请求：减少网络往返                           │
│   • 强类型：Schema 定义清晰的数据契约                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 适用场景

| 场景 | 推荐 | 原因 |
|------|------|------|
| 移动端应用 | ✅ GraphQL | 带宽有限，需精确数据 |
| 复杂数据关系 | ✅ GraphQL | 嵌套查询更自然 |
| 多客户端 | ✅ GraphQL | 各端按需取数据 |
| 简单 CRUD | ⚠️ REST 可能更简单 | 过度设计 |
| 文件上传 | ⚠️ REST 更成熟 | GraphQL 支持但复杂 |
| 实时数据 | ✅ GraphQL Subscriptions | 原生支持 |

## 核心概念

### Schema 定义

```graphql
# schema.graphql

# 标量类型（内置）
# ID, String, Int, Float, Boolean

# 自定义标量
scalar DateTime
scalar Email

# 枚举类型
enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

# 对象类型
type User {
  id: ID!
  email: Email!
  name: String!
  avatar: String
  posts: [Post!]!
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  status: PostStatus!
  author: User!
  comments: [Comment!]!
  tags: [String!]!
  publishedAt: DateTime
}

type Comment {
  id: ID!
  text: String!
  author: User!
  post: Post!
  createdAt: DateTime!
}

# 输入类型（用于参数）
input CreatePostInput {
  title: String!
  content: String!
  tags: [String!]
}

input UpdatePostInput {
  title: String
  content: String
  status: PostStatus
}

# 查询类型
type Query {
  # 获取当前用户
  me: User

  # 获取单个用户
  user(id: ID!): User

  # 获取用户列表（带分页）
  users(first: Int, after: String): UserConnection!

  # 获取帖子
  post(id: ID!): Post
  posts(status: PostStatus, first: Int, after: String): PostConnection!

  # 搜索
  search(query: String!): [SearchResult!]!
}

# 变更类型
type Mutation {
  # 用户相关
  signUp(email: Email!, password: String!, name: String!): AuthPayload!
  signIn(email: Email!, password: String!): AuthPayload!

  # 帖子相关
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post!
  deletePost(id: ID!): Boolean!

  # 评论相关
  addComment(postId: ID!, text: String!): Comment!
}

# 订阅类型（实时更新）
type Subscription {
  postCreated: Post!
  commentAdded(postId: ID!): Comment!
}

# 分页（Relay 风格）
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type UserEdge {
  node: User!
  cursor: String!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

# 联合类型
union SearchResult = User | Post | Comment

# 接口类型
interface Node {
  id: ID!
}

# 认证响应
type AuthPayload {
  token: String!
  user: User!
}
```

### 类型系统详解

```
GraphQL 类型系统：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   标量类型 (Scalar)                                  │
│   ├── ID      → 唯一标识符                          │
│   ├── String  → UTF-8 字符串                        │
│   ├── Int     → 32 位整数                           │
│   ├── Float   → 双精度浮点数                        │
│   └── Boolean → true/false                         │
│                                                     │
│   类型修饰符                                         │
│   ├── Type!   → 非空（必须有值）                    │
│   ├── [Type]  → 列表（可为 null）                   │
│   └── [Type!]!→ 非空列表，元素也非空                 │
│                                                     │
│   示例：                                            │
│   String      → null 或 "hello"                    │
│   String!     → "hello"（不能是 null）              │
│   [String]    → null 或 [] 或 ["a", null]          │
│   [String!]!  → [] 或 ["a", "b"]                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 服务端实现

### Apollo Server 设置

```typescript
// src/index.ts
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import { readFileSync } from 'fs';
import { resolvers } from './resolvers';
import { createContext } from './context';

const typeDefs = readFileSync('./schema.graphql', 'utf-8');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
});

async function startServer() {
  await server.start();

  const app = express();

  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: createContext,
    })
  );

  app.listen(4000, () => {
    console.log('Server running at http://localhost:4000/graphql');
  });
}

startServer();
```

### Context 设置

```typescript
// src/context.ts
import { PrismaClient } from '@prisma/client';
import { verifyToken } from './auth';

const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  userId: string | null;
}

export async function createContext({ req }): Promise<Context> {
  const token = req.headers.authorization?.replace('Bearer ', '');

  let userId = null;
  if (token) {
    try {
      const payload = verifyToken(token);
      userId = payload.userId;
    } catch (e) {
      // Token 无效，继续以未认证状态
    }
  }

  return { prisma, userId };
}
```

### Resolver 实现

```typescript
// src/resolvers/index.ts
import { userResolvers } from './user';
import { postResolvers } from './post';
import { commentResolvers } from './comment';
import { scalarResolvers } from './scalars';

export const resolvers = {
  ...scalarResolvers,

  Query: {
    ...userResolvers.Query,
    ...postResolvers.Query,
  },

  Mutation: {
    ...userResolvers.Mutation,
    ...postResolvers.Mutation,
    ...commentResolvers.Mutation,
  },

  Subscription: {
    ...postResolvers.Subscription,
    ...commentResolvers.Subscription,
  },

  // 类型 Resolver
  User: userResolvers.User,
  Post: postResolvers.Post,
  Comment: commentResolvers.Comment,

  // 联合类型
  SearchResult: {
    __resolveType(obj) {
      if (obj.email) return 'User';
      if (obj.title) return 'Post';
      if (obj.text) return 'Comment';
      return null;
    },
  },
};
```

```typescript
// src/resolvers/user.ts
import { Context } from '../context';
import { hashPassword, comparePassword, generateToken } from '../auth';

export const userResolvers = {
  Query: {
    me: async (_, __, { prisma, userId }: Context) => {
      if (!userId) return null;
      return prisma.user.findUnique({ where: { id: userId } });
    },

    user: async (_, { id }, { prisma }: Context) => {
      return prisma.user.findUnique({ where: { id } });
    },

    users: async (_, { first = 10, after }, { prisma }: Context) => {
      const users = await prisma.user.findMany({
        take: first + 1,
        cursor: after ? { id: after } : undefined,
        skip: after ? 1 : 0,
        orderBy: { createdAt: 'desc' },
      });

      const hasNextPage = users.length > first;
      const edges = users.slice(0, first).map(user => ({
        node: user,
        cursor: user.id,
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount: await prisma.user.count(),
      };
    },
  },

  Mutation: {
    signUp: async (_, { email, password, name }, { prisma }: Context) => {
      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name },
      });

      const token = generateToken(user.id);

      return { token, user };
    },

    signIn: async (_, { email, password }, { prisma }: Context) => {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        throw new Error('User not found');
      }

      const valid = await comparePassword(password, user.password);

      if (!valid) {
        throw new Error('Invalid password');
      }

      const token = generateToken(user.id);

      return { token, user };
    },
  },

  User: {
    posts: async (parent, _, { prisma }: Context) => {
      return prisma.post.findMany({
        where: { authorId: parent.id },
      });
    },
  },
};
```

```typescript
// src/resolvers/post.ts
import { PubSub } from 'graphql-subscriptions';
import { Context } from '../context';

const pubsub = new PubSub();

export const postResolvers = {
  Query: {
    post: async (_, { id }, { prisma }: Context) => {
      return prisma.post.findUnique({ where: { id } });
    },

    posts: async (_, { status, first = 10, after }, { prisma }: Context) => {
      const where = status ? { status } : {};

      const posts = await prisma.post.findMany({
        where,
        take: first + 1,
        cursor: after ? { id: after } : undefined,
        skip: after ? 1 : 0,
        orderBy: { createdAt: 'desc' },
      });

      const hasNextPage = posts.length > first;
      const edges = posts.slice(0, first).map(post => ({
        node: post,
        cursor: post.id,
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount: await prisma.post.count({ where }),
      };
    },

    search: async (_, { query }, { prisma }: Context) => {
      const users = await prisma.user.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
      });

      const posts = await prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
      });

      return [...users, ...posts];
    },
  },

  Mutation: {
    createPost: async (_, { input }, { prisma, userId }: Context) => {
      if (!userId) throw new Error('Not authenticated');

      const post = await prisma.post.create({
        data: {
          ...input,
          status: 'DRAFT',
          authorId: userId,
        },
      });

      pubsub.publish('POST_CREATED', { postCreated: post });

      return post;
    },

    updatePost: async (_, { id, input }, { prisma, userId }: Context) => {
      if (!userId) throw new Error('Not authenticated');

      const post = await prisma.post.findUnique({ where: { id } });

      if (!post || post.authorId !== userId) {
        throw new Error('Post not found or not authorized');
      }

      return prisma.post.update({
        where: { id },
        data: input,
      });
    },

    deletePost: async (_, { id }, { prisma, userId }: Context) => {
      if (!userId) throw new Error('Not authenticated');

      const post = await prisma.post.findUnique({ where: { id } });

      if (!post || post.authorId !== userId) {
        throw new Error('Post not found or not authorized');
      }

      await prisma.post.delete({ where: { id } });
      return true;
    },
  },

  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterableIterator(['POST_CREATED']),
    },
  },

  Post: {
    author: async (parent, _, { prisma }: Context) => {
      return prisma.user.findUnique({ where: { id: parent.authorId } });
    },

    comments: async (parent, _, { prisma }: Context) => {
      return prisma.comment.findMany({ where: { postId: parent.id } });
    },
  },
};
```

### 自定义标量

```typescript
// src/resolvers/scalars.ts
import { GraphQLScalarType, Kind } from 'graphql';

export const scalarResolvers = {
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'ISO-8601 datetime string',

    serialize(value: Date): string {
      return value.toISOString();
    },

    parseValue(value: string): Date {
      return new Date(value);
    },

    parseLiteral(ast): Date | null {
      if (ast.kind === Kind.STRING) {
        return new Date(ast.value);
      }
      return null;
    },
  }),

  Email: new GraphQLScalarType({
    name: 'Email',
    description: 'Valid email address',

    serialize(value: string): string {
      return value;
    },

    parseValue(value: string): string {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new Error('Invalid email format');
      }
      return value.toLowerCase();
    },

    parseLiteral(ast): string | null {
      if (ast.kind === Kind.STRING) {
        return this.parseValue(ast.value);
      }
      return null;
    },
  }),
};
```

## 客户端实现

### Apollo Client 设置

```typescript
// src/lib/apollo.ts
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql',
    connectionParams: () => ({
      authorization: localStorage.getItem('token'),
    }),
  })
);

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// 根据操作类型选择链接
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            // 合并分页结果
            keyArgs: ['status'],
            merge(existing, incoming, { args }) {
              if (!args?.after) {
                return incoming;
              }
              return {
                ...incoming,
                edges: [...(existing?.edges || []), ...incoming.edges],
              };
            },
          },
        },
      },
    },
  }),
});
```

### React Hooks 使用

```tsx
// src/hooks/useUser.ts
import { gql, useQuery, useMutation } from '@apollo/client';

const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      avatar
    }
  }
`;

const SIGN_IN_MUTATION = gql`
  mutation SignIn($email: Email!, $password: String!) {
    signIn(email: $email, password: $password) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

export function useCurrentUser() {
  const { data, loading, error } = useQuery(ME_QUERY);
  return { user: data?.me, loading, error };
}

export function useSignIn() {
  const [signIn, { loading, error }] = useMutation(SIGN_IN_MUTATION, {
    onCompleted: (data) => {
      localStorage.setItem('token', data.signIn.token);
    },
    refetchQueries: [{ query: ME_QUERY }],
  });

  return { signIn, loading, error };
}
```

```tsx
// src/hooks/usePosts.ts
import { gql, useQuery, useMutation, useSubscription } from '@apollo/client';

const POSTS_QUERY = gql`
  query Posts($status: PostStatus, $first: Int, $after: String) {
    posts(status: $status, first: $first, after: $after) {
      edges {
        node {
          id
          title
          content
          status
          author {
            id
            name
          }
          publishedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

const CREATE_POST_MUTATION = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      content
      status
    }
  }
`;

const POST_CREATED_SUBSCRIPTION = gql`
  subscription OnPostCreated {
    postCreated {
      id
      title
      author {
        name
      }
    }
  }
`;

export function usePosts(status?: string) {
  const { data, loading, error, fetchMore } = useQuery(POSTS_QUERY, {
    variables: { status, first: 10 },
  });

  const loadMore = () => {
    if (data?.posts.pageInfo.hasNextPage) {
      fetchMore({
        variables: {
          after: data.posts.pageInfo.endCursor,
        },
      });
    }
  };

  return {
    posts: data?.posts.edges.map(e => e.node) || [],
    pageInfo: data?.posts.pageInfo,
    totalCount: data?.posts.totalCount,
    loading,
    error,
    loadMore,
  };
}

export function useCreatePost() {
  const [createPost, { loading, error }] = useMutation(CREATE_POST_MUTATION, {
    update(cache, { data: { createPost } }) {
      // 更新缓存
      cache.modify({
        fields: {
          posts(existingPosts = { edges: [] }) {
            const newPostRef = cache.writeFragment({
              data: createPost,
              fragment: gql`
                fragment NewPost on Post {
                  id
                  title
                  content
                  status
                }
              `,
            });
            return {
              ...existingPosts,
              edges: [{ node: newPostRef }, ...existingPosts.edges],
            };
          },
        },
      });
    },
  });

  return { createPost, loading, error };
}

export function usePostCreatedSubscription() {
  const { data, loading } = useSubscription(POST_CREATED_SUBSCRIPTION);
  return { newPost: data?.postCreated, loading };
}
```

### 组件使用

```tsx
// src/components/PostList.tsx
import { usePosts, usePostCreatedSubscription } from '../hooks/usePosts';

export function PostList() {
  const { posts, loading, error, loadMore, pageInfo } = usePosts('PUBLISHED');
  const { newPost } = usePostCreatedSubscription();

  if (loading && posts.length === 0) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {newPost && (
        <div className="notification">
          New post by {newPost.author.name}: {newPost.title}
        </div>
      )}

      <ul>
        {posts.map(post => (
          <li key={post.id}>
            <h3>{post.title}</h3>
            <p>By {post.author.name}</p>
          </li>
        ))}
      </ul>

      {pageInfo?.hasNextPage && (
        <button onClick={loadMore}>Load More</button>
      )}
    </div>
  );
}
```

## 性能优化

### N+1 问题与 DataLoader

```
N+1 问题：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   查询：                                            │
│   query {                                           │
│     posts {           ← 1 次查询获取 10 个帖子       │
│       author {        ← 每个帖子再查一次作者         │
│         name          = 10 次查询！                  │
│       }                                             │
│     }                                               │
│   }                                                 │
│                                                     │
│   总计：1 + 10 = 11 次数据库查询 ❌                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

```typescript
// src/loaders/index.ts
import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

export function createLoaders(prisma: PrismaClient) {
  return {
    userLoader: new DataLoader(async (ids: readonly string[]) => {
      const users = await prisma.user.findMany({
        where: { id: { in: [...ids] } },
      });

      // 保持顺序
      const userMap = new Map(users.map(u => [u.id, u]));
      return ids.map(id => userMap.get(id) || null);
    }),

    postsByAuthorLoader: new DataLoader(async (authorIds: readonly string[]) => {
      const posts = await prisma.post.findMany({
        where: { authorId: { in: [...authorIds] } },
      });

      // 按作者分组
      const postsByAuthor = new Map<string, typeof posts>();
      posts.forEach(post => {
        const existing = postsByAuthor.get(post.authorId) || [];
        postsByAuthor.set(post.authorId, [...existing, post]);
      });

      return authorIds.map(id => postsByAuthor.get(id) || []);
    }),
  };
}

// 在 Context 中使用
export async function createContext({ req }): Promise<Context> {
  return {
    prisma,
    userId: /* ... */,
    loaders: createLoaders(prisma),
  };
}

// 在 Resolver 中使用
Post: {
  author: (parent, _, { loaders }) => {
    return loaders.userLoader.load(parent.authorId);
  },
},
```

### 查询复杂度限制

```typescript
import { createComplexityLimitRule } from 'graphql-validation-complexity';

const complexityLimitRule = createComplexityLimitRule(1000, {
  onCost: (cost) => {
    console.log('Query cost:', cost);
  },
  formatErrorMessage: (cost) =>
    `Query complexity ${cost} exceeds maximum allowed 1000`,
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [complexityLimitRule],
});
```

### 查询深度限制

```typescript
import depthLimit from 'graphql-depth-limit';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(5)],
});
```

### 持久化查询

```typescript
// 客户端
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { sha256 } from 'crypto-hash';

const persistedQueryLink = createPersistedQueryLink({
  sha256,
  useGETForHashedQueries: true,
});

const link = persistedQueryLink.concat(httpLink);

// 服务端自动支持
```

## 错误处理

### 错误类型

```typescript
// src/errors.ts
import { GraphQLError } from 'graphql';

export class AuthenticationError extends GraphQLError {
  constructor(message = 'Not authenticated') {
    super(message, {
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    });
  }
}

export class ForbiddenError extends GraphQLError {
  constructor(message = 'Not authorized') {
    super(message, {
      extensions: {
        code: 'FORBIDDEN',
      },
    });
  }
}

export class ValidationError extends GraphQLError {
  constructor(message: string, field: string) {
    super(message, {
      extensions: {
        code: 'VALIDATION_ERROR',
        field,
      },
    });
  }
}

export class NotFoundError extends GraphQLError {
  constructor(resource: string) {
    super(`${resource} not found`, {
      extensions: {
        code: 'NOT_FOUND',
        resource,
      },
    });
  }
}
```

### 错误格式化

```typescript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    // 在生产环境隐藏内部错误
    if (process.env.NODE_ENV === 'production') {
      if (formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR') {
        return {
          message: 'Internal server error',
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        };
      }
    }

    return formattedError;
  },
});
```

### 客户端错误处理

```typescript
import { onError } from '@apollo/client/link/error';

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      switch (extensions?.code) {
        case 'UNAUTHENTICATED':
          // 重定向到登录
          window.location.href = '/login';
          break;
        case 'FORBIDDEN':
          // 显示权限错误
          toast.error('You do not have permission');
          break;
        default:
          console.error(`[GraphQL error]: ${message}`);
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    toast.error('Network error, please try again');
  }
});

const link = errorLink.concat(authLink).concat(httpLink);
```

## 测试

### Resolver 单元测试

```typescript
// src/resolvers/__tests__/user.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userResolvers } from '../user';

describe('User Resolvers', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Query.me', () => {
    it('should return null when not authenticated', async () => {
      const result = await userResolvers.Query.me(
        null,
        {},
        { prisma: mockPrisma, userId: null }
      );

      expect(result).toBeNull();
    });

    it('should return user when authenticated', async () => {
      const mockUser = { id: '1', name: 'Alice', email: 'alice@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userResolvers.Query.me(
        null,
        {},
        { prisma: mockPrisma, userId: '1' }
      );

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
```

### 集成测试

```typescript
// src/__tests__/integration.test.ts
import { ApolloServer } from '@apollo/server';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { typeDefs, resolvers } from '../schema';
import { createTestContext } from './utils';

describe('GraphQL Integration', () => {
  let server: ApolloServer;

  beforeAll(async () => {
    server = new ApolloServer({ typeDefs, resolvers });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should create and query a post', async () => {
    const context = createTestContext({ userId: '1' });

    // 创建帖子
    const createResult = await server.executeOperation(
      {
        query: `
          mutation CreatePost($input: CreatePostInput!) {
            createPost(input: $input) {
              id
              title
              content
            }
          }
        `,
        variables: {
          input: { title: 'Test Post', content: 'Content' },
        },
      },
      { contextValue: context }
    );

    expect(createResult.body.kind).toBe('single');
    const postId = createResult.body.singleResult.data?.createPost.id;

    // 查询帖子
    const queryResult = await server.executeOperation(
      {
        query: `
          query Post($id: ID!) {
            post(id: $id) {
              id
              title
              content
            }
          }
        `,
        variables: { id: postId },
      },
      { contextValue: context }
    );

    expect(queryResult.body.singleResult.data?.post.title).toBe('Test Post');
  });
});
```

## 最佳实践总结

```
GraphQL 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Schema 设计                                       │
│   ├── 使用描述性的类型和字段名                       │
│   ├── 为所有可能为空的字段添加说明                   │
│   ├── 使用输入类型处理复杂参数                       │
│   └── 采用 Relay 风格的分页                         │
│                                                     │
│   性能优化                                          │
│   ├── 使用 DataLoader 解决 N+1                      │
│   ├── 限制查询复杂度和深度                          │
│   ├── 使用持久化查询减少带宽                        │
│   └── 合理设置缓存策略                              │
│                                                     │
│   安全性                                            │
│   ├── 认证在 Context 层处理                         │
│   ├── 授权在 Resolver 层检查                        │
│   ├── 生产环境禁用内省                              │
│   └── 限制批量操作大小                              │
│                                                     │
│   开发体验                                          │
│   ├── 使用 GraphQL Code Generator                   │
│   ├── 编写完整的类型定义                            │
│   └── 提供详尽的错误信息                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 方面 | REST | GraphQL |
|------|------|---------|
| 数据获取 | 多端点，固定结构 | 单端点，按需获取 |
| 版本管理 | URL 版本 | Schema 演进 |
| 类型安全 | 依赖文档 | 内置类型系统 |
| 实时更新 | 需要 WebSocket | 原生 Subscriptions |
| 缓存 | HTTP 缓存成熟 | 需要客户端缓存 |
| 学习曲线 | 简单 | 稍陡 |

GraphQL 不是 REST 的替代品，而是在特定场景下的更好选择。选择适合你项目需求的方案。

---

*好的 API 是产品的一部分。让客户端决定需要什么，是对开发者体验的尊重。*

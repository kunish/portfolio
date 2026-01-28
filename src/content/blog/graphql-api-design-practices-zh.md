---
title: 'GraphQL API 设计与实践：构建灵活高效的数据接口'
description: '掌握 GraphQL Schema 设计、查询优化、N+1 问题解决和安全实践'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'graphql-api-design-practices'
---

GraphQL 正在改变我们构建 API 的方式。本文深入探讨 GraphQL 的设计原则和最佳实践。

## GraphQL vs REST

### 架构对比

```
GraphQL vs REST：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   REST                                              │
│   ├── 多个端点 (/users, /posts, /comments)         │
│   ├── 固定数据结构                                  │
│   ├── 过度获取或获取不足                            │
│   └── 版本控制 (/v1, /v2)                          │
│                                                     │
│   GraphQL                                           │
│   ├── 单一端点 (/graphql)                          │
│   ├── 客户端定义数据需求                            │
│   ├── 精确获取所需数据                              │
│   └── 演进式 Schema                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 特性 | REST | GraphQL |
|------|------|---------|
| 端点数量 | 多个 | 单一 |
| 数据获取 | 固定结构 | 按需获取 |
| 类型系统 | 可选 | 强制 |
| 实时更新 | 轮询/WebSocket | Subscriptions |
| 缓存 | HTTP 缓存 | 客户端缓存 |

## Schema 设计

### 类型定义

```graphql
# schema.graphql

# 标量类型扩展
scalar DateTime
scalar Email
scalar URL

# 用户类型
type User {
  id: ID!
  email: Email!
  name: String!
  avatar: URL
  role: UserRole!
  posts(first: Int, after: String): PostConnection!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum UserRole {
  ADMIN
  EDITOR
  VIEWER
}

# 文章类型
type Post {
  id: ID!
  title: String!
  content: String!
  excerpt: String
  status: PostStatus!
  author: User!
  tags: [Tag!]!
  comments(first: Int, after: String): CommentConnection!
  publishedAt: DateTime
  createdAt: DateTime!
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

# 分页连接
type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PostEdge {
  node: Post!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### 查询和变更

```graphql
type Query {
  # 用户查询
  me: User
  user(id: ID!): User
  users(
    first: Int
    after: String
    filter: UserFilter
    orderBy: UserOrderBy
  ): UserConnection!

  # 文章查询
  post(id: ID!): Post
  posts(
    first: Int
    after: String
    filter: PostFilter
    orderBy: PostOrderBy
  ): PostConnection!

  # 搜索
  search(query: String!, type: SearchType): SearchResult!
}

input UserFilter {
  role: UserRole
  createdAfter: DateTime
  createdBefore: DateTime
}

input UserOrderBy {
  field: UserSortField!
  direction: SortDirection!
}

enum UserSortField {
  CREATED_AT
  NAME
  EMAIL
}

enum SortDirection {
  ASC
  DESC
}

type Mutation {
  # 用户操作
  createUser(input: CreateUserInput!): CreateUserPayload!
  updateUser(id: ID!, input: UpdateUserInput!): UpdateUserPayload!
  deleteUser(id: ID!): DeleteUserPayload!

  # 文章操作
  createPost(input: CreatePostInput!): CreatePostPayload!
  updatePost(id: ID!, input: UpdatePostInput!): UpdatePostPayload!
  publishPost(id: ID!): PublishPostPayload!
  deletePost(id: ID!): DeletePostPayload!
}

# 输入类型
input CreateUserInput {
  email: Email!
  name: String!
  password: String!
  role: UserRole = VIEWER
}

# 响应类型（包含错误处理）
type CreateUserPayload {
  user: User
  errors: [UserError!]!
}

type UserError {
  field: String
  message: String!
  code: ErrorCode!
}

enum ErrorCode {
  INVALID_INPUT
  NOT_FOUND
  UNAUTHORIZED
  CONFLICT
}
```

## Resolver 实现

### 基础 Resolver

```typescript
import { Resolvers } from './generated/graphql';

export const resolvers: Resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) return null;
      return user;
    },

    user: async (_, { id }, { dataSources }) => {
      return dataSources.userAPI.getUser(id);
    },

    users: async (_, { first, after, filter, orderBy }, { dataSources }) => {
      return dataSources.userAPI.getUsers({
        first: first ?? 20,
        after,
        filter,
        orderBy,
      });
    },

    post: async (_, { id }, { dataSources }) => {
      return dataSources.postAPI.getPost(id);
    },
  },

  Mutation: {
    createUser: async (_, { input }, { dataSources }) => {
      try {
        const user = await dataSources.userAPI.createUser(input);
        return { user, errors: [] };
      } catch (error) {
        return {
          user: null,
          errors: [{ message: error.message, code: 'INVALID_INPUT' }],
        };
      }
    },

    updatePost: async (_, { id, input }, { dataSources, user }) => {
      const post = await dataSources.postAPI.getPost(id);

      if (!post) {
        return {
          post: null,
          errors: [{ message: 'Post not found', code: 'NOT_FOUND' }],
        };
      }

      if (post.authorId !== user.id && user.role !== 'ADMIN') {
        return {
          post: null,
          errors: [{ message: 'Not authorized', code: 'UNAUTHORIZED' }],
        };
      }

      const updated = await dataSources.postAPI.updatePost(id, input);
      return { post: updated, errors: [] };
    },
  },

  // 字段级 Resolver
  User: {
    posts: async (user, { first, after }, { dataSources }) => {
      return dataSources.postAPI.getPostsByAuthor(user.id, { first, after });
    },
  },

  Post: {
    author: async (post, _, { dataSources }) => {
      return dataSources.userAPI.getUser(post.authorId);
    },

    tags: async (post, _, { dataSources }) => {
      return dataSources.tagAPI.getTagsByPost(post.id);
    },
  },
};
```

### Context 设置

```typescript
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

interface Context {
  user: User | null;
  dataSources: DataSources;
}

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
});

await server.start();

app.use(
  '/graphql',
  expressMiddleware(server, {
    context: async ({ req }) => {
      // 认证
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = token ? await verifyToken(token) : null;

      // 数据源
      const dataSources = {
        userAPI: new UserDataSource(),
        postAPI: new PostDataSource(),
        tagAPI: new TagDataSource(),
      };

      return { user, dataSources };
    },
  })
);
```

## N+1 问题解决

### DataLoader 使用

```typescript
import DataLoader from 'dataloader';

// 批量加载用户
const userLoader = new DataLoader<string, User>(async (ids) => {
  const users = await prisma.user.findMany({
    where: { id: { in: [...ids] } },
  });

  // 保持顺序
  const userMap = new Map(users.map(u => [u.id, u]));
  return ids.map(id => userMap.get(id) || null);
});

// 批量加载文章
const postsByAuthorLoader = new DataLoader<string, Post[]>(async (authorIds) => {
  const posts = await prisma.post.findMany({
    where: { authorId: { in: [...authorIds] } },
  });

  const postMap = new Map<string, Post[]>();
  for (const post of posts) {
    if (!postMap.has(post.authorId)) {
      postMap.set(post.authorId, []);
    }
    postMap.get(post.authorId)!.push(post);
  }

  return authorIds.map(id => postMap.get(id) || []);
});

// 在 Context 中创建 DataLoader
const createLoaders = () => ({
  userLoader: new DataLoader(batchUsers),
  postsByAuthorLoader: new DataLoader(batchPostsByAuthor),
  tagsByPostLoader: new DataLoader(batchTagsByPost),
});

// Resolver 中使用
const resolvers = {
  Post: {
    author: (post, _, { loaders }) => {
      return loaders.userLoader.load(post.authorId);
    },
  },
  User: {
    posts: (user, _, { loaders }) => {
      return loaders.postsByAuthorLoader.load(user.id);
    },
  },
};
```

### 查询复杂度分析

```typescript
import { createComplexityLimitRule } from 'graphql-validation-complexity';

const complexityLimit = createComplexityLimitRule(1000, {
  scalarCost: 1,
  objectCost: 2,
  listFactor: 10,

  // 自定义字段成本
  formatErrorMessage: (cost) =>
    `Query complexity ${cost} exceeds maximum allowed complexity of 1000`,
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [complexityLimit],
});

// 或使用 graphql-query-complexity
import { getComplexity, simpleEstimator, fieldExtensionsEstimator } from 'graphql-query-complexity';

const complexityPlugin = {
  requestDidStart: () => ({
    didResolveOperation({ request, document }) {
      const complexity = getComplexity({
        schema,
        query: document,
        variables: request.variables,
        estimators: [
          fieldExtensionsEstimator(),
          simpleEstimator({ defaultComplexity: 1 }),
        ],
      });

      if (complexity > 1000) {
        throw new Error(`Query complexity ${complexity} exceeds limit`);
      }
    },
  }),
};
```

## 分页实现

### Cursor 分页

```typescript
// 编码/解码 Cursor
function encodeCursor(data: { id: string; createdAt: Date }): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

function decodeCursor(cursor: string): { id: string; createdAt: Date } {
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
}

// 分页查询
async function getPosts({
  first = 20,
  after,
  filter,
  orderBy,
}: PaginationArgs): Promise<PostConnection> {
  const limit = Math.min(first, 100);

  let whereClause: any = { ...filter };

  if (after) {
    const cursor = decodeCursor(after);
    whereClause = {
      ...whereClause,
      OR: [
        { createdAt: { lt: cursor.createdAt } },
        {
          createdAt: cursor.createdAt,
          id: { lt: cursor.id },
        },
      ],
    };
  }

  const posts = await prisma.post.findMany({
    where: whereClause,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1, // 多取一条判断是否有下一页
  });

  const hasNextPage = posts.length > limit;
  const edges = posts.slice(0, limit).map(post => ({
    node: post,
    cursor: encodeCursor({ id: post.id, createdAt: post.createdAt }),
  }));

  const totalCount = await prisma.post.count({ where: filter });

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage: !!after,
      startCursor: edges[0]?.cursor,
      endCursor: edges[edges.length - 1]?.cursor,
    },
    totalCount,
  };
}
```

## 实时订阅

```typescript
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

// Schema
const typeDefs = `
  type Subscription {
    postCreated: Post!
    postUpdated(id: ID): Post!
    commentAdded(postId: ID!): Comment!
  }
`;

// Resolver
const resolvers = {
  Mutation: {
    createPost: async (_, { input }, { dataSources, user }) => {
      const post = await dataSources.postAPI.createPost({
        ...input,
        authorId: user.id,
      });

      // 发布事件
      pubsub.publish('POST_CREATED', { postCreated: post });

      return { post, errors: [] };
    },

    addComment: async (_, { postId, content }, { dataSources, user }) => {
      const comment = await dataSources.commentAPI.create({
        postId,
        content,
        authorId: user.id,
      });

      pubsub.publish(`COMMENT_ADDED_${postId}`, { commentAdded: comment });

      return { comment, errors: [] };
    },
  },

  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterator(['POST_CREATED']),
    },

    postUpdated: {
      subscribe: (_, { id }) => {
        if (id) {
          return pubsub.asyncIterator([`POST_UPDATED_${id}`]);
        }
        return pubsub.asyncIterator(['POST_UPDATED']);
      },
    },

    commentAdded: {
      subscribe: (_, { postId }) => {
        return pubsub.asyncIterator([`COMMENT_ADDED_${postId}`]);
      },
    },
  },
};
```

## 安全实践

### 查询深度限制

```typescript
import depthLimit from 'graphql-depth-limit';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    depthLimit(10), // 最大查询深度
  ],
});
```

### 字段级权限

```typescript
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';

// 定义权限指令
const typeDefs = `
  directive @auth(requires: Role = ADMIN) on FIELD_DEFINITION

  type Query {
    publicData: String
    sensitiveData: String @auth(requires: ADMIN)
    userData: User @auth(requires: VIEWER)
  }
`;

// 实现权限检查
function authDirectiveTransformer(schema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0];

      if (authDirective) {
        const { requires } = authDirective;
        const originalResolver = fieldConfig.resolve;

        fieldConfig.resolve = async (source, args, context, info) => {
          if (!context.user) {
            throw new Error('Authentication required');
          }

          if (!hasRole(context.user, requires)) {
            throw new Error('Insufficient permissions');
          }

          return originalResolver(source, args, context, info);
        };
      }

      return fieldConfig;
    },
  });
}
```

### 速率限制

```typescript
import { rateLimitDirective } from 'graphql-rate-limit-directive';

const { rateLimitDirectiveTypeDefs, rateLimitDirectiveTransformer } =
  rateLimitDirective();

const typeDefs = `
  ${rateLimitDirectiveTypeDefs}

  type Query {
    search(query: String!): [Result!]! @rateLimit(limit: 10, duration: 60)
  }

  type Mutation {
    createPost(input: CreatePostInput!): Post! @rateLimit(limit: 5, duration: 60)
    sendMessage(to: ID!, content: String!): Message! @rateLimit(limit: 20, duration: 60)
  }
`;

const schema = rateLimitDirectiveTransformer(
  makeExecutableSchema({ typeDefs, resolvers })
);
```

## 最佳实践总结

```
GraphQL 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Schema 设计                                       │
│   ├── 使用一致的命名约定                            │
│   ├── 实现 Relay 分页规范                           │
│   ├── 使用 Input 类型和 Payload 类型               │
│   └── 添加有意义的描述                              │
│                                                     │
│   性能优化                                          │
│   ├── 使用 DataLoader 解决 N+1                     │
│   ├── 实现查询复杂度限制                            │
│   ├── 持久化查询                                    │
│   └── 响应缓存                                      │
│                                                     │
│   安全性                                            │
│   ├── 深度限制                                      │
│   ├── 复杂度限制                                    │
│   ├── 速率限制                                      │
│   └── 字段级权限                                    │
│                                                     │
│   开发体验                                          │
│   ├── 代码生成                                      │
│   ├── Schema 版本控制                               │
│   ├── 文档自动生成                                  │
│   └── 错误处理标准化                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 推荐方案 |
|------|----------|
| 移动应用 | GraphQL（减少请求） |
| 微服务聚合 | GraphQL Federation |
| 公开 API | REST（缓存友好） |
| 实时功能 | GraphQL Subscriptions |
| 复杂查询 | GraphQL + DataLoader |

GraphQL 提供了强大的灵活性，但也需要谨慎设计。理解其特性，扬长避短，构建高效的 API。

---

*API 是系统的门面，GraphQL 让这个门面更加灵活优雅。*

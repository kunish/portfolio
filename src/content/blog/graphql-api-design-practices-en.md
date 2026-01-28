---
title: 'GraphQL API Design and Practices: Building Flexible and Efficient Data Interfaces'
description: 'Master GraphQL Schema design, query optimization, N+1 problem solutions and security practices'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'en'
translationKey: 'graphql-api-design-practices'
---

GraphQL is transforming how we build APIs. This article explores GraphQL design principles and best practices.

## GraphQL vs REST

### Architecture Comparison

```
GraphQL vs REST:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   REST                                              │
│   ├── Multiple endpoints (/users, /posts, etc.)   │
│   ├── Fixed data structures                        │
│   ├── Over-fetching or under-fetching             │
│   └── Versioning (/v1, /v2)                        │
│                                                     │
│   GraphQL                                           │
│   ├── Single endpoint (/graphql)                   │
│   ├── Client defines data requirements            │
│   ├── Fetch exactly what you need                 │
│   └── Evolving Schema                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Feature | REST | GraphQL |
|---------|------|---------|
| Endpoints | Multiple | Single |
| Data Fetching | Fixed structure | On-demand |
| Type System | Optional | Required |
| Real-time | Polling/WebSocket | Subscriptions |
| Caching | HTTP caching | Client caching |

## Schema Design

### Type Definitions

```graphql
# schema.graphql

# Extended scalar types
scalar DateTime
scalar Email
scalar URL

# User type
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

# Post type
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

# Pagination connection
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

### Queries and Mutations

```graphql
type Query {
  # User queries
  me: User
  user(id: ID!): User
  users(
    first: Int
    after: String
    filter: UserFilter
    orderBy: UserOrderBy
  ): UserConnection!

  # Post queries
  post(id: ID!): Post
  posts(
    first: Int
    after: String
    filter: PostFilter
    orderBy: PostOrderBy
  ): PostConnection!

  # Search
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
  # User operations
  createUser(input: CreateUserInput!): CreateUserPayload!
  updateUser(id: ID!, input: UpdateUserInput!): UpdateUserPayload!
  deleteUser(id: ID!): DeleteUserPayload!

  # Post operations
  createPost(input: CreatePostInput!): CreatePostPayload!
  updatePost(id: ID!, input: UpdatePostInput!): UpdatePostPayload!
  publishPost(id: ID!): PublishPostPayload!
  deletePost(id: ID!): DeletePostPayload!
}

# Input types
input CreateUserInput {
  email: Email!
  name: String!
  password: String!
  role: UserRole = VIEWER
}

# Response types (with error handling)
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

## Resolver Implementation

### Basic Resolvers

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

  // Field-level resolvers
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

### Context Setup

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
      // Authentication
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = token ? await verifyToken(token) : null;

      // Data sources
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

## Solving the N+1 Problem

### Using DataLoader

```typescript
import DataLoader from 'dataloader';

// Batch load users
const userLoader = new DataLoader<string, User>(async (ids) => {
  const users = await prisma.user.findMany({
    where: { id: { in: [...ids] } },
  });

  // Maintain order
  const userMap = new Map(users.map(u => [u.id, u]));
  return ids.map(id => userMap.get(id) || null);
});

// Batch load posts by author
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

// Create DataLoaders in Context
const createLoaders = () => ({
  userLoader: new DataLoader(batchUsers),
  postsByAuthorLoader: new DataLoader(batchPostsByAuthor),
  tagsByPostLoader: new DataLoader(batchTagsByPost),
});

// Use in resolvers
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

### Query Complexity Analysis

```typescript
import { createComplexityLimitRule } from 'graphql-validation-complexity';

const complexityLimit = createComplexityLimitRule(1000, {
  scalarCost: 1,
  objectCost: 2,
  listFactor: 10,

  // Custom field costs
  formatErrorMessage: (cost) =>
    `Query complexity ${cost} exceeds maximum allowed complexity of 1000`,
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [complexityLimit],
});

// Or use graphql-query-complexity
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

## Pagination Implementation

### Cursor-Based Pagination

```typescript
// Encode/decode cursor
function encodeCursor(data: { id: string; createdAt: Date }): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

function decodeCursor(cursor: string): { id: string; createdAt: Date } {
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
}

// Paginated query
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
    take: limit + 1, // Fetch one extra to check for next page
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

## Real-Time Subscriptions

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

// Resolvers
const resolvers = {
  Mutation: {
    createPost: async (_, { input }, { dataSources, user }) => {
      const post = await dataSources.postAPI.createPost({
        ...input,
        authorId: user.id,
      });

      // Publish event
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

## Security Practices

### Query Depth Limiting

```typescript
import depthLimit from 'graphql-depth-limit';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    depthLimit(10), // Maximum query depth
  ],
});
```

### Field-Level Permissions

```typescript
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';

// Define auth directive
const typeDefs = `
  directive @auth(requires: Role = ADMIN) on FIELD_DEFINITION

  type Query {
    publicData: String
    sensitiveData: String @auth(requires: ADMIN)
    userData: User @auth(requires: VIEWER)
  }
`;

// Implement permission checking
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

### Rate Limiting

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

## Best Practices Summary

```
GraphQL Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Schema Design                                     │
│   ├── Use consistent naming conventions           │
│   ├── Implement Relay pagination spec             │
│   ├── Use Input types and Payload types          │
│   └── Add meaningful descriptions                 │
│                                                     │
│   Performance Optimization                          │
│   ├── Use DataLoader for N+1                      │
│   ├── Implement query complexity limits           │
│   ├── Persisted queries                           │
│   └── Response caching                            │
│                                                     │
│   Security                                          │
│   ├── Depth limiting                              │
│   ├── Complexity limiting                         │
│   ├── Rate limiting                               │
│   └── Field-level permissions                     │
│                                                     │
│   Developer Experience                              │
│   ├── Code generation                             │
│   ├── Schema version control                      │
│   ├── Auto-generated documentation               │
│   └── Standardized error handling                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Approach |
|----------|---------------------|
| Mobile Apps | GraphQL (reduced requests) |
| Microservice Aggregation | GraphQL Federation |
| Public APIs | REST (cache-friendly) |
| Real-time Features | GraphQL Subscriptions |
| Complex Queries | GraphQL + DataLoader |

GraphQL offers powerful flexibility but requires careful design. Understand its characteristics, leverage strengths, avoid pitfalls, and build efficient APIs.

---

*APIs are the facade of your system. GraphQL makes that facade more flexible and elegant.*

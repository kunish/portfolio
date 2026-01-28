---
title: 'Complete GraphQL Guide: Building Flexible and Efficient APIs'
description: 'Master GraphQL core concepts and practical techniques with Apollo, Schema design, and performance optimization for modern APIs'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'en'
translationKey: 'graphql-api-guide'
---

GraphQL has changed how we think about APIs. Clients no longer passively accept fixed data structures from servers—they actively describe what they need. This article will take you from zero to mastering GraphQL.

## Why Choose GraphQL?

### REST vs GraphQL

```
REST API Problems:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Getting user and their posts requires multiple    │
│   requests:                                         │
│                                                     │
│   GET /users/1           → { id, name, email }      │
│   GET /users/1/posts     → [{ id, title }, ...]     │
│   GET /posts/1/comments  → [{ id, text }, ...]      │
│                                                     │
│   Problems:                                         │
│   • Over-fetching: Returns unnecessary fields       │
│   • Under-fetching: Requires multiple requests      │
│   • Version management: /api/v1, /api/v2            │
│                                                     │
└─────────────────────────────────────────────────────┘

GraphQL Solution:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Get all needed data in one request:               │
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
│   Advantages:                                       │
│   • Precise fetching: Only returns requested fields │
│   • Single request: Reduces network round trips     │
│   • Strong typing: Schema defines clear data        │
│     contract                                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Use Cases

| Scenario | Recommended | Reason |
|----------|-------------|--------|
| Mobile apps | ✅ GraphQL | Limited bandwidth, needs precise data |
| Complex data relationships | ✅ GraphQL | Nested queries more natural |
| Multiple clients | ✅ GraphQL | Each client fetches as needed |
| Simple CRUD | ⚠️ REST may be simpler | Over-engineering |
| File uploads | ⚠️ REST more mature | GraphQL support is complex |
| Real-time data | ✅ GraphQL Subscriptions | Native support |

## Core Concepts

### Schema Definition

```graphql
# schema.graphql

# Scalar types (built-in)
# ID, String, Int, Float, Boolean

# Custom scalars
scalar DateTime
scalar Email

# Enum types
enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

# Object types
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

# Input types (for arguments)
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

# Query type
type Query {
  # Get current user
  me: User

  # Get single user
  user(id: ID!): User

  # Get user list (with pagination)
  users(first: Int, after: String): UserConnection!

  # Get posts
  post(id: ID!): Post
  posts(status: PostStatus, first: Int, after: String): PostConnection!

  # Search
  search(query: String!): [SearchResult!]!
}

# Mutation type
type Mutation {
  # User related
  signUp(email: Email!, password: String!, name: String!): AuthPayload!
  signIn(email: Email!, password: String!): AuthPayload!

  # Post related
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post!
  deletePost(id: ID!): Boolean!

  # Comment related
  addComment(postId: ID!, text: String!): Comment!
}

# Subscription type (real-time updates)
type Subscription {
  postCreated: Post!
  commentAdded(postId: ID!): Comment!
}

# Pagination (Relay style)
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

# Union types
union SearchResult = User | Post | Comment

# Interface types
interface Node {
  id: ID!
}

# Auth response
type AuthPayload {
  token: String!
  user: User!
}
```

### Type System Explained

```
GraphQL Type System:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Scalar Types                                      │
│   ├── ID      → Unique identifier                   │
│   ├── String  → UTF-8 string                        │
│   ├── Int     → 32-bit integer                      │
│   ├── Float   → Double-precision floating point     │
│   └── Boolean → true/false                          │
│                                                     │
│   Type Modifiers                                    │
│   ├── Type!   → Non-null (must have value)          │
│   ├── [Type]  → List (can be null)                  │
│   └── [Type!]!→ Non-null list, elements non-null    │
│                                                     │
│   Examples:                                         │
│   String      → null or "hello"                     │
│   String!     → "hello" (cannot be null)            │
│   [String]    → null or [] or ["a", null]           │
│   [String!]!  → [] or ["a", "b"]                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Server Implementation

### Apollo Server Setup

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

### Context Setup

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
      // Invalid token, continue unauthenticated
    }
  }

  return { prisma, userId };
}
```

### Resolver Implementation

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

  // Type resolvers
  User: userResolvers.User,
  Post: postResolvers.Post,
  Comment: commentResolvers.Comment,

  // Union types
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

### Custom Scalars

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

## Client Implementation

### Apollo Client Setup

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

// Select link based on operation type
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
            // Merge pagination results
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

### React Hooks Usage

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
      // Update cache
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

### Component Usage

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

## Performance Optimization

### N+1 Problem and DataLoader

```
N+1 Problem:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Query:                                            │
│   query {                                           │
│     posts {           ← 1 query to get 10 posts     │
│       author {        ← Each post queries author    │
│         name          = 10 queries!                 │
│       }                                             │
│     }                                               │
│   }                                                 │
│                                                     │
│   Total: 1 + 10 = 11 database queries ❌            │
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

      // Maintain order
      const userMap = new Map(users.map(u => [u.id, u]));
      return ids.map(id => userMap.get(id) || null);
    }),

    postsByAuthorLoader: new DataLoader(async (authorIds: readonly string[]) => {
      const posts = await prisma.post.findMany({
        where: { authorId: { in: [...authorIds] } },
      });

      // Group by author
      const postsByAuthor = new Map<string, typeof posts>();
      posts.forEach(post => {
        const existing = postsByAuthor.get(post.authorId) || [];
        postsByAuthor.set(post.authorId, [...existing, post]);
      });

      return authorIds.map(id => postsByAuthor.get(id) || []);
    }),
  };
}

// Use in Context
export async function createContext({ req }): Promise<Context> {
  return {
    prisma,
    userId: /* ... */,
    loaders: createLoaders(prisma),
  };
}

// Use in Resolvers
Post: {
  author: (parent, _, { loaders }) => {
    return loaders.userLoader.load(parent.authorId);
  },
},
```

### Query Complexity Limiting

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

### Query Depth Limiting

```typescript
import depthLimit from 'graphql-depth-limit';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(5)],
});
```

### Persisted Queries

```typescript
// Client
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { sha256 } from 'crypto-hash';

const persistedQueryLink = createPersistedQueryLink({
  sha256,
  useGETForHashedQueries: true,
});

const link = persistedQueryLink.concat(httpLink);

// Server automatically supports this
```

## Error Handling

### Error Types

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

### Error Formatting

```typescript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    // Hide internal errors in production
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

### Client Error Handling

```typescript
import { onError } from '@apollo/client/link/error';

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      switch (extensions?.code) {
        case 'UNAUTHENTICATED':
          // Redirect to login
          window.location.href = '/login';
          break;
        case 'FORBIDDEN':
          // Show permission error
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

## Testing

### Resolver Unit Tests

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

### Integration Tests

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

    // Create post
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

    // Query post
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

## Best Practices Summary

```
GraphQL Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Schema Design                                     │
│   ├── Use descriptive type and field names          │
│   ├── Add descriptions for nullable fields          │
│   ├── Use input types for complex arguments         │
│   └── Adopt Relay-style pagination                  │
│                                                     │
│   Performance Optimization                          │
│   ├── Use DataLoader to solve N+1                   │
│   ├── Limit query complexity and depth              │
│   ├── Use persisted queries to reduce bandwidth     │
│   └── Set appropriate caching strategies            │
│                                                     │
│   Security                                          │
│   ├── Handle auth in Context layer                  │
│   ├── Check authorization in Resolver layer         │
│   ├── Disable introspection in production           │
│   └── Limit batch operation sizes                   │
│                                                     │
│   Developer Experience                              │
│   ├── Use GraphQL Code Generator                    │
│   ├── Write complete type definitions               │
│   └── Provide detailed error messages               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Aspect | REST | GraphQL |
|--------|------|---------|
| Data Fetching | Multiple endpoints, fixed structure | Single endpoint, fetch as needed |
| Versioning | URL versioning | Schema evolution |
| Type Safety | Depends on docs | Built-in type system |
| Real-time Updates | Requires WebSocket | Native Subscriptions |
| Caching | Mature HTTP caching | Needs client caching |
| Learning Curve | Simple | Slightly steeper |

GraphQL is not a replacement for REST, but a better choice in specific scenarios. Choose the approach that fits your project's needs.

---

*A good API is part of the product. Letting clients decide what they need is respecting developer experience.*

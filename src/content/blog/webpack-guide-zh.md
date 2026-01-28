---
title: 'Webpack 核心概念与配置指南'
description: '深入理解 Webpack 打包原理、核心配置、插件系统和性能优化'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-5.jpg'
lang: 'zh'
translationKey: 'webpack-guide'
---

Webpack 是最流行的 JavaScript 模块打包工具。本文深入探讨其核心概念和配置方法。

## 核心概念

### 基本架构

```
Webpack 核心概念：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Entry（入口）                                     │
│   └── 打包的起点文件                               │
│                                                     │
│   Output（输出）                                    │
│   └── 打包后的文件位置和命名                       │
│                                                     │
│   Loaders（加载器）                                 │
│   └── 转换非 JS 文件（CSS、图片等）                │
│                                                     │
│   Plugins（插件）                                   │
│   └── 扩展功能（压缩、优化等）                     │
│                                                     │
│   Mode（模式）                                      │
│   └── development / production / none              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 基础配置

```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  // 模式
  mode: 'development',

  // 入口
  entry: './src/index.js',

  // 输出
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true  // 每次构建清理 dist
  },

  // 模块规则
  module: {
    rules: []
  },

  // 插件
  plugins: [],

  // 开发服务器
  devServer: {
    static: './dist',
    port: 3000,
    hot: true
  }
};
```

## Loaders 配置

### 处理 JavaScript

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: '> 0.25%, not dead',
                useBuiltIns: 'usage',
                corejs: 3
              }]
            ]
          }
        }
      }
    ]
  }
};
```

### 处理 TypeScript

```javascript
module.exports = {
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};
```

### 处理 CSS

```javascript
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  module: {
    rules: [
      // 开发环境 - style-loader 注入到 DOM
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      // 生产环境 - 提取为单独文件
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
      // Sass/SCSS
      {
        test: /\.s[ac]ss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      // CSS Modules
      {
        test: /\.module\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]--[hash:base64:5]'
              }
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles/[name].[contenthash].css'
    })
  ]
};
```

### 处理资源文件

```javascript
module.exports = {
  module: {
    rules: [
      // 图片
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024  // 8KB 以下转 base64
          }
        },
        generator: {
          filename: 'images/[name].[hash:8][ext]'
        }
      },
      // 字体
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash:8][ext]'
        }
      }
    ]
  }
};
```

## 常用插件

### HTML 生成

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'body',
      minify: {
        removeComments: true,
        collapseWhitespace: true
      }
    })
  ]
};
```

### 环境变量

```javascript
const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.API_URL': JSON.stringify('https://api.example.com'),
      __DEV__: JSON.stringify(false)
    })
  ]
};
```

### 复制静态资源

```javascript
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '' },
        { from: 'src/assets', to: 'assets' }
      ]
    })
  ]
};
```

## 代码分割

### 入口分割

```javascript
module.exports = {
  entry: {
    main: './src/index.js',
    vendor: './src/vendor.js',
    admin: './src/admin/index.js'
  },
  output: {
    filename: '[name].[contenthash].js'
  }
};
```

### 动态导入

```javascript
// 自动代码分割
button.addEventListener('click', async () => {
  const module = await import(
    /* webpackChunkName: "heavy-module" */
    './heavy-module.js'
  );
  module.doSomething();
});

// 预加载
import(
  /* webpackPrefetch: true */
  './analytics.js'
);

// 预获取
import(
  /* webpackPreload: true */
  './critical-module.js'
);
```

### SplitChunks 优化

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      cacheGroups: {
        // 第三方库
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        // React 相关
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20
        },
        // 公共代码
        common: {
          minChunks: 2,
          name: 'common',
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },
    runtimeChunk: 'single'
  }
};
```

## 开发服务器

### DevServer 配置

```javascript
module.exports = {
  devServer: {
    static: {
      directory: path.join(__dirname, 'public')
    },
    port: 3000,
    hot: true,
    open: true,
    compress: true,
    historyApiFallback: true,

    // 代理配置
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      }
    ],

    // 自定义中间件
    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.get('/health', (req, res) => {
        res.json({ status: 'ok' });
      });
      return middlewares;
    }
  }
};
```

### Source Maps

```javascript
module.exports = {
  // 开发环境 - 快速重建，行号准确
  devtool: 'eval-cheap-module-source-map',

  // 生产环境 - 完整映射
  // devtool: 'source-map',

  // 生产环境 - 隐藏源码
  // devtool: 'hidden-source-map',
};
```

## 生产优化

### 压缩配置

```javascript
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          },
          format: {
            comments: false
          }
        },
        extractComments: false
      }),
      new CssMinimizerPlugin()
    ]
  }
};
```

### Tree Shaking

```javascript
module.exports = {
  mode: 'production',
  optimization: {
    usedExports: true,
    sideEffects: true
  }
};

// package.json
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfills.js"
  ]
}
```

### 缓存优化

```javascript
module.exports = {
  output: {
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js'
  },
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};
```

## 多环境配置

### 配置合并

```javascript
// webpack.common.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ]
};

// webpack.dev.js
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  output: {
    filename: '[name].js'
  },
  devServer: {
    port: 3000,
    hot: true
  }
});

// webpack.prod.js
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  output: {
    filename: '[name].[contenthash].js'
  }
});
```

## 最佳实践总结

```
Webpack 优化策略：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   构建速度                                          │
│   ├── 缩小 loader 作用范围                         │
│   ├── 使用持久化缓存                               │
│   ├── 多进程并行构建                               │
│   └── 合理使用 alias 和 extensions                 │
│                                                     │
│   产物优化                                          │
│   ├── 代码分割 + 按需加载                          │
│   ├── Tree Shaking 移除无用代码                    │
│   ├── 压缩 JS/CSS/图片                             │
│   └── 合理使用 contenthash                         │
│                                                     │
│   开发体验                                          │
│   ├── 热模块替换 (HMR)                             │
│   ├── Source Maps 配置                              │
│   └── 开发/生产环境分离                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 概念 | 作用 |
|------|------|
| Entry | 定义打包入口 |
| Output | 定义输出配置 |
| Loaders | 转换非 JS 资源 |
| Plugins | 扩展构建功能 |
| SplitChunks | 代码分割优化 |

---

*理解 Webpack，掌握现代前端工程化的核心。*

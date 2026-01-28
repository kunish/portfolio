---
title: 'WebAssembly 入门指南：让浏览器运行高性能代码'
description: '深入理解 WebAssembly 的工作原理，学会用 Rust、C++ 等语言编写高性能 Web 应用'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-1.jpg'
lang: 'zh'
translationKey: 'webassembly-guide'
---

WebAssembly (Wasm) 正在改变 Web 开发的边界。它让我们可以在浏览器中运行 C++、Rust、Go 等语言编写的代码，性能接近原生应用。本文将带你全面了解 WebAssembly。

## 什么是 WebAssembly？

### 核心概念

```
WebAssembly 的定位：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   传统 Web                    WebAssembly 加持      │
│   ┌─────────────┐            ┌─────────────┐       │
│   │ JavaScript  │            │ JavaScript  │       │
│   │   (解释执行) │            │   + Wasm    │       │
│   └─────────────┘            └─────────────┘       │
│         ↓                          ↓               │
│   性能受限于 JS 引擎          接近原生性能          │
│   复杂计算困难                可运行任何语言        │
│   只能用 JavaScript          复用现有代码库         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### WebAssembly 不是什么

```
常见误解澄清：
┌─────────────────────────────────────────────────────┐
│ ❌ Wasm 会取代 JavaScript                           │
│ ✅ Wasm 与 JS 互补，各有所长                        │
│                                                     │
│ ❌ Wasm 是一种编程语言                              │
│ ✅ Wasm 是编译目标，由其他语言编译而来              │
│                                                     │
│ ❌ Wasm 只能在浏览器运行                            │
│ ✅ Wasm 也可在服务端运行（WASI）                    │
│                                                     │
│ ❌ Wasm 可以直接操作 DOM                            │
│ ✅ Wasm 需要通过 JavaScript 桥接操作 DOM            │
└─────────────────────────────────────────────────────┘
```

### 适用场景

| 场景 | 示例 | 为什么用 Wasm |
|------|------|--------------|
| 图像/视频处理 | Figma、Photopea | 计算密集型 |
| 游戏引擎 | Unity WebGL | 需要高帧率 |
| 音频处理 | Spotify 解码器 | 实时处理 |
| 加密/压缩 | 密码管理器 | 安全性+性能 |
| CAD/3D 建模 | AutoCAD Web | 复杂几何计算 |
| 科学计算 | 数据可视化 | 大量数学运算 |

## 快速开始

### 方式一：使用 AssemblyScript（类 TypeScript）

AssemblyScript 是最容易上手的方式，语法与 TypeScript 几乎相同。

```bash
# 初始化项目
npm init -y
npm install --save-dev assemblyscript
npx asinit .
```

```typescript
// assembly/index.ts
export function fibonacci(n: i32): i32 {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

export function factorial(n: i32): i32 {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
```

```bash
# 编译
npm run asbuild
```

```javascript
// 在 JavaScript 中使用
async function loadWasm() {
  const { fibonacci, factorial } = await import('./build/release.js');

  console.log(fibonacci(40));  // 快速计算
  console.log(factorial(10));
}
```

### 方式二：使用 Rust + wasm-pack

Rust 是 WebAssembly 生态最成熟的语言。

```bash
# 安装工具
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install wasm-pack

# 创建项目
cargo new --lib wasm-demo
cd wasm-demo
```

```toml
# Cargo.toml
[package]
name = "wasm-demo"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
```

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2)
    }
}

// 暴露结构体
#[wasm_bindgen]
pub struct Counter {
    count: i32,
}

#[wasm_bindgen]
impl Counter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Counter {
        Counter { count: 0 }
    }

    pub fn increment(&mut self) {
        self.count += 1;
    }

    pub fn get_count(&self) -> i32 {
        self.count
    }
}
```

```bash
# 编译
wasm-pack build --target web
```

```javascript
// 在 JavaScript 中使用
import init, { greet, fibonacci, Counter } from './pkg/wasm_demo.js';

async function main() {
  await init();

  console.log(greet('World'));      // "Hello, World!"
  console.log(fibonacci(10));       // 55

  const counter = new Counter();
  counter.increment();
  counter.increment();
  console.log(counter.get_count()); // 2
}

main();
```

## 深入理解 Wasm

### 模块结构

```
Wasm 二进制结构：
┌─────────────────────────────────────────────────────┐
│ Magic Number (0x00 0x61 0x73 0x6D) = "\0asm"       │
│ Version (0x01 0x00 0x00 0x00) = 1                  │
├─────────────────────────────────────────────────────┤
│ Type Section     - 函数签名定义                     │
│ Import Section   - 导入的函数/内存/表               │
│ Function Section - 函数声明                         │
│ Table Section    - 函数指针表                       │
│ Memory Section   - 线性内存定义                     │
│ Global Section   - 全局变量                         │
│ Export Section   - 导出的函数/内存                  │
│ Start Section    - 启动函数                         │
│ Element Section  - 表初始化数据                     │
│ Code Section     - 函数体（字节码）                 │
│ Data Section     - 内存初始化数据                   │
└─────────────────────────────────────────────────────┘
```

### 类型系统

```
Wasm 原生类型：
┌─────────────────────────────────────────────────────┐
│ 数值类型                                            │
│ ├─ i32  - 32位整数                                 │
│ ├─ i64  - 64位整数                                 │
│ ├─ f32  - 32位浮点数                               │
│ └─ f64  - 64位浮点数                               │
│                                                     │
│ 引用类型（Wasm 2.0）                                │
│ ├─ funcref  - 函数引用                             │
│ └─ externref - 外部引用（JS 对象）                 │
│                                                     │
│ 向量类型（SIMD）                                    │
│ └─ v128 - 128位向量                                │
└─────────────────────────────────────────────────────┘
```

### 内存模型

```javascript
// Wasm 使用线性内存（一个大的 ArrayBuffer）
const memory = new WebAssembly.Memory({
  initial: 1,    // 初始 1 页（64KB）
  maximum: 10    // 最大 10 页
});

// 可以直接操作内存
const buffer = new Uint8Array(memory.buffer);
buffer[0] = 42;

// Rust 中访问内存
#[wasm_bindgen]
pub fn sum_array(ptr: *const i32, len: usize) -> i32 {
    let slice = unsafe { std::slice::from_raw_parts(ptr, len) };
    slice.iter().sum()
}
```

## JavaScript 与 Wasm 交互

### 基本加载方式

```javascript
// 方式 1：fetch + instantiate
async function loadWasm() {
  const response = await fetch('module.wasm');
  const bytes = await response.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, imports);
  return instance.exports;
}

// 方式 2：instantiateStreaming（推荐，更快）
async function loadWasmStreaming() {
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch('module.wasm'),
    imports
  );
  return instance.exports;
}

// 方式 3：编译后缓存
async function loadWasmWithCache() {
  const cache = await caches.open('wasm-cache');
  let module = await cache.match('module.wasm');

  if (!module) {
    const response = await fetch('module.wasm');
    await cache.put('module.wasm', response.clone());
    module = response;
  }

  const bytes = await module.arrayBuffer();
  return WebAssembly.instantiate(bytes, imports);
}
```

### 传递复杂数据

```rust
// Rust 端
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct User {
    name: String,
    age: u32,
}

#[wasm_bindgen]
pub fn process_user(val: JsValue) -> JsValue {
    let user: User = serde_wasm_bindgen::from_value(val).unwrap();
    let result = User {
        name: user.name.to_uppercase(),
        age: user.age + 1,
    };
    serde_wasm_bindgen::to_value(&result).unwrap()
}
```

```javascript
// JavaScript 端
import { process_user } from './pkg/module.js';

const user = { name: 'Alice', age: 25 };
const result = process_user(user);
console.log(result);  // { name: 'ALICE', age: 26 }
```

### 调用 JavaScript 函数

```rust
// Rust 端导入 JS 函数
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    // 导入 console.log
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // 导入自定义函数
    fn alert(s: &str);

    // 导入带返回值的函数
    fn get_current_time() -> f64;
}

#[wasm_bindgen]
pub fn greet() {
    log("Hello from Rust!");
    let time = get_current_time();
    log(&format!("Current time: {}", time));
}
```

```javascript
// JavaScript 端提供函数
const imports = {
  env: {
    alert: (ptr, len) => window.alert(readString(ptr, len)),
    get_current_time: () => Date.now()
  }
};
```

## 性能优化

### 编译优化

```toml
# Cargo.toml - Release 配置
[profile.release]
opt-level = 3        # 最高优化级别
lto = true           # 链接时优化
codegen-units = 1    # 单代码生成单元（更好优化）
panic = "abort"      # panic 时直接中止（减小体积）
```

```bash
# 使用 wasm-opt 进一步优化
wasm-opt -O3 -o optimized.wasm input.wasm

# 压缩体积
wasm-opt -Oz -o small.wasm input.wasm
```

### 减小体积

```rust
// 避免不必要的依赖
// 使用 no_std 可以大幅减小体积
#![no_std]

// 自定义 panic 处理
#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    loop {}
}
```

```bash
# 体积对比
原始编译: ~100KB
opt-level=3: ~80KB
wasm-opt -O3: ~60KB
wasm-opt -Oz: ~40KB
gzip 压缩后: ~15KB
```

### SIMD 加速

```rust
// 使用 SIMD 指令加速向量运算
use std::arch::wasm32::*;

#[wasm_bindgen]
pub fn dot_product_simd(a: &[f32], b: &[f32]) -> f32 {
    let mut sum = f32x4_splat(0.0);

    for i in (0..a.len()).step_by(4) {
        let va = f32x4(a[i], a[i+1], a[i+2], a[i+3]);
        let vb = f32x4(b[i], b[i+1], b[i+2], b[i+3]);
        sum = f32x4_add(sum, f32x4_mul(va, vb));
    }

    f32x4_extract_lane::<0>(sum) +
    f32x4_extract_lane::<1>(sum) +
    f32x4_extract_lane::<2>(sum) +
    f32x4_extract_lane::<3>(sum)
}
```

### 多线程

```rust
// 使用 Web Workers + SharedArrayBuffer
use wasm_bindgen::prelude::*;
use rayon::prelude::*;

#[wasm_bindgen]
pub fn parallel_sum(data: &[i32]) -> i32 {
    data.par_iter().sum()
}
```

```javascript
// JavaScript 端启用多线程
// 需要设置正确的 HTTP 头
// Cross-Origin-Opener-Policy: same-origin
// Cross-Origin-Embedder-Policy: require-corp
```

## 实战案例

### 案例一：图像处理

```rust
use wasm_bindgen::prelude::*;
use image::{ImageBuffer, Rgba};

#[wasm_bindgen]
pub fn apply_grayscale(data: &mut [u8], width: u32, height: u32) {
    for y in 0..height {
        for x in 0..width {
            let idx = ((y * width + x) * 4) as usize;
            let r = data[idx] as f32;
            let g = data[idx + 1] as f32;
            let b = data[idx + 2] as f32;

            // 灰度转换公式
            let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;

            data[idx] = gray;
            data[idx + 1] = gray;
            data[idx + 2] = gray;
        }
    }
}

#[wasm_bindgen]
pub fn apply_blur(data: &mut [u8], width: u32, height: u32, radius: u32) {
    // 高斯模糊实现
    let kernel_size = radius * 2 + 1;
    // ... 卷积运算
}
```

```javascript
// 在 Canvas 中使用
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// 调用 Wasm 处理
apply_grayscale(imageData.data, canvas.width, canvas.height);

// 显示结果
ctx.putImageData(imageData, 0, 0);
```

### 案例二：Markdown 解析器

```rust
use wasm_bindgen::prelude::*;
use pulldown_cmark::{Parser, Options, html};

#[wasm_bindgen]
pub fn parse_markdown(input: &str) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TABLES);

    let parser = Parser::new_ext(input, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    html_output
}
```

### 案例三：加密工具

```rust
use wasm_bindgen::prelude::*;
use sha2::{Sha256, Digest};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};

#[wasm_bindgen]
pub fn hash_sha256(data: &[u8]) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().to_vec()
}

#[wasm_bindgen]
pub fn encrypt_aes(key: &[u8], nonce: &[u8], plaintext: &[u8]) -> Vec<u8> {
    let key = Key::from_slice(key);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce);

    cipher.encrypt(nonce, plaintext).expect("encryption failed")
}
```

## WASI：服务端 WebAssembly

WebAssembly System Interface (WASI) 让 Wasm 可以在服务端运行。

```rust
// 使用 WASI 访问文件系统
use std::fs;
use std::io::Write;

fn main() {
    // 读取文件
    let content = fs::read_to_string("/input.txt").unwrap();

    // 处理
    let result = content.to_uppercase();

    // 写入文件
    let mut file = fs::File::create("/output.txt").unwrap();
    file.write_all(result.as_bytes()).unwrap();
}
```

```bash
# 编译为 WASI 目标
rustup target add wasm32-wasi
cargo build --target wasm32-wasi

# 使用 Wasmtime 运行
wasmtime run --dir=. target/wasm32-wasi/debug/app.wasm
```

## 调试技巧

### 源码映射

```bash
# 编译时生成源码映射
wasm-pack build --dev

# 或手动生成
wasm-opt --debuginfo input.wasm -o output.wasm
```

### Chrome DevTools

```
调试 Wasm 的步骤：
1. 打开 DevTools → Sources
2. 找到 .wasm 文件
3. 如果有源码映射，可以看到原始代码
4. 设置断点，单步调试
5. 查看 Wasm 栈帧和局部变量
```

### 性能分析

```javascript
// 使用 Performance API
performance.mark('wasm-start');
const result = wasmFunction(data);
performance.mark('wasm-end');
performance.measure('wasm-execution', 'wasm-start', 'wasm-end');

const measures = performance.getEntriesByName('wasm-execution');
console.log(`Execution time: ${measures[0].duration}ms`);
```

## 总结

WebAssembly 为 Web 带来了新的可能：

| 方面 | JavaScript | WebAssembly |
|------|-----------|-------------|
| 适用场景 | UI、业务逻辑 | 计算密集型 |
| 性能 | JIT 优化 | 接近原生 |
| 语言 | 只能 JS/TS | 多语言 |
| DOM 操作 | 直接 | 需要桥接 |
| 包大小 | 较小 | 可能较大 |
| 调试 | 方便 | 需要工具 |

**关键收获**：

1. Wasm 是编译目标，不是编程语言
2. 与 JavaScript 互补，而非替代
3. 适合计算密集型任务
4. Rust 是目前最佳的 Wasm 开发语言
5. WASI 让 Wasm 走出浏览器

WebAssembly 正在让 Web 平台变得更加强大，模糊了浏览器应用与原生应用的界限。

---

*WebAssembly：让 Web 拥有原生的力量。*

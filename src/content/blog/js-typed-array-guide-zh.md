---
title: 'JavaScript TypedArray 与二进制数据完全指南'
description: '掌握 ArrayBuffer、TypedArray、DataView 和二进制数据处理技术'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'zh'
translationKey: 'js-typed-array-guide'
---

TypedArray 是 JavaScript 处理二进制数据的核心工具。本文详解这些概念的用法和实际应用。

## ArrayBuffer 基础

### 创建缓冲区

```javascript
// 创建指定字节长度的缓冲区
const buffer = new ArrayBuffer(16);  // 16 字节

// 检查字节长度
buffer.byteLength;  // 16

// ArrayBuffer 不能直接读写
// 需要通过视图（View）来操作

// 复制缓冲区
const copy = buffer.slice(0, 8);  // 复制前 8 字节

// 检查是否是 ArrayBuffer
buffer instanceof ArrayBuffer;  // true
ArrayBuffer.isView(buffer);     // false
```

### 视图概念

```javascript
// TypedArray 和 DataView 是两种视图类型
const buffer = new ArrayBuffer(16);

// TypedArray 视图
const int32View = new Int32Array(buffer);

// DataView 视图
const dataView = new DataView(buffer);

// 同一个 buffer 可以有多个视图
const uint8View = new Uint8Array(buffer);
const float32View = new Float32Array(buffer);

// 它们共享同一块内存
int32View[0] = 1;
uint8View[0];  // 1（同一内存位置）
```

## TypedArray 类型

### 整数类型

```javascript
// 8 位整数
const int8 = new Int8Array(4);    // -128 到 127
const uint8 = new Uint8Array(4);  // 0 到 255

// 8 位无符号整数（自动截断）
const uint8c = new Uint8ClampedArray(4);  // 0-255，自动截断

// 16 位整数
const int16 = new Int16Array(4);   // -32768 到 32767
const uint16 = new Uint16Array(4); // 0 到 65535

// 32 位整数
const int32 = new Int32Array(4);   // -2^31 到 2^31-1
const uint32 = new Uint32Array(4); // 0 到 2^32-1

// 64 位整数（BigInt）
const bigInt64 = new BigInt64Array(4);
const bigUint64 = new BigUint64Array(4);

// 示例：溢出行为
const u8 = new Uint8Array(1);
u8[0] = 256;  // 变成 0（溢出）
u8[0] = -1;   // 变成 255（溢出）

const u8c = new Uint8ClampedArray(1);
u8c[0] = 256; // 变成 255（截断到最大值）
u8c[0] = -1;  // 变成 0（截断到最小值）
```

### 浮点类型

```javascript
// 32 位浮点数
const float32 = new Float32Array(4);

// 64 位浮点数
const float64 = new Float64Array(4);

// 浮点数示例
const f32 = new Float32Array(1);
f32[0] = 3.14159265359;
f32[0];  // 3.1415927410125732（精度损失）

const f64 = new Float64Array(1);
f64[0] = 3.14159265359;
f64[0];  // 3.14159265359（更高精度）
```

### 创建方式

```javascript
// 1. 指定长度
const arr1 = new Int32Array(4);

// 2. 从数组创建
const arr2 = new Int32Array([1, 2, 3, 4]);

// 3. 从 ArrayBuffer 创建
const buffer = new ArrayBuffer(16);
const arr3 = new Int32Array(buffer);

// 4. 带偏移和长度
const arr4 = new Int32Array(buffer, 4, 2);  // 从字节 4 开始，2 个元素

// 5. 从另一个 TypedArray 创建
const arr5 = new Float32Array(arr2);  // 类型转换

// 6. 使用 from 方法
const arr6 = Int32Array.from([1, 2, 3]);
const arr7 = Int32Array.of(1, 2, 3);
```

## TypedArray 操作

### 基本操作

```javascript
const arr = new Int32Array([10, 20, 30, 40]);

// 读取
arr[0];       // 10
arr.length;   // 4

// 写入
arr[0] = 100;

// 遍历
for (const value of arr) {
  console.log(value);
}

arr.forEach((value, index) => {
  console.log(index, value);
});

// 数组方法
arr.map(x => x * 2);      // Int32Array [200, 40, 60, 80]
arr.filter(x => x > 15);  // Int32Array [20, 30, 40]
arr.reduce((a, b) => a + b, 0);  // 190
arr.find(x => x > 25);    // 30
arr.indexOf(20);          // 1
arr.includes(30);         // true
```

### 复制和填充

```javascript
const arr = new Int32Array(8);

// 填充
arr.fill(42);           // 全部填充 42
arr.fill(0, 2, 5);      // 索引 2-4 填充 0

// 复制到
const source = new Int32Array([1, 2, 3]);
const target = new Int32Array(5);
target.set(source);      // [1, 2, 3, 0, 0]
target.set(source, 2);   // [1, 2, 1, 2, 3]

// 复制内部
arr.copyWithin(0, 3, 5);  // 将索引 3-4 复制到索引 0

// 切片
const slice = arr.slice(1, 4);  // 新的 TypedArray

// subarray（共享内存）
const sub = arr.subarray(1, 4);  // 视图，共享同一 buffer
```

### 排序和反转

```javascript
const arr = new Float32Array([3.1, 1.2, 4.5, 2.3]);

// 排序（原地修改）
arr.sort();  // [1.2, 2.3, 3.1, 4.5]

// 自定义排序
arr.sort((a, b) => b - a);  // 降序

// 反转
arr.reverse();
```

## DataView

### 创建和使用

```javascript
const buffer = new ArrayBuffer(16);
const view = new DataView(buffer);

// 写入数据
view.setInt8(0, 127);
view.setInt16(1, 32767);
view.setInt32(3, 2147483647);
view.setFloat32(7, 3.14);
view.setFloat64(11, Math.PI);

// 读取数据
view.getInt8(0);      // 127
view.getInt16(1);     // 32767
view.getInt32(3);     // 2147483647
view.getFloat32(7);   // 3.14
view.getFloat64(11);  // 3.141592653589793
```

### 字节序

```javascript
const buffer = new ArrayBuffer(4);
const view = new DataView(buffer);

// 写入 0x12345678
// 大端序（Big-Endian）- 默认
view.setUint32(0, 0x12345678, false);
// 内存: 12 34 56 78

// 小端序（Little-Endian）
view.setUint32(0, 0x12345678, true);
// 内存: 78 56 34 12

// 读取时也需要指定字节序
view.getUint32(0, false);  // 大端读取
view.getUint32(0, true);   // 小端读取

// 检测系统字节序
function isLittleEndian() {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true);
  return new Int16Array(buffer)[0] === 256;
}
```

## 实际应用场景

### 图像数据处理

```javascript
// Canvas 图像数据
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, 100, 100);

// imageData.data 是 Uint8ClampedArray
const pixels = imageData.data;

// 遍历每个像素（RGBA）
for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];     // 红
  const g = pixels[i + 1]; // 绿
  const b = pixels[i + 2]; // 蓝
  const a = pixels[i + 3]; // 透明度

  // 灰度处理
  const gray = (r + g + b) / 3;
  pixels[i] = gray;
  pixels[i + 1] = gray;
  pixels[i + 2] = gray;
}

ctx.putImageData(imageData, 0, 0);

// 反转颜色
for (let i = 0; i < pixels.length; i += 4) {
  pixels[i] = 255 - pixels[i];
  pixels[i + 1] = 255 - pixels[i + 1];
  pixels[i + 2] = 255 - pixels[i + 2];
}
```

### 音频数据处理

```javascript
// Web Audio API
const audioCtx = new AudioContext();

// 创建音频缓冲区
const sampleRate = audioCtx.sampleRate;
const duration = 2;  // 2 秒
const buffer = audioCtx.createBuffer(
  2,                    // 声道数
  sampleRate * duration, // 总采样数
  sampleRate            // 采样率
);

// 获取声道数据（Float32Array）
const channelData = buffer.getChannelData(0);

// 生成正弦波
const frequency = 440;  // A4 音符
for (let i = 0; i < channelData.length; i++) {
  channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate);
}

// 播放
const source = audioCtx.createBufferSource();
source.buffer = buffer;
source.connect(audioCtx.destination);
source.start();
```

### 文件操作

```javascript
// 读取文件为 ArrayBuffer
async function readFileAsBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// 解析 PNG 文件头
async function parsePNGHeader(file) {
  const buffer = await readFileAsBuffer(file);
  const view = new DataView(buffer);

  // PNG 签名：89 50 4E 47 0D 0A 1A 0A
  const signature = new Uint8Array(buffer, 0, 8);
  const expected = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

  const isPNG = signature.every((byte, i) => byte === expected[i]);

  if (!isPNG) {
    throw new Error('Not a PNG file');
  }

  // IHDR chunk
  const width = view.getUint32(16);
  const height = view.getUint32(20);

  return { width, height };
}
```

### 网络协议

```javascript
// 创建简单的二进制协议消息
function createMessage(type, payload) {
  const payloadBytes = new TextEncoder().encode(payload);
  const buffer = new ArrayBuffer(4 + payloadBytes.length);
  const view = new DataView(buffer);

  // 消息头：类型 (2字节) + 长度 (2字节)
  view.setUint16(0, type);
  view.setUint16(2, payloadBytes.length);

  // 消息体
  new Uint8Array(buffer, 4).set(payloadBytes);

  return buffer;
}

// 解析消息
function parseMessage(buffer) {
  const view = new DataView(buffer);

  const type = view.getUint16(0);
  const length = view.getUint16(2);
  const payload = new TextDecoder().decode(
    new Uint8Array(buffer, 4, length)
  );

  return { type, payload };
}

// WebSocket 发送二进制数据
const ws = new WebSocket('wss://example.com');
ws.binaryType = 'arraybuffer';

ws.onmessage = (event) => {
  const buffer = event.data;
  const message = parseMessage(buffer);
  console.log(message);
};

ws.send(createMessage(1, 'Hello'));
```

### Base64 编解码

```javascript
// ArrayBuffer 转 Base64
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64 转 ArrayBuffer
function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// 使用示例
const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer;
const base64 = bufferToBase64(buffer);  // 'SGVsbG8='
const decoded = base64ToBuffer(base64);
```

### 十六进制转换

```javascript
// ArrayBuffer 转十六进制字符串
function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 十六进制字符串转 ArrayBuffer
function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

// 使用示例
const buffer = new Uint8Array([255, 128, 0]).buffer;
const hex = bufferToHex(buffer);  // 'ff8000'
const decoded = hexToBuffer(hex);
```

## SharedArrayBuffer

### 基础用法

```javascript
// 创建共享缓冲区
const sharedBuffer = new SharedArrayBuffer(16);

// 可以在 Worker 之间共享
// 主线程
const worker = new Worker('worker.js');
worker.postMessage({ buffer: sharedBuffer });

// worker.js
self.onmessage = (e) => {
  const buffer = e.data.buffer;
  const view = new Int32Array(buffer);
  view[0] = 42;  // 修改会反映到主线程
};
```

### Atomics 操作

```javascript
const buffer = new SharedArrayBuffer(16);
const view = new Int32Array(buffer);

// 原子操作
Atomics.store(view, 0, 42);      // 原子写入
Atomics.load(view, 0);           // 原子读取

// 原子加减
Atomics.add(view, 0, 5);         // 原子加法，返回旧值
Atomics.sub(view, 0, 3);         // 原子减法

// 原子位操作
Atomics.and(view, 0, 0b1111);    // 原子与
Atomics.or(view, 0, 0b1111);     // 原子或
Atomics.xor(view, 0, 0b1111);    // 原子异或

// 原子交换
Atomics.exchange(view, 0, 100);  // 设置新值，返回旧值
Atomics.compareExchange(view, 0, 100, 200);  // CAS 操作

// 等待和通知
Atomics.wait(view, 0, 0);        // 等待值变化
Atomics.notify(view, 0, 1);      // 通知等待者
```

## 最佳实践总结

```
TypedArray 最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   类型选择                                          │
│   ├── 图像处理：Uint8ClampedArray                  │
│   ├── 音频处理：Float32Array                       │
│   ├── 整数运算：Int32Array / Uint32Array           │
│   └── 高精度浮点：Float64Array                     │
│                                                     │
│   性能优化                                          │
│   ├── 预分配合适大小的缓冲区                       │
│   ├── 使用 subarray 避免复制                       │
│   ├── 批量操作代替逐元素操作                       │
│   └── 注意字节对齐                                 │
│                                                     │
│   使用场景                                          │
│   ├── 图形和游戏开发                               │
│   ├── 音视频处理                                   │
│   ├── 文件解析                                     │
│   └── 网络协议                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 类型 | 字节数 | 值范围 |
|------|--------|--------|
| Int8Array | 1 | -128 到 127 |
| Uint8Array | 1 | 0 到 255 |
| Int16Array | 2 | -32768 到 32767 |
| Uint16Array | 2 | 0 到 65535 |
| Int32Array | 4 | -2^31 到 2^31-1 |
| Float32Array | 4 | IEEE 754 单精度 |
| Float64Array | 8 | IEEE 754 双精度 |

---

*掌握 TypedArray 和二进制数据处理，解锁 JavaScript 底层能力。*

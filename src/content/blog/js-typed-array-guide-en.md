---
title: 'JavaScript TypedArray and Binary Data Complete Guide'
description: 'Master ArrayBuffer, TypedArray, DataView, and binary data processing techniques'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-4.jpg'
lang: 'en'
translationKey: 'js-typed-array-guide'
---

TypedArray is a core tool for handling binary data in JavaScript. This article covers the usage and practical applications of these concepts.

## ArrayBuffer Basics

### Creating Buffers

```javascript
// Create buffer with specified byte length
const buffer = new ArrayBuffer(16);  // 16 bytes

// Check byte length
buffer.byteLength;  // 16

// ArrayBuffer cannot be read/written directly
// Need views to operate on it

// Copy buffer
const copy = buffer.slice(0, 8);  // Copy first 8 bytes

// Check if ArrayBuffer
buffer instanceof ArrayBuffer;  // true
ArrayBuffer.isView(buffer);     // false
```

### View Concept

```javascript
// TypedArray and DataView are two types of views
const buffer = new ArrayBuffer(16);

// TypedArray view
const int32View = new Int32Array(buffer);

// DataView view
const dataView = new DataView(buffer);

// Same buffer can have multiple views
const uint8View = new Uint8Array(buffer);
const float32View = new Float32Array(buffer);

// They share the same memory
int32View[0] = 1;
uint8View[0];  // 1 (same memory location)
```

## TypedArray Types

### Integer Types

```javascript
// 8-bit integers
const int8 = new Int8Array(4);    // -128 to 127
const uint8 = new Uint8Array(4);  // 0 to 255

// 8-bit unsigned (clamped)
const uint8c = new Uint8ClampedArray(4);  // 0-255, auto-clamped

// 16-bit integers
const int16 = new Int16Array(4);   // -32768 to 32767
const uint16 = new Uint16Array(4); // 0 to 65535

// 32-bit integers
const int32 = new Int32Array(4);   // -2^31 to 2^31-1
const uint32 = new Uint32Array(4); // 0 to 2^32-1

// 64-bit integers (BigInt)
const bigInt64 = new BigInt64Array(4);
const bigUint64 = new BigUint64Array(4);

// Example: overflow behavior
const u8 = new Uint8Array(1);
u8[0] = 256;  // Becomes 0 (overflow)
u8[0] = -1;   // Becomes 255 (overflow)

const u8c = new Uint8ClampedArray(1);
u8c[0] = 256; // Becomes 255 (clamped to max)
u8c[0] = -1;  // Becomes 0 (clamped to min)
```

### Float Types

```javascript
// 32-bit float
const float32 = new Float32Array(4);

// 64-bit float
const float64 = new Float64Array(4);

// Float examples
const f32 = new Float32Array(1);
f32[0] = 3.14159265359;
f32[0];  // 3.1415927410125732 (precision loss)

const f64 = new Float64Array(1);
f64[0] = 3.14159265359;
f64[0];  // 3.14159265359 (higher precision)
```

### Creation Methods

```javascript
// 1. Specify length
const arr1 = new Int32Array(4);

// 2. From array
const arr2 = new Int32Array([1, 2, 3, 4]);

// 3. From ArrayBuffer
const buffer = new ArrayBuffer(16);
const arr3 = new Int32Array(buffer);

// 4. With offset and length
const arr4 = new Int32Array(buffer, 4, 2);  // From byte 4, 2 elements

// 5. From another TypedArray
const arr5 = new Float32Array(arr2);  // Type conversion

// 6. Using from method
const arr6 = Int32Array.from([1, 2, 3]);
const arr7 = Int32Array.of(1, 2, 3);
```

## TypedArray Operations

### Basic Operations

```javascript
const arr = new Int32Array([10, 20, 30, 40]);

// Read
arr[0];       // 10
arr.length;   // 4

// Write
arr[0] = 100;

// Iterate
for (const value of arr) {
  console.log(value);
}

arr.forEach((value, index) => {
  console.log(index, value);
});

// Array methods
arr.map(x => x * 2);      // Int32Array [200, 40, 60, 80]
arr.filter(x => x > 15);  // Int32Array [20, 30, 40]
arr.reduce((a, b) => a + b, 0);  // 190
arr.find(x => x > 25);    // 30
arr.indexOf(20);          // 1
arr.includes(30);         // true
```

### Copy and Fill

```javascript
const arr = new Int32Array(8);

// Fill
arr.fill(42);           // Fill all with 42
arr.fill(0, 2, 5);      // Fill indices 2-4 with 0

// Set
const source = new Int32Array([1, 2, 3]);
const target = new Int32Array(5);
target.set(source);      // [1, 2, 3, 0, 0]
target.set(source, 2);   // [1, 2, 1, 2, 3]

// Copy within
arr.copyWithin(0, 3, 5);  // Copy indices 3-4 to index 0

// Slice
const slice = arr.slice(1, 4);  // New TypedArray

// Subarray (shares memory)
const sub = arr.subarray(1, 4);  // View, shares same buffer
```

### Sort and Reverse

```javascript
const arr = new Float32Array([3.1, 1.2, 4.5, 2.3]);

// Sort (in-place)
arr.sort();  // [1.2, 2.3, 3.1, 4.5]

// Custom sort
arr.sort((a, b) => b - a);  // Descending

// Reverse
arr.reverse();
```

## DataView

### Creation and Usage

```javascript
const buffer = new ArrayBuffer(16);
const view = new DataView(buffer);

// Write data
view.setInt8(0, 127);
view.setInt16(1, 32767);
view.setInt32(3, 2147483647);
view.setFloat32(7, 3.14);
view.setFloat64(11, Math.PI);

// Read data
view.getInt8(0);      // 127
view.getInt16(1);     // 32767
view.getInt32(3);     // 2147483647
view.getFloat32(7);   // 3.14
view.getFloat64(11);  // 3.141592653589793
```

### Endianness

```javascript
const buffer = new ArrayBuffer(4);
const view = new DataView(buffer);

// Write 0x12345678
// Big-Endian - default
view.setUint32(0, 0x12345678, false);
// Memory: 12 34 56 78

// Little-Endian
view.setUint32(0, 0x12345678, true);
// Memory: 78 56 34 12

// Reading also needs endianness specified
view.getUint32(0, false);  // Big-endian read
view.getUint32(0, true);   // Little-endian read

// Detect system endianness
function isLittleEndian() {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true);
  return new Int16Array(buffer)[0] === 256;
}
```

## Practical Applications

### Image Data Processing

```javascript
// Canvas image data
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, 100, 100);

// imageData.data is Uint8ClampedArray
const pixels = imageData.data;

// Iterate each pixel (RGBA)
for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];     // Red
  const g = pixels[i + 1]; // Green
  const b = pixels[i + 2]; // Blue
  const a = pixels[i + 3]; // Alpha

  // Grayscale
  const gray = (r + g + b) / 3;
  pixels[i] = gray;
  pixels[i + 1] = gray;
  pixels[i + 2] = gray;
}

ctx.putImageData(imageData, 0, 0);

// Invert colors
for (let i = 0; i < pixels.length; i += 4) {
  pixels[i] = 255 - pixels[i];
  pixels[i + 1] = 255 - pixels[i + 1];
  pixels[i + 2] = 255 - pixels[i + 2];
}
```

### Audio Data Processing

```javascript
// Web Audio API
const audioCtx = new AudioContext();

// Create audio buffer
const sampleRate = audioCtx.sampleRate;
const duration = 2;  // 2 seconds
const buffer = audioCtx.createBuffer(
  2,                    // Channels
  sampleRate * duration, // Total samples
  sampleRate            // Sample rate
);

// Get channel data (Float32Array)
const channelData = buffer.getChannelData(0);

// Generate sine wave
const frequency = 440;  // A4 note
for (let i = 0; i < channelData.length; i++) {
  channelData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate);
}

// Play
const source = audioCtx.createBufferSource();
source.buffer = buffer;
source.connect(audioCtx.destination);
source.start();
```

### File Operations

```javascript
// Read file as ArrayBuffer
async function readFileAsBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Parse PNG header
async function parsePNGHeader(file) {
  const buffer = await readFileAsBuffer(file);
  const view = new DataView(buffer);

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
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

### Network Protocols

```javascript
// Create simple binary protocol message
function createMessage(type, payload) {
  const payloadBytes = new TextEncoder().encode(payload);
  const buffer = new ArrayBuffer(4 + payloadBytes.length);
  const view = new DataView(buffer);

  // Header: type (2 bytes) + length (2 bytes)
  view.setUint16(0, type);
  view.setUint16(2, payloadBytes.length);

  // Body
  new Uint8Array(buffer, 4).set(payloadBytes);

  return buffer;
}

// Parse message
function parseMessage(buffer) {
  const view = new DataView(buffer);

  const type = view.getUint16(0);
  const length = view.getUint16(2);
  const payload = new TextDecoder().decode(
    new Uint8Array(buffer, 4, length)
  );

  return { type, payload };
}

// WebSocket binary data
const ws = new WebSocket('wss://example.com');
ws.binaryType = 'arraybuffer';

ws.onmessage = (event) => {
  const buffer = event.data;
  const message = parseMessage(buffer);
  console.log(message);
};

ws.send(createMessage(1, 'Hello'));
```

### Base64 Encoding

```javascript
// ArrayBuffer to Base64
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64 to ArrayBuffer
function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Usage
const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer;
const base64 = bufferToBase64(buffer);  // 'SGVsbG8='
const decoded = base64ToBuffer(base64);
```

### Hexadecimal Conversion

```javascript
// ArrayBuffer to hex string
function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Hex string to ArrayBuffer
function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

// Usage
const buffer = new Uint8Array([255, 128, 0]).buffer;
const hex = bufferToHex(buffer);  // 'ff8000'
const decoded = hexToBuffer(hex);
```

## SharedArrayBuffer

### Basic Usage

```javascript
// Create shared buffer
const sharedBuffer = new SharedArrayBuffer(16);

// Can be shared between Workers
// Main thread
const worker = new Worker('worker.js');
worker.postMessage({ buffer: sharedBuffer });

// worker.js
self.onmessage = (e) => {
  const buffer = e.data.buffer;
  const view = new Int32Array(buffer);
  view[0] = 42;  // Changes reflect in main thread
};
```

### Atomics Operations

```javascript
const buffer = new SharedArrayBuffer(16);
const view = new Int32Array(buffer);

// Atomic operations
Atomics.store(view, 0, 42);      // Atomic write
Atomics.load(view, 0);           // Atomic read

// Atomic add/subtract
Atomics.add(view, 0, 5);         // Atomic add, returns old value
Atomics.sub(view, 0, 3);         // Atomic subtract

// Atomic bitwise
Atomics.and(view, 0, 0b1111);    // Atomic AND
Atomics.or(view, 0, 0b1111);     // Atomic OR
Atomics.xor(view, 0, 0b1111);    // Atomic XOR

// Atomic exchange
Atomics.exchange(view, 0, 100);  // Set new, return old
Atomics.compareExchange(view, 0, 100, 200);  // CAS operation

// Wait and notify
Atomics.wait(view, 0, 0);        // Wait for value change
Atomics.notify(view, 0, 1);      // Notify waiters
```

## Best Practices Summary

```
TypedArray Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Type Selection                                    │
│   ├── Image processing: Uint8ClampedArray          │
│   ├── Audio processing: Float32Array               │
│   ├── Integer math: Int32Array / Uint32Array       │
│   └── High precision float: Float64Array           │
│                                                     │
│   Performance                                       │
│   ├── Pre-allocate appropriately sized buffers     │
│   ├── Use subarray to avoid copying                │
│   ├── Batch operations over element-by-element     │
│   └── Mind byte alignment                          │
│                                                     │
│   Use Cases                                         │
│   ├── Graphics and game development                │
│   ├── Audio/video processing                       │
│   ├── File parsing                                 │
│   └── Network protocols                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Type | Bytes | Value Range |
|------|-------|-------------|
| Int8Array | 1 | -128 to 127 |
| Uint8Array | 1 | 0 to 255 |
| Int16Array | 2 | -32768 to 32767 |
| Uint16Array | 2 | 0 to 65535 |
| Int32Array | 4 | -2^31 to 2^31-1 |
| Float32Array | 4 | IEEE 754 single |
| Float64Array | 8 | IEEE 754 double |

---

*Master TypedArray and binary data processing to unlock JavaScript's low-level capabilities.*

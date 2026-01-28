import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { html } from 'satori-html';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// WASM 初始化状态
let wasmInitialized = false;

// 字体数据缓存
let interFontCache: ArrayBuffer | null = null;
let notoSansSCCache: ArrayBuffer | null = null;

async function ensureWasmInitialized() {
  if (!wasmInitialized) {
    try {
      // 使用 require.resolve 找到 WASM 文件路径
      const wasmPath = require.resolve('@resvg/resvg-wasm/index_bg.wasm');
      const wasmBuffer = fs.readFileSync(wasmPath);
      await initWasm(wasmBuffer);
      wasmInitialized = true;
    } catch (e) {
      if (!(e instanceof Error && e.message.includes('already'))) {
        throw e;
      }
      wasmInitialized = true;
    }
  }
}

async function getInterFont(): Promise<ArrayBuffer> {
  if (interFontCache) {
    return interFontCache;
  }
  const response = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-700-normal.woff');
  interFontCache = await response.arrayBuffer();
  return interFontCache;
}

async function getNotoSansSCFont(): Promise<ArrayBuffer> {
  if (notoSansSCCache) {
    return notoSansSCCache;
  }
  const response = await fetch('https://unpkg.com/@aspect-build/aspect-fonts@0.0.6/fonts/NotoSansSC-Bold.woff', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (!response.ok) {
    return getInterFont();
  }
  notoSansSCCache = await response.arrayBuffer();
  return notoSansSCCache;
}

// 预定义的渐变色方案
const gradients = [
  ['#667eea', '#764ba2'], // 紫色
  ['#f093fb', '#f5576c'], // 粉红
  ['#4facfe', '#00f2fe'], // 蓝色
  ['#43e97b', '#38f9d7'], // 绿色
  ['#fa709a', '#fee140'], // 橙粉
  ['#a8edea', '#fed6e3'], // 清新
  ['#ff9a9e', '#fecfef'], // 玫瑰
  ['#ffecd2', '#fcb69f'], // 暖橙
  ['#667eea', '#f5576c'], // 紫红
  ['#11998e', '#38ef7d'], // 青绿
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getGradient(title: string): [string, string] {
  const index = hashString(title) % gradients.length;
  return gradients[index] as [string, string];
}

interface OgImageOptions {
  title: string;
  description?: string;
  siteName?: string;
  lang?: 'zh' | 'en';
}

export async function generateOgImage(options: OgImageOptions): Promise<Buffer> {
  const { title, description, siteName = 'Blog', lang = 'zh' } = options;
  const [color1, color2] = getGradient(title);

  // 截断标题和描述
  const displayTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
  const displayDesc = description
    ? (description.length > 100 ? description.substring(0, 97) + '...' : description)
    : '';

  // 计算标题字体大小
  const titleFontSize = displayTitle.length > 30 ? '48px' : '56px';

  // 根据语言选择字体优先级
  const fontFamily = lang === 'zh'
    ? "'Noto Sans SC', 'Inter', sans-serif"
    : "'Inter', 'Noto Sans SC', sans-serif";

  // 简化的 satori 兼容模板
  const markup = html`
    <div style="width: 1200px; height: 630px; display: flex; flex-direction: column; background: linear-gradient(135deg, ${color1} 0%, ${color2} 100%); padding: 60px 80px; font-family: ${fontFamily};">
      <div style="display: flex; flex-direction: column; flex: 1; justify-content: center;">
        <div style="font-size: ${titleFontSize}; font-weight: 700; color: white; line-height: 1.3; margin-bottom: 20px;">${displayTitle}</div>
        <div style="font-size: 24px; color: rgba(255,255,255,0.85); line-height: 1.5; display: ${displayDesc ? 'block' : 'none'};">${displayDesc}</div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.3);">
        <div style="font-size: 20px; color: rgba(255,255,255,0.9); font-weight: 600;">${siteName}</div>
        <div style="font-size: 16px; color: rgba(255,255,255,0.7);">Tech Blog</div>
      </div>
    </div>
  `;

  const [interFont, notoSansFont] = await Promise.all([
    getInterFont(),
    getNotoSansSCFont(),
  ]);

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Inter',
        data: interFont,
        weight: 700,
        style: 'normal',
      },
      {
        name: 'Noto Sans SC',
        data: notoSansFont,
        weight: 700,
        style: 'normal',
      },
    ],
  });

  await ensureWasmInitialized();

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });

  const pngData = resvg.render();
  return pngData.asPng();
}

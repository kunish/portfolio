---
title: 'Web 可访问性实战指南：让每个人都能使用你的网站'
description: '掌握 Web 可访问性的核心原则和实践技巧，构建对所有用户友好的网站'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'zh'
translationKey: 'web-accessibility-guide'
---

全球约有 15% 的人口（超过 10 亿人）有某种形式的残障。Web 可访问性（Accessibility，简称 a11y）确保这些用户也能平等地访问和使用网站。更重要的是，好的可访问性设计让所有用户受益。

## 为什么可访问性重要？

### 不只是"少数人"的需求

```
需要可访问性支持的用户：
┌─────────────────────────────────────────────────────┐
│ 永久性障碍                                           │
│ ├─ 视觉障碍（失明、低视力、色盲）                      │
│ ├─ 听觉障碍（失聪、重听）                             │
│ ├─ 运动障碍（无法使用鼠标）                           │
│ └─ 认知障碍（阅读困难、注意力障碍）                    │
│                                                     │
│ 临时性障碍                                           │
│ ├─ 手臂骨折（无法使用鼠标）                           │
│ ├─ 眼睛手术后（视力受限）                             │
│ └─ 嘈杂环境（无法听音频）                             │
│                                                     │
│ 情境性障碍                                           │
│ ├─ 阳光下看手机（对比度问题）                         │
│ ├─ 抱着婴儿单手操作                                  │
│ └─ 网速慢（需要轻量页面）                             │
└─────────────────────────────────────────────────────┘
```

### 业务价值

- **更大的用户群体**：15% 的潜在用户
- **SEO 提升**：可访问的网站对搜索引擎更友好
- **法律合规**：许多国家有无障碍法规
- **更好的代码质量**：语义化 HTML = 更易维护

## 语义化 HTML：可访问性的基础

### 使用正确的元素

```html
<!-- ❌ 错误：使用 div 模拟按钮 -->
<div class="button" onclick="submit()">提交</div>

<!-- ✅ 正确：使用语义化按钮 -->
<button type="submit">提交</button>

<!-- ❌ 错误：用 div 做导航 -->
<div class="nav">
  <div class="nav-item">首页</div>
  <div class="nav-item">关于</div>
</div>

<!-- ✅ 正确：使用 nav 和 a -->
<nav>
  <a href="/">首页</a>
  <a href="/about">关于</a>
</nav>
```

### 标题层级

```html
<!-- ❌ 错误：跳过标题层级 -->
<h1>网站标题</h1>
<h3>章节标题</h3>  <!-- 跳过了 h2 -->
<h5>小节标题</h5>  <!-- 跳过了 h4 -->

<!-- ✅ 正确：连续的标题层级 -->
<h1>网站标题</h1>
<h2>章节标题</h2>
<h3>小节标题</h3>
```

### 地标区域

```html
<body>
  <header>
    <nav aria-label="主导航">...</nav>
  </header>

  <main>
    <article>
      <h1>文章标题</h1>
      ...
    </article>

    <aside aria-label="相关文章">
      ...
    </aside>
  </main>

  <footer>
    <nav aria-label="页脚导航">...</nav>
  </footer>
</body>
```

## 键盘可访问性

### 确保所有功能可键盘操作

```html
<!-- 自定义下拉菜单需要键盘支持 -->
<div
  role="button"
  tabindex="0"
  onkeydown="handleKeyDown(event)"
  onclick="toggleMenu()"
>
  菜单
</div>

<script>
function handleKeyDown(event) {
  // Enter 或 Space 激活
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggleMenu();
  }
  // Escape 关闭
  if (event.key === 'Escape') {
    closeMenu();
  }
}
</script>
```

### 焦点管理

```css
/* ❌ 错误：移除焦点样式 */
*:focus {
  outline: none;
}

/* ✅ 正确：自定义但可见的焦点样式 */
*:focus {
  outline: none;
}

*:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}
```

### 焦点陷阱（模态框）

```javascript
// 模态框中的焦点管理
function openModal(modal) {
  // 保存之前的焦点位置
  const previouslyFocused = document.activeElement;

  // 获取模态框内所有可聚焦元素
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // 聚焦到第一个元素
  firstElement.focus();

  // 监听 Tab 键，保持焦点在模态框内
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }

    // Escape 关闭模态框
    if (e.key === 'Escape') {
      closeModal(modal);
      previouslyFocused.focus();
    }
  });
}
```

## ARIA：当 HTML 不够用时

### ARIA 角色

```html
<!-- 选项卡界面 -->
<div role="tablist">
  <button
    role="tab"
    aria-selected="true"
    aria-controls="panel-1"
    id="tab-1"
  >
    标签 1
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="panel-2"
    id="tab-2"
  >
    标签 2
  </button>
</div>

<div
  role="tabpanel"
  id="panel-1"
  aria-labelledby="tab-1"
>
  内容 1
</div>

<div
  role="tabpanel"
  id="panel-2"
  aria-labelledby="tab-2"
  hidden
>
  内容 2
</div>
```

### ARIA 状态和属性

```html
<!-- 展开/折叠 -->
<button
  aria-expanded="false"
  aria-controls="details"
>
  显示详情
</button>
<div id="details" hidden>
  详细内容...
</div>

<!-- 加载状态 -->
<button aria-busy="true" disabled>
  <span class="spinner"></span>
  加载中...
</button>

<!-- 错误消息 -->
<input
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<div id="email-error" role="alert">
  请输入有效的邮箱地址
</div>
```

### 实时区域

```html
<!-- 通知用户动态变化 -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <!-- 内容变化时，屏幕阅读器会朗读 -->
  已保存
</div>

<!-- 紧急通知 -->
<div role="alert" aria-live="assertive">
  会话即将过期，请保存您的工作！
</div>
```

### ARIA 的黄金法则

```html
<!-- 规则 1：能用 HTML 就不用 ARIA -->
<!-- ❌ -->
<div role="button" tabindex="0">点击</div>
<!-- ✅ -->
<button>点击</button>

<!-- 规则 2：不要改变原生语义 -->
<!-- ❌ -->
<h1 role="button">标题</h1>
<!-- ✅ -->
<h1><button>标题</button></h1>

<!-- 规则 3：所有交互元素必须可键盘操作 -->
<!-- 如果添加了 role="button"，必须同时处理键盘事件 -->
```

## 图片和媒体

### 图片替代文本

```html
<!-- 信息性图片：描述内容 -->
<img src="chart.png" alt="2024年销售额增长40%的柱状图">

<!-- 装饰性图片：空 alt -->
<img src="decoration.png" alt="">

<!-- 复杂图片：详细描述 -->
<figure>
  <img src="flowchart.png" alt="用户注册流程图">
  <figcaption>
    流程：填写表单 → 验证邮箱 → 完成注册
  </figcaption>
</figure>

<!-- 图标按钮 -->
<button aria-label="关闭">
  <svg aria-hidden="true">...</svg>
</button>
```

### 视频和音频

```html
<!-- 视频需要字幕和描述 -->
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track
    kind="captions"
    src="captions-zh.vtt"
    srclang="zh"
    label="中文字幕"
    default
  >
  <track
    kind="descriptions"
    src="descriptions.vtt"
    srclang="zh"
    label="视频描述"
  >
</video>

<!-- 提供文字替代 -->
<details>
  <summary>视频文字版</summary>
  <p>视频内容的完整文字描述...</p>
</details>
```

## 表单可访问性

### 标签关联

```html
<!-- 显式关联 -->
<label for="email">邮箱地址</label>
<input type="email" id="email" name="email">

<!-- 隐式关联 -->
<label>
  邮箱地址
  <input type="email" name="email">
</label>

<!-- 必填字段 -->
<label for="name">
  姓名
  <span aria-hidden="true">*</span>
</label>
<input
  type="text"
  id="name"
  required
  aria-required="true"
>
```

### 错误处理

```html
<form novalidate>
  <div class="field">
    <label for="email">邮箱</label>
    <input
      type="email"
      id="email"
      aria-invalid="true"
      aria-describedby="email-error email-hint"
    >
    <p id="email-hint" class="hint">
      我们不会分享您的邮箱
    </p>
    <p id="email-error" class="error" role="alert">
      请输入有效的邮箱地址
    </p>
  </div>

  <button type="submit">提交</button>
</form>

<style>
  .error {
    color: #d32f2f;
  }

  input[aria-invalid="true"] {
    border-color: #d32f2f;
  }
</style>
```

### 分组字段

```html
<fieldset>
  <legend>送货地址</legend>

  <label for="street">街道</label>
  <input type="text" id="street">

  <label for="city">城市</label>
  <input type="text" id="city">
</fieldset>

<fieldset>
  <legend>支付方式</legend>

  <label>
    <input type="radio" name="payment" value="card">
    信用卡
  </label>

  <label>
    <input type="radio" name="payment" value="paypal">
    PayPal
  </label>
</fieldset>
```

## 颜色和对比度

### 颜色对比度要求

```
WCAG 2.1 标准：
┌─────────────────────────────────────────────────────┐
│ AA 级（最低要求）                                    │
│ ├─ 普通文本：4.5:1                                   │
│ └─ 大文本（18px+ 或 14px 粗体）：3:1                 │
│                                                     │
│ AAA 级（推荐）                                       │
│ ├─ 普通文本：7:1                                     │
│ └─ 大文本：4.5:1                                     │
└─────────────────────────────────────────────────────┘
```

### 不只依赖颜色

```html
<!-- ❌ 仅用颜色表示状态 -->
<span style="color: red">错误</span>
<span style="color: green">成功</span>

<!-- ✅ 颜色 + 图标 + 文字 -->
<span class="error">
  <svg aria-hidden="true">❌</svg>
  错误：请填写此字段
</span>
<span class="success">
  <svg aria-hidden="true">✓</svg>
  成功：已保存
</span>
```

## 测试工具

### 自动化测试

```bash
# axe-core - 最流行的可访问性测试库
npm install axe-core

# Lighthouse CLI
npm install -g lighthouse
lighthouse https://example.com --only-categories=accessibility

# Pa11y
npm install -g pa11y
pa11y https://example.com
```

```javascript
// 在测试中集成 axe-core
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('页面应该没有可访问性问题', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 手动测试清单

```
□ 只用键盘导航整个网站
□ 用屏幕阅读器测试（VoiceOver, NVDA）
□ 放大页面到 200% 检查布局
□ 在黑白模式下检查对比度
□ 检查所有图片的替代文本
□ 验证表单错误提示的可访问性
□ 测试自定义组件的键盘操作
```

## React 中的可访问性

```tsx
// 使用语义化组件
function Navigation() {
  return (
    <nav aria-label="主导航">
      <ul>
        <li><Link to="/">首页</Link></li>
        <li><Link to="/about">关于</Link></li>
      </ul>
    </nav>
  );
}

// 使用 Fragment 避免多余的 div
function List({ items }) {
  return (
    <>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </>
  );
}

// 处理焦点
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      {children}
      <button onClick={onClose}>关闭</button>
    </div>
  );
}
```

## 总结

Web 可访问性不是可选项，而是责任：

| 领域 | 关键实践 |
|------|----------|
| HTML | 使用语义化元素 |
| 键盘 | 确保所有功能可键盘操作 |
| ARIA | 当 HTML 不够时补充语义 |
| 视觉 | 保证足够的颜色对比度 |
| 媒体 | 提供替代文本和字幕 |
| 表单 | 正确关联标签和错误提示 |

**关键收获**：

1. 语义化 HTML 是可访问性的基础
2. 所有交互必须支持键盘操作
3. ARIA 是补充，不是替代
4. 颜色不能是唯一的信息传达方式
5. 自动化测试 + 手动测试 = 完整覆盖

可访问性不是一次性任务，而是持续的承诺。让每个人都能使用你的产品，这是技术的责任，也是人文的关怀。

---

*真正优秀的设计是包容的设计。让我们一起构建一个更无障碍的 Web。*

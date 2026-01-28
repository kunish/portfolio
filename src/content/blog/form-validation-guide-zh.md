---
title: '表单验证最佳实践：构建用户友好的输入体验'
description: '掌握 HTML5 验证、JavaScript 验证、表单库和无障碍验证技巧'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-3.jpg'
lang: 'zh'
translationKey: 'form-validation-guide'
---

表单验证是用户交互的关键环节。本文探讨前端表单验证的各种技术和最佳实践。

## 验证策略

### 验证时机

```
验证时机选择：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   onBlur（失焦时）                                  │
│   └── 用户离开字段时验证，平衡体验                  │
│                                                     │
│   onChange（输入时）                                │
│   └── 实时反馈，但可能过于频繁                      │
│                                                     │
│   onSubmit（提交时）                                │
│   └── 统一验证，但延迟反馈                          │
│                                                     │
│   混合策略                                          │
│   └── 首次 onBlur，之后 onChange                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 策略 | 优点 | 缺点 |
|------|------|------|
| onBlur | 体验平衡 | 轻微延迟 |
| onChange | 即时反馈 | 可能烦人 |
| onSubmit | 统一处理 | 反馈延迟 |

## HTML5 原生验证

### 验证属性

```html
<!-- 必填字段 -->
<input type="text" name="username" required />

<!-- 长度限制 -->
<input type="text" minlength="3" maxlength="20" />

<!-- 数字范围 -->
<input type="number" min="0" max="100" step="1" />

<!-- 正则模式 -->
<input
  type="text"
  pattern="[A-Za-z0-9]+"
  title="只允许字母和数字"
/>

<!-- 邮箱验证 -->
<input type="email" required />

<!-- URL 验证 -->
<input type="url" placeholder="https://example.com" />

<!-- 电话号码 -->
<input type="tel" pattern="[0-9]{11}" />
```

### 自定义验证消息

```html
<form id="myForm">
  <input
    type="email"
    id="email"
    required
    oninvalid="this.setCustomValidity('请输入有效的邮箱地址')"
    oninput="this.setCustomValidity('')"
  />
  <button type="submit">提交</button>
</form>
```

```typescript
// JavaScript 设置自定义验证
const emailInput = document.getElementById('email') as HTMLInputElement;

emailInput.addEventListener('invalid', (e) => {
  const input = e.target as HTMLInputElement;

  if (input.validity.valueMissing) {
    input.setCustomValidity('邮箱地址不能为空');
  } else if (input.validity.typeMismatch) {
    input.setCustomValidity('请输入有效的邮箱格式');
  }
});

emailInput.addEventListener('input', (e) => {
  (e.target as HTMLInputElement).setCustomValidity('');
});
```

### CSS 验证状态

```css
/* 有效状态 */
input:valid {
  border-color: #10b981;
}

/* 无效状态 */
input:invalid {
  border-color: #ef4444;
}

/* 用户交互后的无效状态 */
input:user-invalid {
  border-color: #ef4444;
  background-color: #fef2f2;
}

/* 必填字段 */
input:required {
  border-left: 3px solid #3b82f6;
}

/* 可选字段 */
input:optional {
  border-left: 3px solid #9ca3af;
}

/* 范围内/外 */
input:in-range {
  border-color: #10b981;
}

input:out-of-range {
  border-color: #ef4444;
}
```

## JavaScript 验证

### 验证函数

```typescript
// 验证规则类型
type ValidationRule = {
  validate: (value: string) => boolean;
  message: string;
};

// 常用验证规则
const validators = {
  required: (message = '此字段必填'): ValidationRule => ({
    validate: (value) => value.trim().length > 0,
    message,
  }),

  email: (message = '请输入有效的邮箱地址'): ValidationRule => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => value.length >= min,
    message: message || `至少需要 ${min} 个字符`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => value.length <= max,
    message: message || `最多允许 ${max} 个字符`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value) => regex.test(value),
    message,
  }),

  match: (fieldName: string, getValue: () => string, message?: string): ValidationRule => ({
    validate: (value) => value === getValue(),
    message: message || `必须与 ${fieldName} 匹配`,
  }),
};

// 验证字段
function validateField(value: string, rules: ValidationRule[]): string[] {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return errors;
}

// 使用
const emailErrors = validateField(email, [
  validators.required(),
  validators.email(),
]);
```

### 表单验证类

```typescript
type FieldConfig = {
  rules: ValidationRule[];
  element: HTMLInputElement;
};

type FormErrors = Record<string, string[]>;

class FormValidator {
  private fields: Map<string, FieldConfig> = new Map();
  private errors: FormErrors = {};

  addField(name: string, element: HTMLInputElement, rules: ValidationRule[]) {
    this.fields.set(name, { element, rules });

    // 绑定事件
    element.addEventListener('blur', () => this.validateField(name));
    element.addEventListener('input', () => {
      if (this.errors[name]?.length) {
        this.validateField(name);
      }
    });
  }

  validateField(name: string): boolean {
    const field = this.fields.get(name);
    if (!field) return true;

    const { element, rules } = field;
    const errors = validateField(element.value, rules);

    this.errors[name] = errors;
    this.updateFieldUI(name, errors);

    return errors.length === 0;
  }

  validateAll(): boolean {
    let isValid = true;

    this.fields.forEach((_, name) => {
      if (!this.validateField(name)) {
        isValid = false;
      }
    });

    return isValid;
  }

  private updateFieldUI(name: string, errors: string[]) {
    const field = this.fields.get(name);
    if (!field) return;

    const { element } = field;
    const errorContainer = document.getElementById(`${name}-error`);

    if (errors.length > 0) {
      element.classList.add('is-invalid');
      element.classList.remove('is-valid');
      if (errorContainer) {
        errorContainer.textContent = errors[0];
        errorContainer.style.display = 'block';
      }
    } else {
      element.classList.remove('is-invalid');
      element.classList.add('is-valid');
      if (errorContainer) {
        errorContainer.style.display = 'none';
      }
    }
  }

  getErrors(): FormErrors {
    return { ...this.errors };
  }
}
```

## React 表单验证

### React Hook Form

```tsx
import { useForm } from 'react-hook-form';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

function RegistrationForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const password = watch('password');

  const onSubmit = async (data: FormData) => {
    await registerUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">邮箱</label>
        <input
          id="email"
          type="email"
          {...register('email', {
            required: '邮箱不能为空',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: '请输入有效的邮箱地址',
            },
          })}
          aria-invalid={errors.email ? 'true' : 'false'}
        />
        {errors.email && (
          <span role="alert">{errors.email.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="password">密码</label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: '密码不能为空',
            minLength: {
              value: 8,
              message: '密码至少 8 个字符',
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message: '密码必须包含大小写字母和数字',
            },
          })}
        />
        {errors.password && (
          <span role="alert">{errors.password.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword">确认密码</label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword', {
            required: '请确认密码',
            validate: (value) =>
              value === password || '两次密码输入不一致',
          })}
        />
        {errors.confirmPassword && (
          <span role="alert">{errors.confirmPassword.message}</span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '提交中...' : '注册'}
      </button>
    </form>
  );
}
```

### Zod Schema 验证

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 定义 Schema
const registrationSchema = z
  .object({
    email: z
      .string()
      .min(1, '邮箱不能为空')
      .email('请输入有效的邮箱地址'),
    password: z
      .string()
      .min(8, '密码至少 8 个字符')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        '密码必须包含大小写字母和数字'
      ),
    confirmPassword: z.string().min(1, '请确认密码'),
    age: z
      .number()
      .min(18, '年龄必须大于 18')
      .max(120, '年龄无效'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次密码输入不一致',
    path: ['confirmPassword'],
  });

type RegistrationData = z.infer<typeof registrationSchema>;

function RegistrationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 表单字段 */}
    </form>
  );
}
```

## 无障碍验证

### ARIA 属性

```html
<div class="form-group">
  <label for="email" id="email-label">
    邮箱地址
    <span aria-hidden="true">*</span>
  </label>

  <input
    type="email"
    id="email"
    name="email"
    required
    aria-required="true"
    aria-labelledby="email-label"
    aria-describedby="email-hint email-error"
    aria-invalid="false"
  />

  <span id="email-hint" class="hint">
    我们不会分享您的邮箱
  </span>

  <span id="email-error" class="error" role="alert" aria-live="polite">
    <!-- 动态错误消息 -->
  </span>
</div>
```

### 屏幕阅读器友好

```tsx
interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({
  id,
  label,
  error,
  hint,
  required,
  children,
}: FormFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {required && <span className="sr-only">（必填）</span>}
      </label>

      {React.cloneElement(children as React.ReactElement, {
        id,
        'aria-required': required,
        'aria-invalid': !!error,
        'aria-describedby': describedBy || undefined,
      })}

      {hint && (
        <span id={hintId} className="hint">
          {hint}
        </span>
      )}

      {error && (
        <span id={errorId} className="error" role="alert" aria-live="polite">
          {error}
        </span>
      )}
    </div>
  );
}

// 使用
<FormField
  id="email"
  label="邮箱"
  required
  error={errors.email?.message}
  hint="我们不会分享您的邮箱"
>
  <input type="email" {...register('email')} />
</FormField>
```

## 最佳实践总结

```
表单验证最佳实践：
┌─────────────────────────────────────────────────────┐
│                                                     │
│   用户体验                                          │
│   ├── 即时但不打扰的反馈                            │
│   ├── 清晰的错误消息                                │
│   ├── 显示有效状态确认                              │
│   └── 保留用户输入                                  │
│                                                     │
│   技术实现                                          │
│   ├── 客户端 + 服务端双重验证                       │
│   ├── 使用验证库减少代码                            │
│   ├── 定义可复用的验证规则                          │
│   └── 处理异步验证                                  │
│                                                     │
│   无障碍                                            │
│   ├── 使用正确的 ARIA 属性                          │
│   ├── 错误消息关联字段                              │
│   ├── 支持键盘导航                                  │
│   └── 屏幕阅读器友好                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| 场景 | 建议 |
|------|------|
| 简单表单 | HTML5 原生验证 |
| 复杂表单 | React Hook Form + Zod |
| 实时验证 | debounce + 异步验证 |
| 跨字段验证 | Schema 级别验证 |

---

*好的表单验证是用户成功提交的保障。*

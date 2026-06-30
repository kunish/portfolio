---
target: /
total_score: 31
p0_count: 1
p1_count: 2
timestamp: 2026-06-30T05-38-28Z
slug: src-pages-index-astro
---
Method: dual-agent (A: design-review · B: detector-evidence)

# 设计评审 — 首页 `/`（src/pages/index.astro）

## Design Health Score — Nielsen 10 项启发式

| # | 启发式 | 分 | 关键问题 |
|---|--------|----|----------|
| 1 | 系统状态可见性 | 4/4 | 时钟/uptime/脉冲点/hover/active 状态都很到位；唯一假象是 "available · last_seen: just now" 的伪实时。 |
| 2 | 系统与现实匹配 | 3/4 | `uname -a` → 虚荣统计是语义错配；命令式标签对 2/3 的非开发受众不透明。 |
| 3 | 用户控制与自由 | 3/4 | 联系方式仅 mailto，无复制邮箱/表单兜底，mailto 可能死路。 |
| 4 | 一致性与标准 | 4/4 | 内部高度一致；但按钮语法不统一：`cd posts`(命令) vs `mail`(裸词) vs `github →`(箭头)。 |
| 5 | 错误预防 | 3/4 | 表面少；空状态已处理。无 mailto 失败兜底。 |
| 6 | 识别优于回忆 | 2/4 | 整个隐喻偏回忆：要解码 `cd posts`=博客、`uname -a`=统计、`[posts]`=导航。对开发者友好，对招聘方/客户是负担。 |
| 7 | 灵活与效率 | 3/4 | 导航 `[key]` 与 `[≡]` 暗示快捷键但**未接线**——破损的可供性承诺。 |
| 8 | 美学与极简 | 4/4 | 最强项，克制无杂讯。统计/∞ 是唯一噪声。 |
| 9 | 错误恢复 | 3/4 | 首页不可触发，中性。 |
| 10 | 帮助与文档 | 2/4 | 终端邀请它不兑现的交互（不可输入；字典甚至带 "type help to list commands"）。 |

**总分：31 / 40 — Good（偏上）。** 执行力强；失分集中在受众回忆成本与「假交互可供性」，而非工艺本身。

## Anti-Patterns Verdict（是否像 AI 生成）

**LLM 评估：FAIL（窄口径）—— 骨架是真功夫，内容是套版。** 视觉*系统*绝不会让设计师说「AI 做的」：phosphor-CRT 色阶分层、双等宽配对、0 圆角纪律、`git log`/`ls`/`less` 的 IA、带辉光的 ASCII 签名——这层干净通过。**失败在文案与内容层**，而这恰是招聘方/同行最先看到的，对一个以可信度为目标的作品集，文字是承重的。

- **Hero 标题 = 最大字号里的模板套话。** `Crafting / Exceptional / Digital Experiences`（中文「构建/卓越的/数字体验」）是史上最模板的作品集短语，是品牌明令禁止的 "Hi, I'm…" 反面参照的孪生。
- **统计区 = 被禁的 hero-metric 模板。** `5+ / 50+ / {N} / ∞` 大号荧光数字 + 小号大写标签 + 四宫格，结构上就是 SaaS 虚荣指标俗套；`∞ curiosity` 是无意义填充；四项里只有 `logs` 是真数据却被埋没。
- **编号标记 — 分裂判定。** Hero `01/02/03` 给「一句话的三个碎片」编号（不是序列），是伪装成 IA 的装饰脚手架 → **这处违规**。stack 卡片 `[00]–[03]` 在 `ls` 目录语境给四个并列项编号 → **这处通过**。结论：删 hero 编号，留卡片索引。
- **终端隐喻** 大体承重（`git log`→文章流、`ls ./tools`→技能、`less` 阅读器是真匹配），两处穿帮：`uname -a` 标注虚荣统计（uname 印的是内核/架构，与「5+ 年」零语义关联）、`cat headline.md` 输出营销口号。

**确定性扫描（detect.mjs，退出码 2，共 1 条）：** 仅 `numbered-section-markers`（advisory，index.astro，文档级 01/02/03）。Header.astro / Footer.astro **完全干净**，无等宽/字体/结构告警。该 advisory 与 A 的「Hero 编号失败、卡片编号通过」一致——检测器只能给文档级提示，A 把它精确到了 Hero。**检测器漏掉的**（语义层，检测器天然抓不到）：Hero 套话、hero-metric 统计、内容真实性问题——全靠 A 捕获。

**对比度实测（WCAG 2.1，node 计算）：**

| 前景 on 背景 | 比值 | AA 正文(≥4.5) | AA 大字(≥3) | 用处 |
|---|---|---|---|---|
| `#6b6e66` dim on `#0a0e0d` | **3.74** | **FAIL** | PASS | `.log-row__desc` .8rem、`.stat__label` .7rem、footer `.dim` |
| `#3a3d38` faint on `#0a0e0d` | **1.76** | **FAIL** | **FAIL** | leaders/括号/分隔 |
| `#a6a195` ash on `#0a0e0d` | 7.54 | PASS | PASS | 次级正文 |
| `#7ee787` phosphor on `#0a0e0d` | 12.64 | PASS | PASS | 链接/active |
| `#f4c171` amber on `#0a0e0d` | 11.75 | PASS | PASS | 日期/键名 |
| `#e6e1cf` bone on `#0a0e0d` | 14.83 | PASS | PASS | 主正文 |
| `#a6a195` ash on `#0f1413` pane | 7.22 | PASS | PASS | 卡片正文 |

实测失败的小字用法：`--color-dim` 用于 `.log-row__desc`(.8rem)、`.log-row__meta` 文章日期(.75rem)、`.stat__label`(.7rem)、`.section-title__meta`(.7rem)——均为正文尺寸、非装饰，违反项目自己写的 Dim Floor Rule 与 WCAG AA 目标。

**视觉叠加：不可用。** Chrome 实例与 sandbox dev server 网络隔离（localhost:4321 在浏览器里报错页），确认一次后未重试，未注入叠加层。

## Overall Impression

像素说「工艺」，文字说「30 秒 AI 生成」。视觉系统本身就是最强的作品；可惜被页面最大字号的那句套话和一组硬编码虚荣数字拖累。最大机会：**让内容层配得上骨架**——把承重的真实证据（真实、带日期的双语文章流）提到前面，砍掉它要费力盖过的噪声（口号 + 虚荣统计）。

## What's Working

1. **设计系统本身就是作品。** 无投影靠色阶分层、双等宽对比轴、唯一的 Fraunces 人声、贯穿的 0 圆角/字形前缀——纪律到位，系统级兑现了「practice what you preach」。
2. **`git log --oneline` 做近期文章是「承重隐喻」的正确示范**——倒序、带索引、终端原生、语义诚实（博客本就是思考的提交日志）。
3. **活体细节的克制：** 时钟、uptime、心跳、阅读进度，营造「真实运行会话」质感，却没用品牌禁止的视差/霓虹。Header `backdrop-filter: blur(12px)` 是唯一被批准的玻璃用法——正确地仅此一处。

## Priority Issues

**[P0] Hero 标题是页面最大字号里的模板 AI 填充。**
- 为何重要：第一眼、最大字、零具体信号，与 `craft` 品牌和「no Hi-I'm 营销 hero」反面参照直接冲突；可信度作品集上这会先污染信任。
- 修复：改写成关于 石坤 *实际构建什么* 的具体、有主张、不可被别的工程师复用的一句话；删掉「exceptional / digital experiences」这类通用形容词。
- 命令：**clarify**（配 **distill**）。

**[P1] `--color-dim` 用在 <18px 必要文本上，违反 WCAG AA（与项目自己的 Dim Floor Rule）。**
- 为何重要：`.log-row__desc`(.8rem)、文章**日期** `.log-row__meta`(.75rem)、`.stat__label`(.7rem)、`.section-title__meta`(.7rem) 均 ~3.74:1，低于正文 4.5:1；其中描述与日期是必要元数据，非装饰。
- 修复：所有必要小字升到 `ash`(#a6a195, 7.5:1) 或 `bone`；`dim` 仅留给 ≥18px / 粗体≥14px 的装饰性 leader。`faint`(1.76:1) 仅可用于纯装饰。
- 命令：**harden**（配 **audit**）。

**[P1] 统计区是被禁的 hero-metric 模板，且数字不可验证。**
- 为何重要：结构即 SaaS 虚荣指标俗套；「50+ projects」无作品页背书（空洞），「∞」无意义，怀疑型招聘方/客户会折价——对可信度目标净负。
- 修复：换成可验证的派生信号（真实文章数 + 总字数/阅读时长、GitHub 年限、按提交的主力语言），或直接砍掉该区；删 `∞`。
- 命令：**distill**（配 **clarify**）。

**[P2] 内容真实性红旗削弱可信度目标。**
- 为何重要：通用 Unsplash 头像（陌生人的库存照）+ 库存 hero 图，配合脉冲实时点的静态「available / 可接项目」与「last_seen: just now」，在个人品牌站上读作占位/假身份与「presence 剧场」。
- 修复：换真实照片，或诚实的 ASCII/identicon 头像；让「可接」状态诚实，或去掉「just now」伪实时。
- 命令：**harden**（信任/可信度）。

**[P2] 对 2/3 非开发受众的回忆税 + 假交互可供性。**
- 为何重要：招聘方/客户每个动作都付解码成本；尝试 `[key]` 的开发者按下去什么都没有——隐喻过度承诺。
- 修复：要么给括号键接上真实快捷键，要么弱化括号样式；像导航 `[posts] blog` 那样，给每个 hero 命令配一个平实标签。
- 命令：**clarify**（配 **onboard**）。

**[P3] 移动端隐藏文章日期，在招聘方最可能的设备上破坏 `git log` 时序隐喻。**
- 为何重要：近因是让「git log」成立的可信度信号；≤640px 下 `.log-row__meta { display:none }` 掏空隐喻与「在持续写作」的证据。
- 修复：移动端保留紧凑日期（如 `MM-DD` 或相对时间）。
- 命令：**adapt**。

## Persona Red Flags

- **招聘方（10 秒扫读）：** boot 序列让 CTA 行延迟到 ~1080ms 才出现，快扫时不即时可见；最大那行「Crafting Exceptional Digital Experiences」零能力信号；真正可扫的事实（role/北京/状态）在 profile.json 面板里，而近因证据（文章日期）又小又 `dim`。缺一个干脆的「前端工程师，X 年，看作品」层级，有跳出风险。
- **同行开发者（看工艺）：** 被系统折服，却被内容拖累——`HTML5`/`CSS3` 列为技能（初级简历味）、`∞ curiosity`、库存头像、`[posts]` 括号看着像键位（开发者真按一个键，什么都没有）。
- **Casey（移动 375px）：** Hero 触到 `2.5rem` clamp 下限（等宽不再缩小），EN「Digital Experiences」配 `padding-left: 2.5rem` 在 ≤360px 有裁切风险（`overflow-x:hidden` 藏了滚动条却裁字形）。中文「数字体验」4 字是安全情形——溢出风险仅限 EN+窄屏。
- **Riley（压力测试）：** 想往终端里打字——无反应（不可交互，却带「type help」）；按 `[posts]`——无反应。键盘可达与 `prefers-reduced-motion` 都过关（有焦点环；`.type-line` 在减动效下直接可见，无揭示依赖失败）。

## Minor Observations

- `.prose-terminal blockquote` 用 `border-left: 2px solid phosphor`——正是 DESIGN.md 禁止的「>1px 彩色侧边条」。属文章 prose 非首页，但系统在破自己的规矩。
- `.rule-label`（`~/index.html`、`uname -a`、`// signature`）形态上是 eyebrow（小、大写、tracked、置于内容上方），被重释为终端路径/命令标签故大体有意，但紧邻被禁的 eyebrow 模式。
- stack 卡片是等大 4 宫格——品牌反对的「等大卡片网格」，因目录列举本就均一可辩护，但与通用技能内容叠加后偏模板。
- 按钮语法不一致：`cd posts` / `cat about.md`（命令）vs `mail`（裸词）vs `github →`（箭头）——统一一种约定。

## Questions to Consider

1. 如果删掉统计区和标题，页面会不会*更*可信？最强证据（真实、带日期、双语的文章日志）已在页上——虚荣数字和口号是在加信号，还是在加工艺得费力盖过的噪声？
2. 终端隐喻承诺了它从不兑现的交互（可输入命令、`[key]` 热键、`help`）。该让它*真*可交互（真实命令面板 / `j`-`k`-`/` 导航）从而让隐喻成真、取悦开发者——还是别再 cosplay shell、砍掉这些开空头支票的可供性？
3. 对「2/3 是非开发者」的混合受众，命令行 IA 是资产，还是一个悄悄*筛掉*品牌声称要追求的招聘方与客户的过滤器——而这种筛选是有意的吗？

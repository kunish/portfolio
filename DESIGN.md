---
name: The 3AM Terminal
description: A dark phosphor-CRT design system for a frontend engineer's bilingual portfolio & blog.
colors:
  void: "#07090a"
  shell: "#0a0e0d"
  pane: "#0f1413"
  rule: "#1a1f1d"
  rule-hi: "#2a3230"
  bone: "#e6e1cf"
  ash: "#a6a195"
  dim: "#6b6e66"
  faint: "#3a3d38"
  phosphor: "#7ee787"
  phosphor-hi: "#b6f0a3"
  amber: "#f4c171"
  rose: "#ff5c7c"
  cyan: "#79c0ff"
typography:
  display:
    fontFamily: "Geist Mono, JetBrains Mono, ui-monospace, monospace"
    fontSize: "clamp(2.5rem, 9vw, 6rem)"
    fontWeight: 600
    lineHeight: 0.96
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geist Mono, JetBrains Mono, ui-monospace, monospace"
    fontSize: "clamp(2.25rem, 6vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist Mono, JetBrains Mono, ui-monospace, monospace"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "JetBrains Mono, SF Mono, ui-monospace, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
    fontFeature: "calt, ss01, ss02, zero"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.7rem"
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: "0.08em"
  quote:
    fontFamily: "Fraunces, Iowan Old Style, Georgia, serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
rounded:
  none: "0"
  pill: "999px"
spacing:
  xs: "0.4rem"
  sm: "0.65rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "3rem"
  gutter: "1.25rem"
  reading: "50rem"
  container: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.pane}"
    textColor: "{colors.bone}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0.7rem 1.1rem"
  button-primary-hover:
    backgroundColor: "{colors.phosphor}"
    textColor: "{colors.void}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    rounded: "{rounded.none}"
    padding: "0.7rem 1.1rem"
  button-rose-hover:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.void}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ash}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.15rem 0.55rem"
  chip-phosphor:
    backgroundColor: "transparent"
    textColor: "{colors.phosphor}"
  card:
    backgroundColor: "{colors.pane}"
    textColor: "{colors.ash}"
    rounded: "{rounded.none}"
    padding: "1.25rem"
  kbd:
    backgroundColor: "{colors.pane}"
    textColor: "{colors.bone}"
    rounded: "{rounded.none}"
    padding: "0 0.4rem"
    height: "1.6rem"
---

# Design System: The 3AM Terminal

## 1. Overview

**Creative North Star: "The 3AM Terminal"**

This is the screen you'd find a frontend engineer in front of at 3am: the room is dark, the only light is the soft green glow of a phosphor display, the clock in the corner is still ticking, and the cursor is still blinking. The whole interface is one long, focused terminal session — calm, precise, and entirely at home in the command line. Depth comes not from drop-shadows but from three near-black tones layered like the inside of a CRT (`void` → `shell` → `pane`), a faint scanline haze, a vignette pulling the edges down, and the occasional phosphor bloom. Nothing is loud; competence is conveyed by restraint, rhythm, and a single confident accent.

The system speaks developer-to-developer. Command-line metaphors are not decoration — they are the real grammar of the information architecture: the hero boots like a shell session (`whoami`, `cat headline.md`), recent posts are a `git log --oneline`, the skill stack is `ls ./tools`, an article is a `less` reader with a `[ end with q ]` hint and a live read-percentage. Type is monospace almost everywhere, with one italic serif (Fraunces) reserved as the single warm human voice that cuts through the grid.

This system **explicitly rejects** the template portfolio (gradient hero + equal-sized card grid + big avatar + "Hi, I'm…"), the safe corporate-blue / minimal-SaaS look, and showy parallax/bounce/neon motion that fights readability. It also rejects terminal aesthetics worn as a costume — the metaphor must be load-bearing, never a skin pasted over a generic layout.

**Key Characteristics:**
- Dark phosphor-CRT surface; depth via tonal layering, not shadows.
- Monospace-first type with one italic-serif accent voice.
- Sharp, zero-radius geometry — the page is drawn with rules and box characters, not rounded cards.
- One green accent used sparingly; amber and rose are rare, role-specific signals.
- Command-line metaphors as real IA, plus subtle living detail (blinking cursor, pulsing status dot, live clock, read-progress).

## 2. Colors

A near-black phosphor-CRT palette: three layered ink-dark surfaces, a four-step bone→faint text ramp, and a deliberately scarce green-amber-rose accent trio that glows against the dark.

### Primary
- **Phosphor Afterglow Green** (`#7ee787`): the one interactive accent — links, `$`/`›` prompts, active nav, the blinking cursor, the pulsing "available" dot, focus rings, hover fills. On hover it brightens to **Phosphor Bloom** (`#b6f0a3`). It is the heartbeat of the system; its scarcity is what makes it read as alive.

### Secondary
- **Oscilloscope Amber** (`#f4c171`): the secondary signal — dates, numeric metadata, field keys (`date`, `lang`, `build`), the serif motto, the `host` in the prompt. Warm counterweight to the green; never used for body copy.
- **Alarm Rose Afterglow** (`#ff5c7c`): the strong/contact CTA and any destructive intent (the "say hello" mail button). Rarest color in the system — one or two appearances per page at most.

### Tertiary
- **Link Cyan** (`#79c0ff`): an alternate link hue held in reserve for variation; used sparingly so it never competes with phosphor green.

### Neutral
- **Void** (`#07090a`): the deepest layer — code blocks, the footer, framed artwork backgrounds. The bottom of the CRT.
- **Shell** (`#0a0e0d`): the page background. Everything sits on this.
- **Pane** (`#0f1413`): raised panels — cards, buttons, kbd keys, the profile panel.
- **Rule** (`#1a1f1d`) / **Rule-Hi** (`#2a3230`): hairline dividers (1px solid or dashed) and emphasized borders. These rules do the structural work shadows would do elsewhere.
- **Bone** (`#e6e1cf`): primary text — not pure white; a warm off-bone that's gentler on the dark. ~13:1 on shell.
- **Ash** (`#a6a195`): secondary text — ledes, body in muted contexts, list items. ~7.5:1 on shell, AA-safe.
- **Dim** (`#6b6e66`): tertiary — large labels, timestamps, captions, decorative leaders. ~3.75:1 on shell: large-text only.
- **Faint** (`#3a3d38`): disabled/placeholder/bracket glyphs and dotted-leader fill. Decorative, never information-bearing.

### Named Rules
**The One Green Rule.** Phosphor green is the system's only interactive color and stays under ~10% of any screen. If a second element turns green "to match," it's too much — pull it back to bone/ash. Rarity is the signal.

**The Dim Floor Rule.** `dim` (`#6b6e66`) is ~3.75:1 on `shell` — below the AA 4.5:1 body threshold. It is permitted **only** for large text (≥18px / bold ≥14px) and non-essential decoration. Any reading-size body or essential label must be `ash` (`#a6a195`) or `bone`. Never drop body copy to `dim` "for elegance."

## 3. Typography

**Display Font:** Geist Mono (with JetBrains Mono, ui-monospace fallback) — headings, hero, section titles, stat numbers.
**Body Font:** JetBrains Mono (with SF Mono, ui-monospace fallback) — body, nav, UI, the default for the whole page.
**Accent Font:** Fraunces, italic (with Iowan Old Style, Georgia fallback) — pull quotes, ledes, the footer motto, `<em>` in prose.

**Character:** Two monospaces paired on a real contrast axis — Geist Mono's tighter, more geometric display cut against JetBrains Mono's warmer, code-native body — so headings and text read as distinct voices, not the same font twice. Fraunces italic is the single non-mono note: a warm human serif used like a handwritten margin remark against the machine grid.

### Hierarchy
- **Display** (Geist Mono 600, `clamp(2.5rem, 9vw, 6rem)`, lh 0.96, ls -0.04em): the homepage hero headline only. Letter-spacing sits exactly at the -0.04em floor — do not tighten further.
- **Headline** (Geist Mono 600, `clamp(2.25rem, 6vw, 4.5rem)`, lh 1.05, ls -0.02em): page `h1`.
- **Title** (Geist Mono 600, `1.5rem`, ls -0.01em): section titles (the `## section` blocks), article `h1` (`clamp(1.75rem, 4.5vw, 2.75rem)`).
- **Body** (JetBrains Mono 400, 14px, lh 1.7): all running text; prose runs at 0.95rem / lh 1.85. Reading column capped at 50rem (~70ch) — honor the cap.
- **Label** (JetBrains Mono 500, 0.7rem, ls 0.08em, uppercase): field keys, rule-labels, stat captions, chips, table headers.
- **Quote** (Fraunces italic 400, 1.05rem): ledes, blockquotes, the motto.

### Named Rules
**The Monospace-Default Rule.** Mono is the page's native tongue; everything is mono unless it's a deliberate Fraunces accent. Never introduce a third sans/serif "for variety" — the contrast is already carried by Geist-vs-JetBrains and the lone serif.

**The Serif-as-Spice Rule.** Fraunces appears italic, small, and rare — a lede, a quote, a motto. The moment serif shows up in more than a sentence or two per view, it stops being the human voice and starts being noise.

## 4. Elevation

Flat by doctrine. There are no drop-shadows anywhere in the system. Depth is built three ways: (1) **tonal layering** — `void` < `shell` < `pane` stack like sheets of dark glass; (2) **1px rules** — solid and dashed hairlines in `rule`/`rule-hi` carve structure where a card shadow would otherwise sit; (3) **phosphor glow** — the only "lift" in the system is light, not shadow: a soft `box-shadow`/`text-shadow` bloom in phosphor green on the status dot, the heartbeat, and the ASCII signature. Two full-viewport CRT overlays complete the depth illusion: a near-invisible green scanline (`repeating-linear-gradient`, `mix-blend-mode: screen`) and a radial vignette darkening the corners.

### Shadow Vocabulary
- **Phosphor bloom — dot** (`box-shadow: 0 0 6px–8px var(--color-phosphor)`): live status indicators (host dot, heartbeat) only.
- **Phosphor bloom — text** (`text-shadow: 0 0 12px rgba(126,231,135,0.3)`): the ASCII signature glow in the footer. Reserved for signature/hero CRT moments.

### Named Rules
**The No-Shadow Rule.** Surfaces never cast shadows. If something needs to feel raised, move it up a tonal step (`shell` → `pane`) or give it a `rule-hi` border — never a grey box-shadow. The only legal glow is phosphor light on a living element.

## 5. Components

The feel across every component: **precise, restrained, command-line-native.** Sharp 0-radius edges, `$`/`›`/`▸` glyph prefixes instead of icons, and a default state that's quiet until phosphor green answers on hover or focus.

### Buttons (`.term-cmd`)
- **Shape:** sharp rectangle, zero radius (`0`). A `$` glyph is rendered before the label via `::before`; labels are lowercase.
- **Primary:** `pane` background, `bone` text, `rule-hi` 1px border, padding `0.7rem 1.1rem`. **Hover:** fills solid `phosphor` green with `void` text (full invert).
- **Ghost (`--ghost`):** transparent background, `rule-hi` border. Hover keeps it transparent and turns text + border + `$` phosphor green. The default action button.
- **Rose (`--rose`):** the `$` glyph and hover fill use `rose` instead of green — for the contact/strong CTA only.
- **Focus:** global `:focus-visible` → 1px `phosphor` outline, 2px offset.

### Chips (`.chip`)
- **Style:** transparent fill, `rule-hi` 1px border, `ash` text, uppercase 0.7rem with 0.08em tracking, zero radius.
- **Variants:** `--phosphor` / `--amber` / `--rose` recolor border+text to that accent; `--solid` is a filled phosphor chip with `void` text for the rare emphatic tag.

### Cards / Containers (`.stack-card`, `.ascii-frame`)
- **Corner Style:** zero radius. Flat rectangles.
- **Background:** `pane` on `shell`; framed variants use `void`.
- **Shadow Strategy:** none — see Elevation. Separation is the 1px `rule` border.
- **Border:** 1px `rule`/`rule-hi`. On hover, `.stack-card` shifts its border to `phosphor` and tints the fill ~4% green via `color-mix`.
- **Internal Padding:** `1.25rem` (cards), `1.5rem` (frames).
- **Signature — ASCII Frame (`.ascii-frame`):** a box-drawing frame whose top-left label is rendered as `┌─ label ─` straddling the border via `::before`, evoking a tmux/terminal pane. The framed cover image (`.post-art`) adds `● ● ●` window-dots and a `cover.png` filename tab.

### Navigation (`.nav-cmd`, `.status-bar`)
- **Style:** a sticky top status bar with `backdrop-filter: blur(12px)` over a translucent `shell`. Left: a live shell prompt `shikun@dev:~$` with a pulsing phosphor dot. Right: nav links shaped as `[key] label` (e.g. `[posts] blog`), a live UTC clock, the `EN/ZH` switcher, and a `[≡]` mobile toggle.
- **States:** links are `ash`, brackets `faint`, the key `amber`; hover/active turn the whole link phosphor green, and the active link appends a small solid green square marker. Mobile collapses to a dotted-leader list (`▸ key ···· label`).

### Keycap (`.kbd`)
- **Style:** `pane` fill, `rule-hi` border with a 2px bottom edge (physical key depth), `bone` text, zero radius. Hover/active → phosphor border + text. Also the form of the `EN/ZH` language switch.

### Article Reader (`.reader-bar`, `.prose-terminal`)
- **Signature component.** A blog post is staged as a `less`/`man` session: a sticky reader bar shows `less ~/posts/slug.md`, a live read-percentage, a `[ end with q ]` hint, and a 1px phosphor progress line; pressing `q` returns to the index. Prose uses `prose-terminal` — headings prefixed with literal `#`/`##`/`###` in phosphor, `▸` list bullets, `decimal-leading-zero` ordered counters, inline code in a tinted phosphor pill, and code blocks on `void` with `● ● ●` window chrome. The post ends with an `─── EOF ───` rule and an `— EOF · slug.md` sign-off.

## 6. Do's and Don'ts

### Do:
- **Do** keep phosphor green (`#7ee787`) as the single interactive accent, under ~10% of any screen — links, prompts, active/hover/focus states only.
- **Do** convey depth with tonal layering (`void`/`shell`/`pane`) and 1px `rule` hairlines; the only legal "lift" is phosphor glow on a living element.
- **Do** keep every corner sharp (radius `0`); the `999px` pill is reserved for status dots, nothing else.
- **Do** keep body and essential labels at `ash` (`#a6a195`) or `bone`; treat WCAG AA (≥4.5:1 body, ≥3:1 large) as the floor.
- **Do** make the command-line metaphor load-bearing — real IA (`git log`, `ls ./tools`, `less` reader), not a decorative skin.
- **Do** use mono everywhere by default, with italic Fraunces as a rare warm accent voice (lede, quote, motto).
- **Do** give every entrance/blink/pulse a `prefers-reduced-motion: reduce` fallback, and ensure content is visible without the animation.

### Don't:
- **Don't** ship the template portfolio: gradient hero + equal-sized card grid + big avatar + "Hi, I'm…". Any layout that reads as "template-generated" gets restructured.
- **Don't** fall back to corporate-blue / minimal-SaaS — no safe blue, no personality-less rounded cards, no neutral corporate tone. This site's identity is the dark phosphor-CRT; never retreat from it.
- **Don't** add showy parallax / bounce / neon / full-screen motion that fights readability, and don't wear the terminal look as a costume over a generic layout.
- **Don't** drop reading-size body text to `dim` (`#6b6e66`, ~3.75:1) "for elegance" — that's the AA failure this system is most prone to.
- **Don't** use `border-left`/`border-right` > 1px as a colored accent stripe; structure with full 1px rules or background tints instead.
- **Don't** use gradient text (`background-clip: text`), decorative glassmorphism beyond the one nav blur, or grey drop-shadows.
- **Don't** introduce a third type family or let Fraunces serif spread past a sentence or two per view.

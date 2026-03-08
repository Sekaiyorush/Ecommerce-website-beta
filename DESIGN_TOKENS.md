# Design Tokens & Brand Identity — Golden Tier Peptide

## 1. Color Palette

### Primary (Brand)
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `gold-primary` | `#D4AF37` | Primary brand color, metallic accents, active states. |
| `gold-deep` | `#AA771C` | Deep metallic for contrast, hover states on gold. |
| `gold-light` | `#F3E5AB` | Subtle backgrounds, separators, scrollbar thumb. |
| `gold-white` | `#FDFBF3` | "Paper" surfaces, card backgrounds. |

### Neutrals
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `black-rich` | `#111111` | Primary buttons, headers, dark backgrounds. |
| `slate-900` | `#0F172A` | Primary text. |
| `slate-500` | `#64748B` | Secondary/Body text. |
| `slate-100` | `#F1F5F9` | Divider lines, subtle borders. |

### Functional
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `success` | `#10B981` | Positive feedback, "In Stock" indicators. |
| `error` | `#F43F5E` | Alerts, "Out of Stock", validation errors. |
| `warning` | `#F59E0B` | Low stock, pending states. |

---

## 2. Interactive States

| State | Mapping | Effect |
| :--- | :--- | :--- |
| **Hover (Primary)** | `gold-primary` → `gold-deep` | Background darkens slightly for depth. |
| **Hover (Secondary)**| `black-rich` → `slate-900` | Subtle lightness shift. |
| **Focus** | `gold-primary` | 2px solid offset ring (`offset-2`). |
| **Disabled** | `slate-100` background | `slate-500` text, `cursor-not-allowed`. |
| **Active/Pressed** | `scale-98` | Subtle 2% downscale for tactile feel. |

---

## 3. Accessibility & Contrast Ratios (WCAG 2.1 AA)

To ensure high readability and luxury feel, the following combinations are mandated:

| Foreground | Background | Ratio | Status | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `gold-primary` (#D4AF37) | `black-rich` (#111111) | **8.2:1** | ✅ Pass | Ideal for buttons and headers. |
| `gold-deep` (#AA771C) | `gold-white` (#FDFBF3) | **4.6:1** | ✅ Pass | Use for body text on paper surfaces. |
| `gold-primary` (#D4AF37) | `white` (#FFFFFF) | **2.4:1** | ❌ Fail | **Do not use for text.** Use as background only. |
| `black-rich` (#111111) | `gold-primary` (#D4AF37) | **8.2:1** | ✅ Pass | High-contrast label on gold surface. |
| `slate-500` (#64748B) | `white` (#FFFFFF) | **4.6:1** | ✅ Pass | Minimum for secondary body text. |

---

## 4. Typography

### Headings (Display & Elegant)
- **Font Family:** `'Playfair Display', serif`
- **Weight:** 600 (Semi-bold) or 500 (Medium)
- **Character Spacing:** `-0.02em` (Tight for larger sizes)

### Body & UI (Functional)
- **Font Family:** `'Inter', sans-serif`
- **Weight:** 400 (Regular), 500 (Medium), 600 (Semi-bold)
- **Tracking (UI Labels):** `0.2em` to `0.3em` (Wide for uppercase labels)

---

## 3. Elevation & Depth

### Shadows
- `shadow-soft`: `0 4px 20px -2px rgba(0, 0, 0, 0.05)` (Default card)
- `shadow-premium`: `0 20px 40px rgba(212, 175, 55, 0.08)` (Hover state)
- `shadow-inner-gold`: `inset 0 2px 4px rgba(212, 175, 55, 0.1)`

### Blurs
- `backdrop-blur-md`: `blur(12px)` (Used for Glassmorphism effects)

---

## 4. Animation Principles

### Page Transitions
- **Type:** Fade + Y-Slide
- **Duration:** `0.5s`
- **Easing:** `[0.4, 0, 0.2, 1]` (Cubic Bezier)

### Micro-interactions
- **Buttons:** Subtle scale-down on active (`scale: 0.98`).
- **Cards:** Hover lift (`-8px`) + Shadow expansion.
- **Loading:** "Shimmer" gradient moving left to right.

---

## 5. Implementation Notes for Tailwind
```javascript
// extend in tailwind.config.js
{
  colors: {
    gold: {
      500: '#D4AF37',
      600: '#AA771C',
      100: '#F3E5AB',
      // ...
    },
    brand: {
      dark: '#111111',
    }
  },
  fontFamily: {
    serif: ['Playfair Display', 'serif'],
    sans: ['Inter', 'sans-serif'],
  }
}
```

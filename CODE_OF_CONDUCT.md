# 📝 Canvas Coordinate Systems: Offset & Zoom 

This guide explains **two core concepts** for building zoomable and pannable canvas apps:

1. **Offset (Panning)** — Sliding the “paper” around.  
2. **Scale (Zooming)** — Zooming in/out around the top-left corner.

Understanding these two deeply is essential before handling pinch-zoom or anchor-based scaling.

---

## 🌍 1. World Space vs Screen Space

Imagine your app has **two coordinate systems**:

- **World Space** 🧭  
  The “paper” where your drawings actually live.  
  Shapes are stored here permanently.  
  Example: A rectangle might be at `(100, 50)` in world coordinates.

- **Screen Space** 📱  
  The actual pixels on your device or browser window.  
  Touch/mouse events give you screen coordinates.  
  Top-left of the screen is `(0, 0)`.

> Think of a **big sheet of paper (world)** lying on a **table (screen)**.  
> The paper doesn’t change — you move or zoom the “camera” over it.

---

## 🧱 2. Step One — Offset (Panning)

`offset` tells us **how much the world is shifted relative to the screen**.

**Conversion formula (no scaling yet):**

```
screen = world + offset
world  = screen - offset
```

### ✍ Example:

```
offsetX = 100
offsetY = 0
scale   = 1
```

You tap at **screen** `(0, 0)`.

```
worldX = (0 - 100) / 1 = -100
worldY = (0 - 0) / 1   = 0
```

✅ Tapping at the top-left of the screen actually touches `(-100, 0)` in world space.

🧠 **Why:** The paper is shifted **right 100 px**, so the top-left of the screen is now “looking” at -100 on the paper.

---

## 🔍 3. Step Two — Scale (Zooming)

`scale` controls **how many screen pixels = 1 world unit**.

**Conversion formula:**

```
screen = world * scale + offset
world  = (screen - offset) / scale
```

### ✍ Example 1 — scale = 1 (no zoom)

```
worldX = 100
scale  = 1
offset = 0
```

```
screenX = 100 * 1 + 0 = 100
```

👉 World (100) appears at screen (100).

---

### ✍ Example 2 — scale = 2 (zoom in)

```
worldX = 100
scale  = 2
offset = 0
```

```
screenX = 100 * 2 + 0 = 200
```

👉 Same world point appears **twice as far**.  
Everything looks bigger → zoom in.

---

### ✍ Example 3 — scale = 0.5 (zoom out)

```
worldX = 100
scale  = 0.5
offset = 0
```

```
screenX = 100 * 0.5 + 0 = 50
```

👉 World point appears closer → zoom out.

---

### ✍ Example 4 — Reverse: Screen → World

```
screenX = 150
scale   = 3
offsetX = 0
```

```
worldX = (150 - 0) / 3 = 50
```

👉 Tapping screen at 150 corresponds to world 50.

---

## 🧠 Quick Summary Table

| Action                 | Formula                                 | Intuition                                           |
|-------------------------|------------------------------------------|-----------------------------------------------------|
| World → Screen          | `screen = world * scale + offset`       | Multiply (zoom), then shift (pan)                   |
| Screen → World          | `world = (screen - offset) / scale`     | Undo pan, then divide to undo zoom                  |
| Increase `scale`        | Zoom in                                 | Shapes appear larger, spread out                   |
| Decrease `scale`        | Zoom out                                | Shapes appear smaller, bunch closer                |
| Change `offset`         | Pan                                     | Moves the "paper" without resizing it              |

---

## 🧠 Key Takeaways

- `offset` = where the paper’s origin is on screen.  
- `scale` = how zoomed in/out the paper is.  
- **Order matters**: always undo offset, then undo scale when converting screen → world.  
- If you zoom without adjusting offset, zoom always happens around (0,0).

---







---
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

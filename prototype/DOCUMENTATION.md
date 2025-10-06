## 🎥 Demo
### Screenshot
![Demo Screenshot](assets/image/apricity-prototype-2025-10-06%2010-27-16.png)

### Video
https://github.com/user-attachments/assets/a3e592f2-3dd3-460d-bd2f-15f3c2ad1241


⬇️[Demo Video Download](assets/video/apricity-prototype-2025-10-06%2010-27-16.mp4)

---

## 1. **Canvas Setup**

Canvas is basically a **blank drawing board** in your browser.
We get it like this:

```js
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
```

* `canvas`: the HTML element where we draw.
* `ctx`: the "paintbrush" we use (2D context).

👉 Without this, we can’t draw anything.

---

## 2. **Listening to Pointer/Mouse Events**

We want to let the user interact with the canvas (drag, draw arrows, etc.), so we use events:

```js
canvas.addEventListener("pointerdown", ... );
canvas.addEventListener("pointermove", ... );
canvas.addEventListener("pointerup", ... );
```

* **pointerdown** → when finger/mouse clicks down → start dragging/drawing.
* **pointermove** → while moving → update position.
* **pointerup** → when released → finish action.

👉 Why? Because canvas itself is "dumb" — it only shows drawings, it doesn’t know about dragging or arrows. We teach it using events.

---

## 3. **Storing State**

We need to remember things like:

* Where dragging started.
* Current pointer positions.
* What we are drawing (pan? arrow?).

That’s why we keep a `state` object with:

```js
const state = {
  pointerMap: new Map(), // stores active touches/pointers
  dragging: null         // stores drag info (start point, type)
};
```

👉 Why? If we don’t store this, the canvas forgets everything after each event.

---

## 4. **Dragging (Panning the Canvas)**

When user holds down and moves, we calculate:

```js
const dx = ev.clientX - dragging.startClient.x;
const dy = ev.clientY - dragging.startClient.y;
```

* `dx`, `dy` → how much the user moved since start.
* We use this to **move the canvas view**.

👉 Why? Otherwise the canvas would always stay still — we need a way to move ("pan") around.

---

## 5. **Arrows**

When we wanted **arrows**:

* On `pointerdown`: record start point.
* On `pointerup`: draw a line from start → end.

```js
ctx.beginPath();
ctx.moveTo(start.x, start.y);
ctx.lineTo(end.x, end.y);
ctx.stroke();
```

👉 Why? Drawing works like real life:

* `beginPath` = take a new sheet.
* `moveTo` = put the pencil at starting point.
* `lineTo` = draw a line to another point.
* `stroke` = make the line visible.

For **multiple arrows**, we just repeat this for every pointer action, instead of clearing the old one.

---

✅ So far, you’ve learned:

1. Canvas = blank board.
2. Events = how we interact with it.
3. State = memory of what’s happening.
4. Panning = move canvas.
5. Arrows = draw start → end lines.

---

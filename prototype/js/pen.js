import { draw } from "./drawing.js";
import { pushHistory } from "./history.js";
import { getCanvas ,
  
  getPenColorPickerCircle,
  getPenColorPicker,
  getPenFontSizeSelect
} from "./index.js";
import { getState, updateState } from "./state.js";
import { screenToWorld, worldToScreen } from "./utils.js";

const canvas = getCanvas();
const penColorPickerCircle = getPenColorPickerCircle();
const penColorPicker = getPenColorPicker();
const penFontSizeSelect = getPenFontSizeSelect()


canvas.addEventListener("pointerdown", (e) => {
  const state = getState();
  if (state.currentTool !== "pen") return;

  // Track active pointer
  let { x, y } = screenToWorld(e.clientX, e.clientY)
  state.pointerMap.set(e.pointerId, { x, y });

  // Start a new stroke
  state.pens[state.idCounterPen] = [
    {
      x,
      y,
      time: Date.now(),
      color: state.penColor,
      penSize: state.penSize,
      
    }
  ];
});


canvas.addEventListener("pointermove", (e) => {
  const state = getState();
  let { idCounterPen, pens } = state;
  if (state.currentTool !== 'pen') return;
  if (!state.pointerMap.has(e.pointerId)) return;

  // Convert to world coords right away
  let worldPos = screenToWorld(e.clientX, e.clientY);

  // Get the active pen stroke
  if (!pens[idCounterPen]) {
    pens[idCounterPen] = [{
      ...worldPos,
      time: Date.now(),
      color: state.penColor,
      penSize: state.penSize,

    }];
    return;
  }

  let pen = pens[idCounterPen];
  let last = pen[pen.length - 1];

  // Distance check
  const dx = worldPos.x - last.x;
  const dy = worldPos.y - last.y;
  const distSq = dx * dx + dy * dy;

  // Add only if moved enough (minDist = 2px)
  const minDist = 10;
  if (distSq > minDist * minDist) {
    pen.push({
      ...worldPos,
      time: Date.now(),
      color: state.penColor,
      penSize: state.penSize,

    });
  }

  draw();
});

canvas.addEventListener("pointerup", (e) => {
  const state = getState();
    console.log(state)

  if (state.currentTool !== "pen") return;
  pushHistory()

  // // End stroke → increment counter
  // state.idCounterPen++;
  // state.pointerMap.delete(e.pointerId)

  // Only increment counter if we actually drew something
  if (state.pens[state.idCounterPen]?.length > 1) {
    state.idCounterPen++;

  } else {
    // Remove empty pen stroke
    delete state.pens[state.idCounterPen];

  }
});


penColorPicker.oninput = (ev) => {
  const state = getState();
  const color = ev.target.value
  state.penColor = color;
  penColorPickerCircle.style.backgroundColor = color
  draw();
};


  penFontSizeSelect.onchange = function() {
    const state = getState();

    state.penSize = this.value;
    draw();
  }
  

console.log("pen.js loaded");
import { getState, updateState } from "./state.js";
import { pushHistory } from "./history.js";
import { draw } from "./drawing.js";

// Create connector
export function createConnector(aId, bId, breakPoints) {
  if (!aId || !bId || aId === bId) return null;

  const { connectors, connectorIdCounter } = getState();

  // prevent duplicates
  // const exists = connectors.some(
  //   (c) => (c.aId === aId && c.bId === bId) || (c.aId === bId && c.bId === aId)
  // );
  const exists = connectors.some(
    (c) => (c.aId === aId && c.bId === bId) // allow two-way
  );
  if (exists) return null;

  const conn = {
    id: connectorIdCounter,
    aId,
    bId,
    breakPoints, // {worldX, worldY}[]
  };

  // Update state
  connectors.push(conn);
  updateState({ connectorIdCounter: connectorIdCounter + 1, connectors });

  pushHistory();
  draw();
  return conn;
}

// Hit testing (top-down)
export function hitTestNotes(wx, wy) {
  // check if point (wx,wy) is inside any note
  // return the topmost note (last in array)
  // or null if none hit
  const { notes } = getState();

  for (let i = notes.length - 1; i >= 0; i--) {
    const n = notes[i];
    if (wx >= n.x && wx <= n.x + n.w && wy >= n.y && wy <= n.y + n.h) {
      return n;
    }
  }
  return null;
  //
}

export function hitTestConnectorBreakPoint(wx, wy) {
  // check if point (wx,wy) is inside any note
  // return the topmost note (last in array)
  // or null if none hit
  const { connectors } = getState();

  for (let connector of connectors) {
    for (let breakPoint of connector.breakPoints) {
      let { worldX, worldY } = breakPoint
      let threshold = 8
      let xCondition = wx > worldX - threshold && wx < worldX + threshold
      let yCondition = wy > worldY - threshold && wy < worldY + threshold
      if (
        xCondition && yCondition
      ) {
        return breakPoint
      }
    }
  }
  return null;
  //
}

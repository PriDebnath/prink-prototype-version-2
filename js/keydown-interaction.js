
import { getState, updateState } from "./state.js";
import { getCanvas, getEditor, getSnapToggle, getGridToggle } from "./index.js";
import { draw } from "./drawing.js";
import { createNote, hideEditor } from "./notes.js";
import { screenToWorld, worldToScreen } from "./utils.js";
import { createConnector, hitTestNotes } from "./connectors.js";
import { pushHistory, redo, undo } from "./history.js";
import { handleGridToggle, handleSnapToGrid, setTool } from "./toolbar-interactions.js";


// --- Keyboard ---
window.addEventListener("keydown", (e) => {
    const state = getState();
    const { selectedIds } = state;
    const isCmd = e.ctrlKey || e.metaKey;

    if (isCmd && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setTool("select");
        return;
    }
    if (isCmd && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        setTool("connect");
        return;
    }
    if (isCmd && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        setTool("sticky");
        return;
    }
    // bottom toolbar
    if (isCmd && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        undo();
        return;
    }
    if (isCmd && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        redo();
        return;
    }
    if (isCmd && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        handleSnapToGrid();
        return;
    }
    if (isCmd && (e.key === "g" || e.key === "G")) {
        e.preventDefault();
        handleGridToggle();
        return;
    }
    if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.size > 0) {
            const s = getState();
            const newNotes = s.notes.filter((n) => !selectedIds.has(n.id));
            const newConnectors = s.connectors.filter(
                (c) => !selectedIds.has(c.aId) && !selectedIds.has(c.bId)
            );
            updateState({
                notes: newNotes,
                connectors: newConnectors,
                selectedIds: new Set(),
                primarySelectedId: null,
            });
            pushHistory();
            draw();
        }
    }
    if (e.key === "Escape") {
        updateState({
            selectedIds: new Set(),
            primarySelectedId: null,
            marquee: null,
            connectFirst: null,
        });
        hideEditor();
        draw();
    }
});

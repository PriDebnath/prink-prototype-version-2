import { PanTool, PenTool } from "../../tools";
import type { Tool, AppState, CanvasState } from "../../types";
import { Button, type ButtonKeys } from "../button";

export const Toolbar = ({
  activeTool,
  setActiveTool,
  appState,
  canvasState,
  setAppState,
}: {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  canvasState: CanvasState;
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}) => {
  console.log({    activeTool})
  // 🔸 Top-level tool buttons (always visible)
  const mainTools: [ButtonKeys, () => void][] = [
    [
      "clean",
      () => {
        canvasState.paths = [];
        setAppState((pri) => ({ ...pri })); // force rerender
      },
    ],
  ];

  // ✏️ Pen sub-tools (only shown when PenTool is active)
  const penTools: [ButtonKeys, () => void][] = [
    [
      "pencil",
      () => {
        setAppState((prev) => ({
          ...prev,
          pen: { ...prev.pen, type: "pencil" },
        }));
      },
    ],
    [
      "highlighter",
      () => {
        setAppState((pritam) => ({
          ...pritam,
          pen: { ...pritam.pen, type: "highlighter" },
        }));
      },
    ],
  ];

  const renderButtons = (toolList: [ButtonKeys, () => void][]) =>
    toolList.map(([name, handler]) => {
      const Btn = Button[name];
      return (
        <div className="tool" key={name}>
          <Btn
            onClick={handler}
            className={appState.pen?.type === name ? "active" : ""}
          />
        </div>
      );
    });

  return (
    <footer className="toolbar-wrapper">
      <div className="toolbar" role="toolbar" aria-label="Tools">
        {/* 🔸 Always visible tools */}
        {renderButtons(mainTools)}

        {/* ✏️ Shown only when active tool is PenTool */}
        {activeTool.name === "pen" && (renderButtons(penTools))}
      </div>
    </footer>
  );
};

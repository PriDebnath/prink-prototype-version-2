import { useState } from "react"
import { Icons } from "../icon";
import { ColorPellet } from "./color-pellet";
import { Button, type ButtonKeys } from "../button";
import type { Tool, AppState, CanvasState } from "../../types";
import { LassoTool, StrokeToolBase } from "../../utils/tool";
// import { PanTool, PenTool, LassoTool, EraserTool } from "../../tools";
// import { PencilTool, AirbrushTool, EraserTool } from "../../utils/tool";

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

  const [openColorPellet, setOpenColorPellet] = useState<boolean>(false)

  console.log({ activeTool })
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
    [
      "airbrush",
      () => {
        setAppState((prev) => ({
          ...prev,
          pen: { ...prev.pen, type: "airbrush" },
        }));
      },
    ],
    [
      "eraser",
      () => {
        setAppState((prev) => ({
          ...prev,
          pen: { ...prev.pen, type: "eraser" },
        }));
      },
    ],
    [
      "lasso",
      () => {
        if (activeTool.name == "lasso") {
          setActiveTool(new StrokeToolBase())
        } else {
          setActiveTool(new LassoTool())
        }
        setAppState((pri) => ({ ...pri }));// side effect to re-render stuff
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
            className={
              (activeTool.name === name || appState.pen?.type === name) ? "active" : ""
            }
          />
        </div>
      );
    });


  return (
    <footer>
      {
        (openColorPellet && (activeTool.name === "pen" || activeTool.name === "lasso")) && (
          <ColorPellet canvasState={canvasState} appState={appState} setAppState={setAppState} />
        )
      }
      <div className="toolbar-wrapper">
        <div className="toolbar" role="toolbar" aria-label="Tools">
          {/* 🔸 Always visible tools */}
          {renderButtons(mainTools)}

          {/* ✏️ Shown only when active tool is PenTool */}
          {
            (activeTool.name === "pen" || activeTool.name === "lasso") && (
              <>
            {    renderButtons(penTools)}

                <button
                  className="tool circle color-ball"
                  id="pen-color-picker-circleg"
                  style={{
                    background: appState.pen.color,
                    cursor: 'pointer',
                    outline: openColorPellet
                      ? `${(appState.pen.size ?? 10) / 10}px solid blue`
                      : "0px solid transparent",
                  }}
                  onClick={() => {
                    setOpenColorPellet(!openColorPellet)
                  }
                  }
                >
                </button>
              </>
            )
          }

        </div>
      </div>
    </footer>
  );
};

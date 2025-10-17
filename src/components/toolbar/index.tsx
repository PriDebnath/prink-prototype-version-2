import { useState } from "react"
import { PanTool, PenTool, SelectTool } from "../../tools";
import type { Tool, AppState, CanvasState } from "../../types";
import { Button, type ButtonKeys } from "../button";
import { Icons } from "../icon";

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
      "lasso",
      () => {
        if (activeTool.name == "lasso") {
          setActiveTool(new PenTool())
        } else {
          setActiveTool(new SelectTool())
        }
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

  const colors = ["#ff0000", "#ff6f00", "#ffb700", "#ffb700", "#c8ff00", "#00ff22", "#00ff99", "#00fbff", "#0090ff", "#1900ff", "#1900ff", "#7b00ff", "#ff00ff", "#ff006f", "#ff0000"]

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
          <div className="toolbar-subbar-wrapper">
            <div className="toolbar" role="toolbar" aria-label="Tools"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem"
              }}
            >
              <div style={{ width: "100%" }}>
                <input
                  value={appState.pen.size}
                  style={{ display: "flex", width: "100%" }} type="range"
                  onChange={(e) => {
                    console.log(e.target.value)
                    const penSize = e.target.value

                    setAppState((pritam) => ({
                      ...pritam,
                      pen: {
                        ...pritam.pen,
                        size: parseInt(penSize)
                      },
                    }));
                  }

                  }
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <label className="color-pick tooltip "
                  data-tooltip="Pen color"
                  data-tooltip-pos="top">
                  <input type="color"
                    id="pen-color-picker"
                    onChange={
                      (e) => {
                        console.log(e.target)
                        console.log(e.target.value)
                        const color = e.target.value
                        setAppState((pritam) => ({
                          ...pritam,
                          pen: { ...pritam.pen, color: color },
                        }));
                      }}
                    style={{ display: "none", }}
                  />
                  <Button.colorPicker
                    style={{
                      pointerEvents: "none",
                      display: "flex",
                      aspectRatio: "1"
                    }}
                    className="active" />
                </label>

                {
                  colors.map((color, p) => {
                    return (
                      <div
                        className="color-ball"
                        style={{ background: color }}
                        key={color + p}
                        onClick={
                          (e) => {
                            console.log({ color })
                            setAppState((pritam) => ({
                              ...pritam,
                              pen: { ...pritam.pen, color: color },
                            }));
                          }}
                      >

                      </div>
                    )
                  })
                }
              </div>

            </div>
          </div>
        )
      }
      <div className="toolbar-wrapper">
        <div className="toolbar" role="toolbar" aria-label="Tools">
          {/* 🔸 Always visible tools */}
          {renderButtons(mainTools)}

          {/* ✏️ Shown only when active tool is PenTool */}
          {(activeTool.name === "pen" || activeTool.name === "lasso") && (renderButtons(penTools))}
          {(activeTool.name === "pen" || activeTool.name === "lasso") && (
            <span className="circle color-ball"
              id="pen-color-picker-circleg"
              style={{
                background: appState.pen.color,
                outline: openColorPellet ? "6px solid blue" : "2px solid transparent"
              }}
              onClick={() => {
                setOpenColorPellet(!openColorPellet)
              }
              }
            >
            </span>
          )
          }
        </div>
      </div>
    </footer>
  );
};

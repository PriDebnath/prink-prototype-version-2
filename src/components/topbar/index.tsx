import { PanTool, PenTool } from "../../tools";
import type { Tool, CanvasState, AppState } from "../../types";
import { Button, type ButtonKeys } from "../button";

export const Topbar = ({
  activeTool,
  setActiveTool,
  canvasState,
  appState,
  setAppState,
}: {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  canvasState: CanvasState,
  appState: AppState,
  setAppState: React.Dispatch<React.SetStateAction<AppState>>
}) => {

  const tools: [ButtonKeys, () => void][] = [
    [
      "grid",
      () => {
        const value = appState.grid
        setAppState(pri => {
          return {
            ...pri,
            grid: !value
          }
        })
      }
    ],
    [
      "clean",
      () => {
        canvasState.paths = [];
        setAppState((pri) => ({ ...pri })); // force rerender
      },
    ],

  ];

  return (
    <footer className="topbar-wrapper">
      <div className="topbar" role="toolbar" aria-label="Tools">
        {tools.map(([name, handler]) => {
          const Btn = Button[name];
          return (
            <div className="tool" key={name}>
              <Btn
                key={name}
                onClick={handler}
                className={appState.grid ? "active" : ""}
                datatooltip={"Grid: " + (appState.grid ? "on" : "off")}
              />
            </div>
          );
        })}
      </div>
    </footer>
  );
};

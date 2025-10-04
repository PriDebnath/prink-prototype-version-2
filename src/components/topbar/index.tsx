import { PanTool, PenTool,GridTool} from "../../tools";
import type { Tool, CanvasState , AppState} from "../../types";
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
  setAppState:  (appState: AppState) => void;
}) => {
  
  const tools: [ButtonKeys, ()=>void][] = [
    [
      "grid",
      ()=>{
        let value = appState.grid
        setAppState(pri=>{
        return {
          pri,
          grid: !value
        }})
      }
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
                className={ appState.grid ? "active": ""}
                dataTooltip={ "Grid: " + (appState.grid ? "on": "off")}
                     />
            </div>
          );
        })}
      </div>
    </footer>
  );
};

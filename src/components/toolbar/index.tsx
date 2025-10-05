import { PanTool, PenTool } from "../../tools";
import type { Tool , AppState, CanvasState} from "../../types";
import { Button, type ButtonKeys } from "../button";

export const Toolbar = ({
  activeTool,
  setActiveTool,
  appState,
  canvasState,
  setAppState
}: {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  canvasState: CanvasState,
  appState: AppState,
  setAppState:  (appState: AppState) => void;
  
}) => {
  const tools: [ButtonKeys, any][] = [
    ["clean", 
    ()=>{
    console.log("clean", canvasState.paths)
    canvasState.paths = []
    setAppState(pri=>{return {...pri}}) // updating state with no changes, to trigger ui update 
    }
  ],
  ];

  return (
    <footer className="toolbar-wrapper">
      <div className="toolbar" role="toolbar" aria-label="Tools">
        {tools.map(([name, handler]) => {
          const Btn = Button[name];
          return (
            <div className="tool" key={name}>
              <Btn
                key={name}
                onClick={handler}
                className={activeTool.name === name ? "active" : ""}
              />
            </div>
          );
        })}
      </div>
    </footer>
  );
};

import { PanTool, PenTool } from "../../tools";
import { Button, type ButtonKeys } from "../button";
import type { Tool, CanvasState, AppState } from "../../types";
import { useNavigate } from "@tanstack/react-router";

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

  const navigate = useNavigate()

  const tools: [ButtonKeys, () => void][] = [
    [
      "home",
      () => {
        navigate({ to: "/" })
      }
    ],
    // [
    //   "grid",
    //   () => {
    //     const value = appState.grid
    //     setAppState(pri => {
    //       return {
    //         ...pri,
    //         grid: !value
    //       }
    //     })
    //   }
    // ],
    [
      "clean",
      () => {
        canvasState.paths = [];
        setAppState((pri) => ({ ...pri })); // force rerender
      },
    ],
    [
      "settings",
      () => {
        console.log("settings");
        const value = appState.openSettings
        setAppState(pri => {
          return {
            ...pri,
            openSettings: !value
          }
        })
      },
    ],
  ];

  const className = (name: ButtonKeys) => {
    if (name === "grid") {
      return appState.grid ? "active" : "";
    }
    if (name === "settings") {
      return appState.openSettings ? "active" : "";
    }
    return "";
  }

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
                className={className(name)}
                datatooltip={name}
              />
            </div>
          );
        })}
      </div>
    </footer>
  );
};

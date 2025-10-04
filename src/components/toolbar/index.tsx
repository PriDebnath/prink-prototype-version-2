import { PanTool, PenTool } from "../../tools";
import type { Tool } from "../../types";
import { Button, type ButtonKeys } from "../button";

export const Toolbar = ({
  activeTool,
  setActiveTool,
}: {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}) => {
  const tools: [ButtonKeys, Tool][] = [
    ["clean", new PanTool()],
  ];

  return (
    <footer className="toolbar-wrapper">
      <div className="toolbar" role="toolbar" aria-label="Tools">
        {tools.map(([name, tool]) => {
          const Btn = Button[name];
          return (
            <div className="tool" key={name}>
              <Btn
                key={name}
                onClick={() => setActiveTool(tool)}
                className={activeTool.name === name ? "active" : ""}
              />
            </div>
          );
        })}
      </div>
    </footer>
  );
};

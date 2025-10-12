import { PanTool, PenTool, SelectTool } from "../../tools";
import type { Tool } from "../../types";
import { Button, type ButtonKeys } from "../button";

export const Sidebar = ({
  activeTool,
  setActiveTool,
}: {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}) => {
  const tools: [ButtonKeys, Tool][] = [
   // ["select", new SelectTool()],
    ["pan", new PanTool()],
    ["pen", new PenTool()],
  ];

  return (
    <aside className="sidebar-wrapper">
      <div className="sidebar" role="toolbar" aria-label="Tools">
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
    </aside>
  );
};

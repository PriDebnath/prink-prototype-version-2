import { PanTool, PenTool } from "../../tools";
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
    ["pan", new PanTool()],
    ["pen", new PenTool()],
  ];

  return (
    <aside className="sidebar-wrapper">
      <div className="sidebar" role="toolbar" aria-label="Tools">
        <div className="tool">
          {tools.map(([name, tool]) => {
            const Btn = Button[name];
            return (
              <Btn
                key={name}
                onClick={() => setActiveTool(tool)}
                className={activeTool.name === name ? "active" : ""}
              />
            );
          })}
        </div>
      </div>
    </aside>
  );
};

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
  const tools: {
    name: ButtonKeys,
    subToolNames?: ButtonKeys[],
    tool: Tool
  }[] = [
      {
        name: "pan",
        tool: new PanTool()
      },
      {
        name: "pen",
        subToolNames: ["lasso", "eraser"],
        tool: new PenTool()
      }
    ];

  return (
    <aside className="sidebar-wrapper">
      <div className="sidebar" role="toolbar" aria-label="Tools">
        {tools.map((toolData) => {
          const Btn = Button[toolData.name];
          return (
            <div className="tool" key={"sidebar-tool-" + toolData.name}>
              <Btn
                key={"sidebar-tool-button" + toolData.name}
                id={"sidebar-tool-button" + toolData.name}
                onClick={() => setActiveTool(toolData.tool)}
                className={
                  (activeTool.name === toolData.name
                    || toolData?.subToolNames?.includes((activeTool.name as ButtonKeys))
                  ) ? "active" : ""}
              />
            </div>
          );
        })}
      </div>
    </aside>
  );
};

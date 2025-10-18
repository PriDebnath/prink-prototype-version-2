import type { CanvasState, AppState } from "../../../types";
import { Button } from "../../button";


interface ColorPelletProps {
    canvasState: CanvasState;
    appState: AppState;
    setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const ColorPellet = ({ canvasState, appState, setAppState }: ColorPelletProps) => {
  const colors = ["#ff0000", "#ff6f00", "#ffb700", "#ffb700", "#c8ff00", "#00ff22", "#00ff99", "#00fbff", "#0090ff", "#1900ff", "#1900ff", "#7b00ff", "#ff00ff", "#ff006f", "#ff0000"]

    return (
        <div className="toolbar-subbar-wrapper">
            <div className="toolbar" role="toolbar" aria-label="Tools"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: canvasState.device == "mobile" ? "0.25rem" : "0.5rem",
                borderRadius: canvasState.device == "mobile" ? "0.8rem" : "1.6rem",

              }}
            >
              <div style={{ width: "100%", }}>
                <input
                  value={appState.pen.size}
                  style={{ display: "flex", width: "100%", paddingTop: "0px", marginTop: "0px" }} type="range"
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

              <div style={{
                display: "flex",

                gap: canvasState.device == "mobile" ? "0.25rem" : "0.5rem",

              }}>
                <label className="color-pick tooltip "
                  data-tooltip="Pen color"
                  data-tooltip-pos="top"

                >
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
                      aspectRatio: "1",
                      ...(canvasState.device == "mobile" && {
                        animation: "none",
                        padding: "4px",
                        height: "1rem",
                        width: "1rem",
                      }
                      )

                    }}
                    className="active" />
                </label>

                {
                  colors.map((color, p) => {
                    return (
                      <div
                        className="color-ball"
                        style={{
                          background: color,
                          height: canvasState.device == "mobile" ? "1rem" : undefined,
                          width: canvasState.device == "mobile" ? "1rem" : "2rem",
                        }}
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
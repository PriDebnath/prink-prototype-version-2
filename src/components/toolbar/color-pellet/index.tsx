import { Button } from "../../button";
import type { CanvasState, AppState } from "../../../types";


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
          <label>Size </label>
          <input
            value={appState.pen.size}
            style={{ display: "flex", width: "100%", paddingTop: "0px", marginTop: "0px" }}
            type="range"
            step="2"
            min="2"
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


        <div style={{ width: "100%", }}>
          <label>Opacity </label>
          <input
            value={appState.pen.opacity}
            max="1"
            min="0.05"
            step="0.05"
            type="range"
            style={{ display: "flex", width: "100%", paddingTop: "0px", marginTop: "0px" }}
            onChange={(e) => {
              console.log(e.target.value)
              const penOpacity = e.target.value

              setAppState((pritam) => ({
                ...pritam,
                pen: {
                  ...pritam.pen,
                  opacity: parseFloat(penOpacity)
                },
              }));
            }

            }
          />
        </div>




        <div style={{
          display: "flex",
          pointerEvents: "auto",
          gap: canvasState.device == "mobile" ? "0.25rem" : "0.5rem",
        }}>
          <label className="color-pick tooltip "
            style={{ cursor: "pointer" }}
            data-tooltip="Pen color"
            data-tooltip-pos="top"
            htmlFor="pen-color-picker"
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
                animation: "none",
                padding: `calc(var(--space) * 1)`,
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
                <button
                  className="color-ball tooltip"
                  style={{
                    background: color,
                    height: canvasState.device == "mobile" ? "1rem" : undefined,
                    width: canvasState.device == "mobile" ? "1rem" : "2rem",
                  }}
                   data-tooltip={color}
                   data-tooltip-pos="top"
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
                </button>
              )
            })
          }
        </div>

      </div>
    </div>
  )
}
import Themes from "../../components/themes";
import { Toggle } from "../../components/toggle";
import type { AppState } from "../../types"

interface SettingsDialogProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}


export default function SettingsDialog({ appState, setAppState }: SettingsDialogProps) {


  const handleClose = () => {
    const value = appState.openSettings
    setAppState(pri => {
      return {
        ...pri,
        openSettings: !value
      }
    })
  }

  const handleGridChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppState(pri => {
      return {
        ...pri,
        grid: e.target.checked
      };
    });
  };
  return (
    <div className={
      "modal-overlay " +
      (appState.openSettings ? "show" : "")
    } id="modalOverlay"
      onClick={handleClose}
    >
      <div className={
        "modal " +
        (appState.openSettings ? "show" : "")
      }
        onClick={(e) => { e.stopPropagation() }}

        id="modal">
        <button className="close-btn"
          onClick={handleClose}
          id="close-btn">X</button>

        <div>
          <h3 id="modalTitle">Settings</h3>
          <Toggle label="Grid" id="toggle-grid"  checked={appState.grid} className="toggle-grid" onChange={handleGridChange} />
          <Themes />
        </div>
      </div>
    </div>
  );
}
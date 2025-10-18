


export default function SettingsDialog(props) {
return (
<div className={
    "modal-overlay " +
    (props.appState.openSettings ? "show" : "")
  } id="modalOverlay">
  <div className={
    "modal " +
    (props.appState.openSettings ? "show" : "")
  }
       id="modal">
    <button class="close-btn"
    onClick={()=>{
      const value = props.appState.openSettings
        props.setAppState(pri => {
          return {
            ...pri,
            openSettings: !value
          }
        })
    }}
            id="close-btn">X</button>

ddddd
    <h3 id="modalTitle"></h3>
ffcvvv
    <div id="rc-content-box">ddd</div>
  </div>
</div>
  
)
}
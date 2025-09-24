import { getName,
getNameInput, 
getGridToggle, 
getZoomInBtn, 
getZoomOutBtn,
  getDownloadPngBtn
} from './index.js';
import { getState } from './state.js';

let name = getName();
let state = getState();
let nameInput = getNameInput();
let zoomInBtn = getZoomInBtn();
let zoomOutBtn = getZoomOutBtn();
let gridToggle = getGridToggle();
let downloadPngBtn = getDownloadPngBtn();

// initialize
name.textContent = state.name;
nameInput.classList.add("hidden");

// click to edit
name.addEventListener("click", () => {
  name.classList.add("hidden");
  nameInput.classList.remove("hidden");
  nameInput.value = name.textContent;
  nameInput.focus();
  
  // hide others
  zoomInBtn.setAttribute("style", "display:none !important");
  zoomOutBtn.setAttribute("style", "display:none !important");
  gridToggle.setAttribute("style", "display:none !important");
  downloadPngBtn.setAttribute("style", "display:none !important");

});

// blur to save
nameInput.addEventListener("blur", () => {
  nameInput.classList.add("hidden");
  name.textContent = nameInput.value;
  state.name = nameInput.value;
  name.classList.remove("hidden");
  
    // show others
  zoomInBtn.setAttribute("style", "display:auto !important");
  zoomOutBtn.setAttribute("style", "display:auto !important");
  gridToggle.setAttribute("style", "display:auto !important");
  downloadPngBtn.setAttribute("style", "display:auto !important");

});

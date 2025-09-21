import { getName, getNameInput } from './index.js';
import { getState } from './state.js';

let state = getState();
let name = getName();
let nameInput = getNameInput();

// initialize
name.textContent = state.name;
nameInput.classList.add("hidden");

// click to edit
name.addEventListener("click", () => {
  name.classList.add("hidden");
  nameInput.value = name.textContent;
  nameInput.classList.remove("hidden");
  nameInput.focus();
});

// blur to save
nameInput.addEventListener("blur", () => {
  nameInput.classList.add("hidden");
  name.textContent = nameInput.value;
  state.name = nameInput.value;
  name.classList.remove("hidden");
});

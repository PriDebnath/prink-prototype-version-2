import { getName, getNameInput } from './index.js';
import { getState } from './state.js';
let state = getState()
let name = getName()
let nameInput = getNameInput()
// name
name.textContent = state.name
name.addEventListener("click",()=>{
  name.style.display = 'none'
  nameInput.value = name.textContent
  nameInput.style.display = 'block'
  nameInput.focus()
})
// name input
nameInput.style.display = 'none'
nameInput.addEventListener('blur',()=>{
  nameInput.style.display = 'none'
  name.style.display = 'block'
  let val = nameInput.value
  name.textContent = val
  state.name = val
})




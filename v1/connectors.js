import { getState, addConnector, saveToStorage } from './state.js';

export function connectSelectedPair(){
  const s = getState();
  if (s.selection.ids.length !== 2) return;
  const [a,b] = s.selection.ids;
  addConnector(a,b);
  saveToStorage();
}

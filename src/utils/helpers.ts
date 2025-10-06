export function getDarkenColor(hex) {
  let c = parseInt(hex.slice(1), 16);
  let r = Math.floor(((c >> 16) & 255));
  let g = Math.floor(((c >> 8) & 255));
  let b = Math.floor((c & 255) );
  return `rgba(${r},${g},${b}, 0.5)`;
}
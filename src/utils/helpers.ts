export function getDarkenColor(hex: string): string {
  const c = parseInt(hex.slice(1), 16);
  const r = Math.floor(((c >> 16) & 255));
  const g = Math.floor(((c >> 8) & 255));
  const b = Math.floor((c & 255) );
  return `rgba(${r},${g},${b}, 0.5)`;
}
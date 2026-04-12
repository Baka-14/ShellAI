export const C = {
  red: "#E21833",
  gold: "#FFD520",
  ink: "#111110",
  bg: "#F7F7F5",
  card: "#FFFFFF",
  border: "#E5E3DD",
  muted: "#8A8880",
  subtle: "#F3F1EC",
  green: "#1A7F37",
  accent2: "#5B4FCF",
  blue: "#2563EB",
};

export const rgba = (h, a) => {
  const v = parseInt(h.slice(1), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
};

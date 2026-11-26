/** Black/white text for the accessible name-color display mode. */
export function getAccessibleTextColor(theme) {
  return theme.palette.mode === "dark" ? "#ffffff" : "#000000";
}

// Empty, white, and near-white names are unreadable on a light page.
export function isNearWhiteNameColor(color) {
  if (color == null) return true;
  const s = String(color).trim().toLowerCase();
  if (!s || s === "white" || s === "transparent" || s === "none") return true;
  let hex = s;
  if (hex.startsWith("rgb")) {
    const parts = hex.match(/\d+/g);
    if (!parts || parts.length < 3) return false;
    const [r, g, b] = parts.slice(0, 3).map(Number);
    return r >= 230 && g >= 230 && b >= 230;
  }
  if (hex[0] === "#") hex = hex.slice(1);
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/.test(hex)) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return r >= 230 && g >= 230 && b >= 230;
}

export function skinLightForcesBlack(color) {
  if (typeof document === "undefined") return false;
  const root = document.documentElement;
  if (!root.classList.contains("skin-redesign")) return false;
  if (!root.classList.contains("light-mode")) return false;
  return isNearWhiteNameColor(color);
}

export function resolveDisplayNameColor({
  accessibleNameColors,
  ignoreTextColor,
  rawNameColor,
  autoContrastColor,
  theme,
}) {
  if (accessibleNameColors) {
    return getAccessibleTextColor(theme);
  }
  if (skinLightForcesBlack(rawNameColor)) {
    return "#000000";
  }
  if (ignoreTextColor || !rawNameColor) {
    return "";
  }
  return autoContrastColor(rawNameColor);
}

export function resolveDisplayTextColor({
  accessibleNameColors,
  ignoreTextColor,
  rawTextColor,
  autoContrastColor,
  theme,
}) {
  if (accessibleNameColors) {
    return getAccessibleTextColor(theme);
  }
  if (ignoreTextColor || !rawTextColor) {
    return null;
  }
  return autoContrastColor(rawTextColor);
}
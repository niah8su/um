import { useEffect, useState } from "react";

// One table, copied from lobby-draft-v9.html (the last rule that wins the cascade).
// Tabs and game-row tags both read this. Do not restyle a lobby type anywhere else.

const HEART =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
const PAIL =
  "M3 21.2h18v1.4H3zM5.2 20.6l1.6-8.2h2.1V9.6h1.5v2.8h3.2V9.6h1.5v2.8h2.1l1.6 8.2H5.2zM11.2 2.4h1.6V7h-1.6zM12.8 2.8 16.4 4.2 12.8 5.6zM10.6 15.4c0-1 .8-1.6 1.6-1.6s1.6.6 1.6 1.6V20.6h-3.2v-5.2z";
const DICE =
  "M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm2.1 4.2a1.25 1.25 0 1 0 .01 0zm7.8 0a1.25 1.25 0 1 0 .01 0zM12 10.7a1.25 1.25 0 1 0 .01 0zM8.1 14.3a1.25 1.25 0 1 0 .01 0zm7.8 0a1.25 1.25 0 1 0 .01 0z";
const TORCH =
  "M12 1.2c2.6 2.4 4.4 4.1 4.4 6.6a4.4 4.4 0 0 1-8.8 0c0-2.5 1.8-4.2 4.4-6.6zM11.1 5.4c.7.8 1.2 1.3 1.2 2.1a1.3 1.3 0 0 1-2.6 0c0-.8.5-1.3 1.4-2.1zM5.6 11.4h12.8l-1.4 2.6H7zM7.6 14.8h8.8l-.5 1.3H8.1zM9.2 16.8h5.6L12 22.4z";
const ALL =
  "M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v7H4zM13 14h7v7h-7z";
const PEOPLE =
  "M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 18c.6-2.4 2.6-3.5 5-3.5s4.4 1.1 5 3.5";
const RP =
  "M4 9.5c0-3 2.4-5 5.2-5 1.6 0 2.6.6 2.8 1.6.2-1 1.2-1.6 2.8-1.6 2.8 0 5.2 2 5.2 5 0 2.2-1 4.4-2.4 6.2-1.2 1.5-2.6 2.6-3.6 3.2-1 .6-1.6.8-2 .8s-1-.2-2-.8c-1-.6-2.4-1.7-3.6-3.2C5 13.9 4 11.7 4 9.5z";

function face(color, tagBg, tagBorder) {
  return {
    color,
    // Same mix the preview computes: 16% of the type color over the row.
    tagBg: tagBg || `color-mix(in srgb, ${color} 16%, transparent)`,
    tagBorder: tagBorder || color,
  };
}

export const COUNT_BADGE = {
  background: "#e23b3b",
  color: "#fff",
  fontSize: "10px",
  fontWeight: 700,
  lineHeight: "12px",
  height: "12px",
  minWidth: "12px",
  padding: "0 4px",
  borderRadius: "999px",
  marginLeft: "5px",
  letterSpacing: "0",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};
function tab(color, bg, shadow, border) {
  return { color, bg, shadow: shadow || "none", border: border || "transparent" };
}

export const LOBBY_TAGS = {
  all: {
    label: "All",
    tabPath: ALL,
    tab: {
      dark: tab("#d8dee6", "rgba(255,255,255,.1)", "none", "rgba(255,255,255,.22)"),
      light: tab("#1f2328", "rgba(31,35,40,.06)", "none", "rgba(31,35,40,.16)"),
    },
  },
  main: {
    label: "Main",
    icon: "#e23b3b",
    tabPath: HEART,
    markPath: HEART,
    tab: {
      dark: tab("#ff6b6b", "rgba(255,107,107,.18)", "0 0 14px rgba(255,107,107,.45)"),
      light: tab("#9f1239", "#ffe4e8"),
    },
  },
  ranked: {
    label: "Ranked",
    icon: "#e23b3b",
    markPath: HEART,
    markClass: "mark-heart",
    row: {
      dark: { ...face("#e23b3b"), stub: "#FF82A9", bg: "rgba(255,130,169,.15)", border: "#FF82A9" },
      light: { ...face("#9f1239", "#ffb3bd"), stub: "#e23b3b", bg: "#ffe4e8", border: "#f09aab" },
      hoverDark: { border: "#ff6b6b", shadow: "0 0 0 1px #ff6b6b, 0 0 14px rgba(255,107,107,.5)" },
      hoverLight: { bg: "#ffe4e8", border: "#f09aab", shadow: "0 0 0 2px #f09aab" },
    },
  },
  competitive: {
    label: "Competitive",
    icon: "#edb334",
    tabPath: HEART,
    markPath: HEART,
    markClass: "mark-heart gold",
    tab: {
      dark: tab("#edb334", "rgba(237,179,52,.18)", "0 0 14px rgba(237,179,52,.45)"),
      light: tab("#854d0e", "#fff3d0"),
    },
    row: {
      dark: { ...face("#edb334"), stub: "#111", bg: "rgba(237,179,52,.12)", border: "#edb334" },
      light: { ...face("#854d0e", "#ffe08a"), stub: "#edb334", bg: "#fff1c2", border: "#edb334" },
      hoverDark: { border: "#edb334", shadow: "0 0 0 1px #edb334, 0 0 14px rgba(237,179,52,.5)" },
      hoverLight: { bg: "#fff1c2", border: "#854d0e", shadow: "0 0 0 1px #854d0e, 0 0 12px rgba(133,77,14,.3)" },
    },
  },
  sandbox: {
    label: "Sandbox",
    icon: "#d6c15a",
    tabPath: PAIL,
    markPath: PAIL,
    fillRule: "evenodd",
    markClass: "mark-fill pail",
    tab: {
      dark: tab("#f0d34a", "rgba(240,211,74,.16)", "0 0 14px rgba(240,211,74,.4)"),
      light: tab("#8a6a04", "#fff6cc"),
    },
    row: {
      dark: { ...face("#d6c15a"), stub: "#d6c15a", bg: "rgba(214,193,90,.15)", border: "#d6c15a" },
      light: { ...face("#8f6b00", "#fff3b0", "#e6c35c"), stub: "#f5d76e", bg: "#fff6c4", border: "#e6c35c" },
      hoverDark: { border: "#f0d34a", shadow: "0 0 0 1px #f0d34a, 0 0 14px rgba(240,211,74,.45)" },
      hoverLight: { bg: "#fff8d6", border: "#e6c35c", shadow: "0 0 0 2px #e6c35c" },
    },
  },
  minigames: {
    label: "Minigames",
    icon: "#5ec8d6",
    tabPath: DICE,
    markPath: DICE,
    fillRule: "evenodd",
    markClass: "mark-fill dice",
    tab: {
      dark: tab("#58a6ff", "rgba(88,166,255,.18)", "0 0 14px rgba(88,166,255,.45)"),
      light: tab("#1d4ed8", "#e0f2fe"),
    },
    row: {
      dark: { ...face("#5ec8d6"), stub: "#7BEDFF", bg: "rgba(123,237,255,.15)", border: "#7BEDFF" },
      light: { ...face("#0e7490", "#b6f0ff"), stub: "#7BEDFF", bg: "#dff7ff", border: "#7ad4ea" },
      hoverDark: { border: "#58a6ff", shadow: "0 0 0 1px #58a6ff, 0 0 14px rgba(88,166,255,.5)" },
      hoverLight: { bg: "#dff7ff", border: "#7ad4ea", shadow: "0 0 0 2px #7ad4ea" },
    },
  },
  survivor: {
    label: "Survivor",
    icon: "#6fbf6f",
    tabPath: TORCH,
    markPath: TORCH,
    fillRule: "evenodd",
    markClass: "mark-fill torch",
    tab: {
      dark: tab("#3fb950", "rgba(63,185,80,.18)", "0 0 14px rgba(63,185,80,.4)"),
      light: tab("#166534", "#dcfce7"),
    },
    row: {
      dark: { ...face("#6fbf6f"), stub: "#5cb85c", bg: "rgba(92,184,92,.15)", border: "#5cb85c" },
      light: { ...face("#166534", "#b6f5c4"), stub: "#5cb85c", bg: "#e5fbe8", border: "#7dce90" },
      hoverDark: { border: "#3fb950", shadow: "0 0 0 1px #3fb950, 0 0 14px rgba(63,185,80,.45)" },
      hoverLight: { bg: "#e5fbe8", border: "#7dce90", shadow: "0 0 0 2px #7dce90" },
    },
  },
  roleplay: {
    label: "Roleplay",
    icon: "#c084fc",
    tabPath: PEOPLE,
    markPath: RP,
    markClass: "mark-fill",
    tab: {
      dark: tab("#c084fc", "rgba(168,85,247,.18)", "0 0 12px rgba(168,85,247,.35)"),
      light: tab("#6b21a8", "#f3e8ff"),
    },
    row: {
      dark: { ...face("#c084fc"), stub: "#d8b4fe", bg: "rgba(192,132,252,.16)", border: "#d8b4fe" },
      light: { ...face("#5b21b6", "#eadcff"), stub: "#d8b4fe", bg: "#f6edff", border: "#c9a4f0" },
      hoverDark: { border: "#a855f7", shadow: "0 0 0 1px #a855f7, 0 0 12px rgba(168,85,247,.45)" },
      hoverLight: { bg: "#f6edff", border: "#c9a4f0", shadow: "0 0 0 2px #c9a4f0" },
    },
  },
  unranked: {
    label: "Unranked",
    icon: "#8b949e",
    markCircle: true,
    markClass: "mark-fill neutral",
    row: {
      dark: { ...face("#8b949e"), stub: "#8b949e", bg: "rgba(139,148,158,.16)", border: "#8b949e" },
      light: { ...face("#3f4650", "#e5e7eb", "#c5c8ce"), stub: "#8b949e", bg: "#eef0f3", border: "#c5c8ce" },
      hoverDark: { border: "#8b949e", shadow: "0 0 0 1px #8b949e, 0 0 10px rgba(139,148,158,.35)" },
      hoverLight: { bg: "#f3f4f6", border: "#c5c8ce", shadow: "0 0 0 2px #c5c8ce" },
    },
  },
};

const TAB_ID = {
  all: "all",
  main: "main",
  sandbox: "sandbox",
  competitive: "competitive",
  comp: "competitive",
  games: "minigames",
  minigames: "minigames",
  mini: "minigames",
  survivor: "survivor",
  surv: "survivor",
  roleplay: "roleplay",
};

export function lobbyTabId(lobby) {
  const raw = String(lobby.displayName || lobby.name || "")
    .replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "")
    .toLowerCase();
  return TAB_ID[raw] || "all";
}

export function rowTagId(game) {
  if (game.competitive) return "competitive";
  if (game.ranked) return "ranked";
  if (game.lobby === "Sandbox") return "sandbox";
  if (game.lobby === "Games") return "minigames";
  if (game.lobby === "Survivor") return "survivor";
  if (game.lobby === "Roleplay") return "roleplay";
  return "unranked";
}

export function useSiteLight() {
  const [light, setLight] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("light-mode")
  );
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setLight(el.classList.contains("light-mode"));
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return light;
}

export function tagPillStyle(id, light) {
  const row = (LOBBY_TAGS[id] || LOBBY_TAGS.unranked).row;
  if (!row) return undefined;
  const tone = light ? row.light : row.dark;
  return {
    color: tone.color,
    background: tone.tagBg,
    borderColor: tone.tagBorder,
    "--tag-color": tone.color,
    "--tag-bg": tone.tagBg,
    "--tag-border": tone.tagBorder,
  };
}

export function rowSurfaceStyle(id, light) {
  const row = (LOBBY_TAGS[id] || LOBBY_TAGS.unranked).row;
  const face = light ? row.light : row.dark;
  const hover = light ? row.hoverLight : row.hoverDark;
  return {
    "--row-bg": face.bg,
    "--row-border": face.border,
    "--row-stub": face.stub,
    "--row-hover-bg": hover.bg || face.bg,
    "--row-hover-border": hover.border,
    "--row-hover-shadow": hover.shadow,
  };
}

export function tabFaceStyle(id, light) {
  const spec = LOBBY_TAGS[id] || LOBBY_TAGS.all;
  const face = light ? spec.tab.light : spec.tab.dark;
  return {
    "--tab-on": face.color,
    "--tab-on-bg": face.bg,
    "--tab-on-shadow": face.shadow,
    "--tab-on-border": face.border,
  };
}

export function TagGlyph({ id, which = "tab" }) {
  const spec = LOBBY_TAGS[id] || LOBBY_TAGS.unranked;
  const cls = which === "mark" ? `mark-ico ${spec.markClass || ""}` : "tab-ico";
  const paint = spec.icon ? { color: spec.icon } : undefined;
  if (which === "mark" && spec.markCircle) {
    return (
      <svg className={cls} style={paint} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="5" fill="currentColor" />
      </svg>
    );
  }
  const d = which === "mark" ? spec.markPath || spec.tabPath : spec.tabPath || spec.markPath;
  return (
    <svg className={cls} style={paint} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" fillRule={spec.fillRule || "nonzero"} d={d} />
    </svg>
  );
}

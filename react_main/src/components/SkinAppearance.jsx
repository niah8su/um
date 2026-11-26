import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useColorScheme } from "@mui/material/styles";
import { UserContext } from "Contexts";
import { useSkinRedesign } from "./useSkinRedesign";

// Visual-only accent and page washes for the redesign. Stored in this browser.
// Light and dark still use the existing Site Color Scheme setting.
const STORE = "um-skin-colors";

function loadColors() {
  try {
    return JSON.parse(window.localStorage.getItem(STORE) || "{}");
  } catch (e) {
    return {};
  }
}

function luminance(hex) {
  const h = String(hex || "").replace("#", "");
  if (h.length < 6) return 0;
  const channel = (i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

export function applySkinColors(mode) {
  const saved = loadColors();
  const light = mode === "light";
  const root = document.documentElement;
  const accent = saved[light ? "accentLight" : "accent"];
  const g1 = saved[light ? "g1Light" : "g1"];
  const g2 = saved[light ? "g2Light" : "g2"];
  if (accent) {
    root.style.setProperty("--um-accent", accent);
    root.style.setProperty(
      "--um-accent-ink",
      luminance(accent) > 0.45 ? "#1c1917" : "#ffffff"
    );
  } else {
    root.style.removeProperty("--um-accent");
    root.style.removeProperty("--um-accent-ink");
  }
  if (g1) root.style.setProperty("--um-grad-1", g1);
  else root.style.removeProperty("--um-grad-1");
  if (g2) root.style.setProperty("--um-grad-2", g2);
  else root.style.removeProperty("--um-grad-2");
}

export default function SkinAppearance() {
  const skin = useSkinRedesign();
  const user = useContext(UserContext);
  const { mode, systemMode, setMode } = useColorScheme();
  const resolved = mode === "system" ? systemMode : mode;
  const light = resolved === "light";
  const [colors, setColors] = useState(loadColors);

  useEffect(() => {
    if (skin) applySkinColors(resolved || "dark");
  }, [skin, resolved, colors]);

  if (!skin) return null;

  function setColor(key, value) {
    const next = { ...colors, [key]: value };
    setColors(next);
    try {
      window.localStorage.setItem(STORE, JSON.stringify(next));
    } catch (e) {}
  }

  function toggleMode() {
    const next = light ? "dark" : "light";
    setMode(next);
    if (user.loggedIn && user.updateSetting) {
      axios
        .post("/api/user/settings/update", {
          prop: "siteColorScheme",
          value: next,
        })
        .then(() => user.updateSetting("siteColorScheme", next))
        .catch(() => {});
    }
  }

  const accentKey = light ? "accentLight" : "accent";
  const g1Key = light ? "g1Light" : "g1";
  const g2Key = light ? "g2Light" : "g2";

  return (
    <span className="skin-colors">
      <input
        type="color"
        aria-label="accent"
        title="accent"
        value={colors[accentKey] || (light ? "#b54a4a" : "#e23b3b")}
        onChange={(e) => setColor(accentKey, e.target.value)}
      />
      <input
        type="color"
        aria-label="Color 1"
        title="Color 1"
        value={colors[g1Key] || (light ? "#fff4f2" : "#4a1220")}
        onChange={(e) => setColor(g1Key, e.target.value)}
      />
      <input
        type="color"
        aria-label="Color 2"
        title="Color 2"
        value={colors[g2Key] || (light ? "#f3f6fb" : "#12060c")}
        onChange={(e) => setColor(g2Key, e.target.value)}
      />
      <button
        type="button"
        className="skin-mode"
        aria-label={light ? "Dark" : "Light"}
        onClick={toggleMode}
      >
        <i className={light ? "fas fa-moon" : "fas fa-sun"} />
      </button>
    </span>
  );
}

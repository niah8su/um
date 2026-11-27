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
  const accent = saved[light ? "accentLight" : "accent"] || saved.accent;
  const g1 = saved[light ? "g1Light" : "g1"];
  const g2 = saved[light ? "g2Light" : "g2"];
  const tint = saved[light ? "tintLight" : "tint"] || saved.tint;
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
  if (tint) root.style.setProperty("--um-tint", tint);
  else root.style.removeProperty("--um-tint");
  const amt = saved.tintAmt;
  if (amt != null && amt !== "") root.style.setProperty("--um-tint-amt", `${amt}%`);
  else root.style.removeProperty("--um-tint-amt");
  root.classList.toggle("bg-anim", saved.animate === true);
}

export function useSkinScheme() {
  const user = useContext(UserContext);
  const { mode, systemMode, setMode } = useColorScheme();
  const resolved = mode === "system" ? systemMode : mode;
  const light = resolved === "light";

  function toggleMode() {
    const next = light ? "dark" : "light";
    if (user.loggedIn && user.updateSetting) {
      user.updateSetting("siteColorScheme", next);
      axios
        .post("/api/user/settings/update", {
          prop: "siteColorScheme",
          value: next,
        })
        .catch(() => {});
    }
    setMode(next);
  }

  return { light, resolved, toggleMode };
}

export function SkinAppearanceFields() {
  const { resolved, light } = useSkinScheme();
  const [colors, setColors] = useState(loadColors);
  const skin = useSkinRedesign();

  useEffect(() => {
    if (skin) applySkinColors(resolved || "dark");
  }, [skin, resolved, colors]);

  function setColor(key, value) {
    const next = { ...colors, [key]: value };
    setColors(next);
    try {
      window.localStorage.setItem(STORE, JSON.stringify(next));
    } catch (e) {}
  }

  const accentKey = light ? "accentLight" : "accent";
  const g1Key = light ? "g1Light" : "g1";
  const g2Key = light ? "g2Light" : "g2";
  const tintKey = light ? "tintLight" : "tint";

  return (
    <div className="skin-appear-fields">
      <label>
        <span>Accent</span>
        <input
          type="color"
          aria-label="Accent color"
          value={colors[accentKey] || (light ? "#c92626" : "#9a0404")}
          onChange={(e) => setColor(accentKey, e.target.value)}
        />
      </label>
      <label>
        <span>Color 1</span>
        <input
          type="color"
          aria-label="Color 1"
          value={colors[g1Key] || (light ? "#d2cccb" : "#4a1220")}
          onChange={(e) => setColor(g1Key, e.target.value)}
        />
      </label>
      <label>
        <span>Color 2</span>
        <input
          type="color"
          aria-label="Color 2"
          value={colors[g2Key] || (light ? "#d2cccb" : "#12060c")}
          onChange={(e) => setColor(g2Key, e.target.value)}
        />
      </label>
      <label>
        <span>Tint</span>
        <input
          type="color"
          aria-label="Tint"
          value={colors[tintKey] || (light ? "#e7b4b4" : "#4a1220")}
          onChange={(e) => setColor(tintKey, e.target.value)}
        />
      </label>
      <label className="skin-appear-strength">
        <span>Strength</span>
        <input
          type="range"
          min="0"
          max="80"
          aria-label="Tint strength"
          value={colors.tintAmt != null ? colors.tintAmt : light ? 0 : 18}
          onChange={(e) => setColor("tintAmt", Number(e.target.value))}
        />
      </label>
      <label className="skin-appear-anim">
        <input
          type="checkbox"
          checked={colors.animate === true}
          onChange={(e) => setColor("animate", e.target.checked)}
        />
        <span>Animated background</span>
      </label>
    </div>
  );
}

export default function SkinAppearance() {
  const skin = useSkinRedesign();
  if (!skin) return null;
  return <SkinAppearanceFields />;
}

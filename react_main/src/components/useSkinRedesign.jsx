import { useEffect, useState } from "react";

// NEW FEATURE: opt-in redesign. Off by default. Legacy UI is unchanged.
export const SKIN_STORAGE_KEY = "um-skin-redesign";
export const SKIN_EVENT = "um-skin-redesign";

export function readSkinLocal() {
  try {
    return window.localStorage.getItem(SKIN_STORAGE_KEY) === "1";
  } catch (e) {
    return false;
  }
}

export function writeSkinLocal(on) {
  try {
    window.localStorage.setItem(SKIN_STORAGE_KEY, on ? "1" : "0");
  } catch (e) {}
}

let skinApplySettled = false;

function commitSkinClass(enabled) {
  document.documentElement.classList.toggle("skin-redesign", enabled);
  if (document.body) document.body.classList.toggle("skin-redesign", enabled);
  window.dispatchEvent(new Event(SKIN_EVENT));
}

function playSkinTransition(turningOn) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!document.body) return;
  const wipe = document.createElement("div");
  wipe.className = "um-skin-wipe";
  wipe.dataset.dir = turningOn ? "in" : "out";
  wipe.setAttribute("aria-hidden", "true");
  document.body.appendChild(wipe);
  const remove = () => {
    if (wipe.parentNode) wipe.parentNode.removeChild(wipe);
  };
  wipe.addEventListener("animationend", remove);
  window.setTimeout(remove, turningOn ? 760 : 480);
}

export function applySkinClass(on) {
  const enabled = Boolean(on);
  const was = document.documentElement.classList.contains("skin-redesign");
  if (!skinApplySettled) {
    skinApplySettled = true;
    commitSkinClass(enabled);
    return;
  }
  if (was === enabled) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    commitSkinClass(enabled);
    return;
  }
  playSkinTransition(enabled);
  if (enabled) {
    window.setTimeout(() => commitSkinClass(true), 260);
    return;
  }
  commitSkinClass(false);
}

if (typeof window !== "undefined") {
  window.addEventListener("um-skin-request", (event) => {
    applySkinClass(Boolean(event.detail));
  });
}

export function useSkinRedesign() {
  const [on, setOn] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("skin-redesign")
  );
  useEffect(() => {
    const sync = () =>
      setOn(document.documentElement.classList.contains("skin-redesign"));
    window.addEventListener(SKIN_EVENT, sync);
    return () => window.removeEventListener(SKIN_EVENT, sync);
  }, []);
  return on;
}

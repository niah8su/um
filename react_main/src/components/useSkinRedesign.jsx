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

export function applySkinClass(on) {
  const enabled = Boolean(on);
  document.documentElement.classList.toggle("skin-redesign", enabled);
  if (document.body) document.body.classList.toggle("skin-redesign", enabled);
  window.dispatchEvent(new Event(SKIN_EVENT));
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

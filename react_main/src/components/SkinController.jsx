import { useContext, useEffect } from "react";
import { UserContext } from "Contexts";
import {
  applySkinClass,
  readSkinLocal,
  writeSkinLocal,
} from "./useSkinRedesign";

// Applies the redesign class from the saved user setting. Logged-out pages
// follow the same browser's last choice so login and welcome match.
export default function SkinController() {
  const user = useContext(UserContext);
  const saved =
    user.settings && user.settings.makeUltimafiaBetterAgain;

  useEffect(() => {
    if (!user.loaded) {
      applySkinClass(readSkinLocal());
      return;
    }
    if (user.loggedIn && typeof saved === "boolean") {
      writeSkinLocal(saved);
      applySkinClass(saved);
      return;
    }
    applySkinClass(readSkinLocal());
  }, [user.loaded, user.loggedIn, saved]);

  return null;
}

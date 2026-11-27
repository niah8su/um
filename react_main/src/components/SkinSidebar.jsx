import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { UserContext } from "Contexts";
import { useSkinRedesign } from "./useSkinRedesign";
import { SkinAppearanceFields, useSkinScheme } from "./SkinAppearance";

// Same destinations and labels as the header menus. Shown only with the redesign.
const GROUPS = [
  {
    label: "Play",
    icon: "M8 5.5v13l11-6.5z",
    items: [
      ["Host", "/play/host"],
      ["Create setup", "/play/create"],
      ["Tutorial", "/play/tutorial"],
    ],
  },
  {
    label: "Community",
    icon: "M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 12z",
    items: [
      ["Forums", "/community/forums"],
      ["Families", "/community/families"],
      ["Users", "/community/users"],
      ["Feedback", "/community/feedback"],
    ],
  },
  {
    label: "Fame",
    icon: "M12 3.5l2.2 4.6 5 .7-3.6 3.5.9 5.1L12 15.8 7.5 17.4l.9-5.1L4.8 8.8l5-.7z",
    items: [
      ["Hall of Fame", "/fame/hall-of-fame"],
      ["Stock Market", "/fame/stocks"],
      ["Competitive", "/fame/competitive"],
    ],
  },
  {
    label: "Learn",
    icon: "M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z",
    items: [
      ["Games", "/learn/games"],
      ["Glossary", "/learn/glossary"],
    ],
  },
  {
    label: "You",
    icon: "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8c.6-3 3-4.5 7-4.5s6.4 1.5 7 4.5",
    items: [
      ["Profile", "/user"],
      ["Settings", "/user/settings"],
      ["Inbox", "/user/notifications"],
    ],
  },
  {
    label: "Policy",
    icon: "M12 3l7 3v6c0 4.2-2.8 7.2-7 8.5C7.8 19.2 5 16.2 5 12V6z",
    items: [
      ["Rules", "/policy/rules"],
      ["Moderation", "/policy/moderation"],
    ],
  },
  {
    label: "Activity",
    icon: "M4 16l4-5 3 3 5-7 4 5",
    items: [
      ["Metrics", "/activity/metrics"],
      ["Live feed", "/activity/livefeed"],
    ],
  },
];

const LOGGED_IN = new Set(["/play/host", "/play/create", "/play/decks", "/play/wordDecks"]);

export default function SkinSidebar() {
  const skin = useSkinRedesign();
  const user = useContext(UserContext);
  const loggedIn = Boolean(user && user.loggedIn);
  const [collapsed, setCollapsed] = useState(true);
  const [online, setOnline] = useState([]);
  const [appear, setAppear] = useState(false);
  const { light, toggleMode } = useSkinScheme();
  useEffect(() => {
    if (!skin) return undefined;
    let stop = false;
    axios
      .get("/api/user/online")
      .then((res) => {
        if (stop || !Array.isArray(res.data)) return;
        setOnline(res.data.filter((row) => row && row.name && row.status !== "offline"));
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [skin]);
  if (!skin) return null;
  const initial = String((user && (user.name || user.id)) || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <nav className={collapsed ? "skin-side collapsed" : "skin-side"} aria-label="Pages">
      <button
        type="button"
        className="skin-side-toggle"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={() => setCollapsed((open) => !open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      <div className="skin-side-online" aria-label="Online users">
        <i aria-hidden="true" />
        <span className="skin-side-on">{online.length}</span>
      </div>
      <div className="skin-side-groups">
        {GROUPS.map((group) => (
          <section key={group.label}>
            <div className="skin-side-label">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={group.icon} /></svg>
              {group.label}
            </div>
            {group.items.map(([text, path]) => (
              LOGGED_IN.has(path) && !loggedIn ? null : (
                <Link key={path} to={path === "/user" && user && user.id ? `/user/${user.id}` : path}>{text}</Link>
              )
            ))}
          </section>
        ))}
      </div>
      <div className="skin-side-foot">
        <Link to="/user/settings">Settings</Link>
      </div>
      <div className="skin-side-dock">
        <Link to="/play/create" aria-label="Create setup">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </Link>
        <button type="button" className="skin-dock-mode" aria-label={light ? "Dark mode" : "Light mode"} title={light ? "Dark mode" : "Light mode"} onClick={toggleMode}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" /></svg>
        </button>
        <button type="button" className="skin-dock-wrench" aria-label="Appearance" title="Appearance" aria-expanded={appear} onClick={() => setAppear((open) => !open)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l2-2a4.5 4.5 0 0 1-6 6L8.5 18.5 5.5 15.5 10.7 10.3a4.5 4.5 0 0 1 6-6l-2 2z" /></svg>
        </button>
        {appear && (
          <div className="skin-appear-pop" role="dialog" aria-label="Appearance">
            <div className="skin-appear-title">Appearance</div>
            <SkinAppearanceFields />
          </div>
        )}
        <button type="button" aria-label="Sign out" onClick={() => {
          axios.post("/api/user/logout").finally(() => {
            if (user && user.clear) user.clear();
            window.location.assign("/");
          });
        }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 7V5H5v14h5v-2H7V7h3zm2 10 5-5-5-5v3H9v4h3v3z" /></svg>
        </button>
      </div>
    </nav>
  );
}

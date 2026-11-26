import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { UserContext } from "Contexts";
import { useSkinRedesign } from "./useSkinRedesign";

// Same destinations and labels as the header menus. Shown only with the redesign.
const GROUPS = [
  {
    label: "Play",
    items: [
      ["Play", "/play"],
      ["Tutorial", "/play/tutorial"],
      ["Host", "/play/host"],
      ["Create Setup", "/play/create"],
      ["Character Decks", "/play/decks"],
      ["Word Decks", "/play/wordDecks"],
    ],
  },
  {
    label: "Community",
    items: [
      ["Forums", "/community/forums"],
      ["Users", "/community/users"],
      ["Families", "/community/families"],
      ["Feedback", "/community/feedback"],
    ],
  },
  {
    label: "Fame",
    items: [
      ["Hall of Fame", "/fame/hall-of-fame"],
      ["Competitive", "/fame/competitive"],
      ["Stock Market", "/fame/stocks"],
      ["Contributors", "/fame/contributors"],
      ["Donors", "/fame/donors"],
    ],
  },
  {
    label: "Learn",
    items: [
      ["Games", "/learn/games"],
      ["Glossary", "/learn/glossary"],
    ],
  },
  {
    label: "Policy",
    items: [
      ["Rules", "/policy/rules"],
      ["Moderation", "/policy/moderation"],
    ],
  },
  {
    label: "Activity",
    items: [
      ["Metrics", "/activity/metrics"],
      ["Live Feed", "/activity/livefeed"],
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
      <div className="skin-side-rule" />
      <div className="skin-side-groups">
        {GROUPS.map((group) => (
          <section key={group.label}>
            <div className="skin-side-label">{group.label}</div>
            {group.items.map(([text, path]) => (
              LOGGED_IN.has(path) && !loggedIn ? null : (
                <Link key={path} to={path}>{text}</Link>
              )
            ))}
          </section>
        ))}
      </div>
      <div className="skin-online-count" aria-label="Online users">
        <i aria-hidden="true" />
        <span>{online.length}</span>
      </div>
      <div className="skin-side-foot">
        <Link to="/user/settings">Settings</Link>
      </div>
      <div className="skin-side-dock">
        <Link to="/play/create" aria-label="Create setup">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </Link>
        <Link to="/user/settings" aria-label="Settings">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM4 12l2-1 1-2 2 .5 2-1.5h2L15 9.5 17 9l1 2 2 1-2 1-1 2-2-.5-2 1.5h-2L9 14.5 7 15l-1-2z" /></svg>
        </Link>
        <Link to={user && user.id ? `/user/${user.id}` : "/user"} aria-label="Profile" className="skin-side-ava">{initial}</Link>
      </div>
    </nav>
  );
}

import React, { useContext } from "react";
import { Link } from "react-router-dom";
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
  if (!skin) return null;

  return (
    <nav className="skin-side" aria-label="Pages">
      <div className="skin-side-groups">
        {GROUPS.map((group) => (
          <section key={group.label}>
            <div className="skin-side-label">{group.label}</div>
            {group.items.map(([text, path]) => (
              LOGGED_IN.has(path) && !user.loggedIn ? null : (
                <Link key={path} to={path}>{text}</Link>
              )
            ))}
          </section>
        ))}
      </div>
      <div className="skin-side-foot">
        <Link to="/user/settings">Settings</Link>
      </div>
    </nav>
  );
}

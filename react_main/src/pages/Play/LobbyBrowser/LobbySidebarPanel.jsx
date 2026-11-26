import { Paper, Typography } from "@mui/material";
import { useSkinRedesign } from "components/useSkinRedesign";

const ICONS = {
  "Forum Activity": "M4 6h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8l-4 3V8a2 2 0 0 1 2-2z",
  "Most Popular Setups": "M5 19V9M12 19V5M19 19v-7",
  "Recently Played Setups": "M5 19V9M12 19V5M19 19v-7",
  "Poll": "M5 19V10M12 19V5M19 19v-7",
  "Daily Challenges": "M12 3a9 9 0 1 0 9 9M8.5 12.5l2.2 2.2 4.8-5",
  "Chat": "M5 6h14v9H8l-3 3V6z",
  "Stamp Exchange": "M7 7h10v10H7zM4 4h4M16 4h4M4 16h4M16 16h4",
};

export default function LobbySidebarPanel({ children, title }) {
  const skin = useSkinRedesign();
  return (
    <Paper
      className={skin ? "skin-module" : undefined}
      sx={{
        p: skin ? 0 : 2,
      }}
    >
      {title && (
        <Typography
          color="primary"
          variant="h3"
          gutterBottom
          className={skin ? "skin-mod-title" : undefined}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          {skin && ICONS[title] && (
            <svg className="skin-mod-ico" viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[title]} /></svg>
          )}
          {title}
        </Typography>
      )}
      {children}
    </Paper>
  );
}

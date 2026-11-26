import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GameStatus } from "./GameRow";
import Setup from "components/Setup";
import { RefreshButton } from "./RefreshButton";
import GameIcon from "components/GameIcon";
import HostGameDialogue from "components/HostGameDialogue";
import { getRowColor, getRowStubColor } from "./gameRowColors";
import { FeaturedSetup } from "./FeaturedSetup";
import { RecentlyPlayedSetups } from "./RecentlyPlayedSetups";
import { CompetitiveRounds } from "./CompetitiveRounds";
import { DailyChallenges } from "./DailyChallengeDisplay";
import { RecentForumReplies } from "components/RecentForumReplies";
import { Poll } from "components/Poll";
import RecentTradesFeed from "components/RecentTradesFeed";
import Chat from "../../Chat/Chat";
import Comments from "../../Community/Comments";
import { TutorialLobbyBanner } from "components/TutorialPrompt";
import { PageNav } from "components/Nav";
import "css/skin-lobby-port.css";

function tagFor(game) {
  if (game.competitive) return ["competitive", "Competitive"];
  if (game.ranked) return ["ranked", "Ranked"];
  if (game.lobby === "Sandbox") return ["sandbox", "Sandbox"];
  if (game.lobby === "Games") return ["minigames", "Minigames"];
  if (game.lobby === "Survivor") return ["survivor", "Survivor"];
  if (game.lobby === "Roleplay") return ["roleplay", "Roleplay"];
  return ["unranked", "Unranked"];
}

function tabLabel(lobby) {
  return String(lobby.displayName || lobby.name || "").replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "");
}

function TabIcon({ id }) {
  const common = { className: "tab-ico", viewBox: "0 0 24 24", "aria-hidden": true };
  if (id === "all") return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1" fill="currentColor" /><rect x="14" y="4" width="6" height="6" rx="1" fill="currentColor" /><rect x="4" y="14" width="6" height="6" rx="1" fill="currentColor" /><rect x="14" y="14" width="6" height="6" rx="1" fill="currentColor" /></svg>;
  if (id === "main" || id === "ranked") return <svg {...common}><path fill="currentColor" d="M12 20s-6.2-4-6.2-8.6A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 6.2 3.4C18.2 16 12 20 12 20z" /></svg>;
  if (id === "sandbox") return <svg {...common}><path fill="currentColor" d="M6 10h12l-1 9H7l-1-9zm2-4h8v3H8z" /></svg>;
  if (id === "comp") return <svg {...common}><path fill="currentColor" d="M12 3l2.2 4.6 5 .6-3.7 3.4.9 5L12 14.8 7.6 16.6l.9-5L4.8 8.2l5-.6z" /></svg>;
  if (id === "mini") return <svg {...common}><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /><circle cx="10" cy="10" r="1" fill="#111" /><circle cx="14" cy="14" r="1" fill="#111" /></svg>;
  if (id === "surv") return <svg {...common}><path fill="currentColor" d="M14 3l1 5 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1z" /></svg>;
  return <svg {...common}><circle cx="9" cy="9" r="3" fill="currentColor" /><circle cx="16" cy="10" r="2.4" fill="currentColor" /><path fill="currentColor" d="M4 18c.8-2.4 2.6-3.5 5-3.5s4.2 1.1 5 3.5M13 18c.5-1.6 1.6-2.4 3-2.4 1.2 0 2.2.6 2.8 1.8" /></svg>;
}

const HEART = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
const MARKS = {
  ranked: HEART,
  comp: HEART,
  competitive: HEART,
  sandbox: "M3 21.2h18v1.4H3zM5.2 20.6l1.6-8.2h2.1V9.6h1.5v2.8h3.2V9.6h1.5v2.8h2.1l1.6 8.2H5.2zM11.2 2.4h1.6V7h-1.6zM12.8 2.8 16.4 4.2 12.8 5.6zM10.6 15.4c0-1 .8-1.6 1.6-1.6s1.6.6 1.6 1.6V20.6h-3.2v-5.2z",
  games: "M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm2.1 4.2a1.25 1.25 0 1 0 .01 0zm7.8 0a1.25 1.25 0 1 0 .01 0zM12 10.7a1.25 1.25 0 1 0 .01 0zM8.1 14.3a1.25 1.25 0 1 0 .01 0zm7.8 0a1.25 1.25 0 1 0 .01 0z",
  minigames: "M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm2.1 4.2a1.25 1.25 0 1 0 .01 0zm7.8 0a1.25 1.25 0 1 0 .01 0zM12 10.7a1.25 1.25 0 1 0 .01 0zM8.1 14.3a1.25 1.25 0 1 0 .01 0zm7.8 0a1.25 1.25 0 1 0 .01 0z",
  survivor: "M12 1.2c2.6 2.4 4.4 4.1 4.4 6.6a4.4 4.4 0 0 1-8.8 0c0-2.5 1.8-4.2 4.4-6.6zM11.1 5.4c.7.8 1.2 1.3 1.2 2.1a1.3 1.3 0 0 1-2.6 0c0-.8.5-1.3 1.4-2.1zM5.6 11.4h12.8l-1.4 2.6H7zM7.6 14.8h8.8l-.5 1.3H8.1zM9.2 16.8h5.6L12 22.4z",
  roleplay: "M12 21.2s-7.6-4.7-7.6-10.2C4.4 8 6.3 6.2 8.6 6.2c1.4 0 2.6.7 3.4 1.8 0.8-1.1 2-1.8 3.4-1.8 2.3 0 4.2 1.8 4.2 4.8 0 5.5-7.6 10.2-7.6 10.2z",
  main: "M4 9.5c0-3 2.4-5 5.2-5 1.6 0 2.6.6 2.8 1.6.2-1 1.2-1.6 2.8-1.6 2.8 0 5.2 2 5.2 5 0 2.2-1 4.4-2.4 6.2-1.2 1.5-2.6 2.6-3.6 3.2-1 .6-1.6.8-2 .8s-1-.2-2-.8c-1-.6-2.4-1.7-3.6-3.2C5 13.9 4 11.7 4 9.5z",
};

function MarkIcon({ game }) {
  const kind = game.competitive ? "comp" : game.ranked ? "ranked" : String(game.lobby || "main").toLowerCase();
  const gold = kind === "comp";
  return (
    <svg className={`mark-ico ${gold ? "mark-heart gold" : kind === "ranked" ? "mark-heart" : "mark-fill"}`} viewBox="0 0 24 24" aria-hidden="true">
      <path fill={gold ? "#edb334" : kind === "ranked" ? "#e23b3b" : "currentColor"} d={MARKS[kind] || MARKS.main} />
    </svg>
  );
}

function StateMark({ game }) {
  const name = String(game.gameState || (game.status === "Finished" ? "Postgame" : "Day"));
  const night = /night/i.test(name);
  const done = game.status === "Finished" || /post/i.test(name);
  return (
    <span className="state-ico" title={name}>
      {done ? (
        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" /></svg>
      ) : night ? (
        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fillRule="evenodd" d="M15.2 2.8a9 9 0 1 0 .02 0z M17.6 5.6a6.4 6.4 0 1 1-.02 0z" /></svg>
      ) : (
        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <path fill="currentColor" d="M11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4zm12.1 12.1 1.4-1.4 2.1 2.1-1.4 1.4zM4.2 18.4l2.1-2.1 1.4 1.4-2.1 2.1zm12.1-12.1 2.1-2.1 1.4 1.4-2.1 2.1z" />
        </svg>
      )}
    </span>
  );
}

function yn(on) {
  return on ? "✓" : "×";
}

function WhoPop({ game }) {
  const lengths = game.stateLengths && typeof game.stateLengths === "object"
    ? Object.entries(game.stateLengths)
    : [];
  const players = Array.isArray(game.players) ? game.players : null;
  const playerCount = players ? players.length : (game.players || 0);
  return (
    <div className="who-pop" role="dialog" aria-label="Game details">
      <button type="button" className="who-x" aria-label="Close">×</button>
      <section>
        <h4>Players</h4>
        {players && players.length ? (
          <ul>{players.map((name) => <li key={name}>{name}</li>)}</ul>
        ) : (
          <p>Count {playerCount}</p>
        )}
      </section>
      <section>
        <h4>Spectators</h4>
        <p>Count {game.spectatorCount || 0}</p>
        <p>Spectating {yn(game.spectating)}</p>
      </section>
      <section>
        <h4>Time</h4>
        <p>Created {game.endTime ? new Date(game.endTime).toLocaleString() : "—"}</p>
        <p>Started {game.startTime ? new Date(game.startTime).toLocaleString() : "—"}</p>
      </section>
      {lengths.length > 0 && (
        <section>
          <h4>State lengths</h4>
          {lengths.map(([key, val]) => (
            <p key={key}>{key} {val} minutes</p>
          ))}
        </section>
      )}
      <section>
        <h4>Common settings</h4>
        <p>Ranked {yn(game.ranked)}</p>
        <p>Competitive {yn(game.competitive)}</p>
        <p>Spectating {yn(game.spectating)}</p>
        <p>Guests allowed {yn(game.guests)}</p>
        <p>Ready check {yn(game.readyCheck)}</p>
        <p>No vegging {yn(game.noVeg)}</p>
        <p>Anonymous {yn(game.anonymousGame)}</p>
      </section>
    </div>
  );
}

function CountPill({ game }) {
  const total = (game.setup && game.setup.total) || 0;
  const taken = game.players || 0;
  if (game.status === "Finished") {
    const ms = Math.max(0, Date.now() - (game.endTime || Date.now()));
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    const label = d >= 1 ? `${d}d ago` : h >= 1 ? `${h}h ago` : m >= 1 ? `${m}m ago` : "just now";
    return (
      <div className="player-count">
        <span>{label}</span>
      </div>
    );
  }
  const pct = total ? Math.min(100, Math.round((taken / total) * 100)) : 0;
  return (
    <div className="player-count">
      <div className="fill" style={{ width: `${pct}%` }} />
      <span>{taken}/{total}</span>
      {game.spectating ? (
        <>
          <svg className="pill-eye" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" />
            <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
          </svg>
          <span>{game.spectatorCount || 0}</span>
        </>
      ) : null}
    </div>
  );
}

// Presentational port of lobby-draft-v3. Same data and handlers, preview class names.
export default function SkinLobby({
  lobbies,
  lobbyName,
  setLobbyName,
  openGamesCounts,
  games,
  loading,
  page,
  onPage,
  refreshGames,
  refreshButtonIsSpinning,
  user,
  commentLocation,
  postLocation,
  glowingHostButton,
}) {
  const [rehost, setRehost] = useState(null);
  return (
    <div className="view-player skin-port">
      {rehost && rehost.setup && (
        <HostGameDialogue
          open
          setOpen={(open) => { if (!open) setRehost(null); }}
          setup={rehost.setup}
          defaultLobby={rehost.lobby}
        />
      )}
      <div className="lobby-tabs" role="tablist" aria-label="Lobbies">
        {lobbies.filter((lobby) => !lobby.hidden).map((lobby) => {
          const tabId = ({
            all: "all",
            main: "main",
            sandbox: "sandbox",
            competitive: "comp",
            games: "mini",
            minigames: "mini",
            survivor: "surv",
            roleplay: "roleplay",
          }[String(lobby.displayName || lobby.name || "").replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "").toLowerCase()] || "all");
          return (
          <button
            key={lobby.name}
            type="button"
            className={lobby.name === lobbyName ? "on" : undefined}
            data-lobby={tabId}
            disabled={lobby.disabled}
            onClick={() => setLobbyName(lobby.name)}
          >
            <TabIcon id={tabId} />
            {tabLabel(lobby)}
            {openGamesCounts[lobby.name] ? (
              <span className="count-pip">{openGamesCounts[lobby.name]}</span>
            ) : null}
          </button>
          );
        })}
      </div>
      <div id="skin-lobby-announce" />
      <div className="lobby-split">
        <div className="lobby-main">
          <TutorialLobbyBanner />
          <div className="games-bar">
            <div className="pager">
              <PageNav page={page} onNav={onPage} />
            </div>
            <div className="games-word">Games</div>
            <div className="games-end">
              {!user.settings?.hideTutorialButton && (
                <Link className="sq-btn help-btn" to="/play/tutorial" data-testid="tutorial-link" aria-label="Tutorial" title="Tutorial">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" /><path fill="currentColor" d="M11 17h2v-2h-2zm1-10a3.2 3.2 0 0 0-3.2 3h1.8a1.4 1.4 0 1 1 2.5 1c-.8.6-1.5 1-1.5 2.2V14h1.6v-.5c0-.6.4-.9 1.1-1.4A3.2 3.2 0 0 0 12 7z" /></svg>
                </Link>
              )}
              <button type="button" className="icon-btn refresh-btn" aria-label="Refresh the games list" onClick={refreshGames}>
                <RefreshButton isSpinning={refreshButtonIsSpinning} />
              </button>
            </div>
          </div>
          <div className="game-list">
            {loading && games.length === 0 ? null : games.map((game) => {
              const [tagClass, tagLabel] = tagFor(game);
              return (
              <article key={game.id} className={`game tone-${tagClass}${game.competitive ? " comp" : ""}`}>
                <div className="stub" style={{ background: getRowStubColor(game) }} />
                <div className="game-main" style={{ background: getRowColor(game, false) }}>
                  <WhoPop game={game} />
                  <div className="bar-stack">
                    <div className={`type-tag ${tagClass}`}>{tagLabel}</div>
                    <div className="bar-meta">
                      <MarkIcon game={game} />
                      <CountPill game={game} />
                      <span className="state-slot">
                        <StateMark game={game} />
                      </span>
                    </div>
                  </div>
                  <div className="bar-mid">
                    <div className="setup-row">
                      {game.setup && game.setup.gameType && (
                        <GameIcon className="gicon" gameType={game.setup.gameType} size={30} />
                      )}
                      <div className="setup-copy">
                        <div className="setup-name"><span>{game.setup && game.setup.name}</span></div>
                        <div className="lobby-sub">{game.lobbyName}</div>
                      </div>
                      <div className="roles">
                        {game.setup && <Setup setup={game.setup} />}
                      </div>
                    </div>
                  </div>
                  <div className="bar-actions">
                    <GameStatus
                      game={game}
                      buttonsOnly
                      showGameState={false}
                      onRehost={(row) => setRehost(row)}
                    />
                  </div>
                </div>
              </article>
              );
            })}
            {!loading && games.length === 0 && (
              <p className="empty-games">No games played recently.</p>
            )}
          </div>
          <Comments fullWidth location={commentLocation} postLocation={postLocation} />
        </div>
        <div className="lobby-side">
          <section className="panel"><FeaturedSetup lobby={lobbyName} glowingHostButton={glowingHostButton} /></section>
          <section className="panel"><RecentlyPlayedSetups lobby={lobbyName} /></section>
          <section className="panel"><CompetitiveRounds /></section>
          <section className="panel"><DailyChallenges /></section>
          <section className="panel"><RecentForumReplies /></section>
          <section className="panel"><Chat /></section>
          <section className="panel"><Poll lobby={lobbyName} /></section>
          <section className="panel"><RecentTradesFeed /></section>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GameStatus } from "./GameRow";
import Setup from "components/Setup";
import { RefreshButton } from "./RefreshButton";
import GameIcon from "components/GameIcon";
import HostGameDialogue from "components/HostGameDialogue";
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
import {
  COUNT_BADGE,
  LOBBY_TAGS,
  TagGlyph,
  lobbyTabId,
  rowSurfaceStyle,
  rowTagId,
  tabFaceStyle,
  tagPillStyle,
  useSiteLight,
} from "./lobbyTagMap";
import { lobbyGames } from "./setupRoles";
import "css/skin-lobby-port.css";

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

function Yn({ on }) {
  return on ? (
    <svg className="yn yes" viewBox="0 0 24 24" aria-label="Yes"><path d="M5 12.5l4.2 4.2L19 7.5" /></svg>
  ) : (
    <svg className="yn no" viewBox="0 0 24 24" aria-label="No"><path d="M7 7l10 10M17 7L7 17" /></svg>
  );
}

function WhoRow({ label, children }) {
  return (
    <div className="who-row">
      <span>{label}</span>
      <span>{children}</span>
    </div>
  );
}

function WhoPop({ game }) {
  const lengths = game.stateLengths && typeof game.stateLengths === "object"
    ? Object.entries(game.stateLengths)
    : [];
  const players = Array.isArray(game.players) ? game.players : null;
  const playerCount = players ? players.length : (game.players || 0);
  const shut = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const row = event.currentTarget.closest(".game");
    if (row) row.classList.add("who-shut");
  };
  return (
    <div className="who-pop" role="dialog" aria-label="Game details">
      <button type="button" className="who-x" aria-label="Close lobby details" onClick={shut}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
      </button>
      <div className="who-sec">
        <div className="who-title">Players</div>
        <div className="who-body">
          {players && players.length ? (
            <ul>
              {players.map((player) => {
                const name = typeof player === "string" ? player : player.name;
                const src = player && player.avatar;
                return (
                  <li className="who-player" key={name}>
                    {src ? <img className="who-ava" src={src} alt="" /> : null}
                    {name}
                  </li>
                );
              })}
            </ul>
          ) : (
            <WhoRow label="Count">{playerCount}</WhoRow>
          )}
        </div>
      </div>
      <div className="who-sec">
        <div className="who-title">Spectators</div>
        <div className="who-body">
          <WhoRow label="Count">{game.spectatorCount || 0}</WhoRow>
          <WhoRow label="Spectating"><Yn on={game.spectating} /></WhoRow>
        </div>
      </div>
      <div className="who-sec">
        <div className="who-title">Time</div>
        <div className="who-body">
          <WhoRow label="Created">{game.endTime ? new Date(game.endTime).toLocaleString() : "—"}</WhoRow>
          <WhoRow label="Started">{game.startTime ? new Date(game.startTime).toLocaleString() : "—"}</WhoRow>
        </div>
      </div>
      {lengths.length > 0 && (
        <div className="who-sec">
          <div className="who-title">State Lengths</div>
          <div className="who-body">
            {lengths.map(([key, val]) => (
              <WhoRow key={key} label={key}>{val} minutes</WhoRow>
            ))}
          </div>
        </div>
      )}
      <div className="who-sec">
        <div className="who-title">Common settings</div>
        <div className="who-body">
          <WhoRow label="Ranked"><Yn on={game.ranked} /></WhoRow>
          <WhoRow label="Competitive"><Yn on={game.competitive} /></WhoRow>
          <WhoRow label="Spectating"><Yn on={game.spectating} /></WhoRow>
          <WhoRow label="Guests Allowed"><Yn on={game.guests} /></WhoRow>
          <WhoRow label="Ready Check"><Yn on={game.readyCheck} /></WhoRow>
          <WhoRow label="No Vegging"><Yn on={game.noVeg} /></WhoRow>
          <WhoRow label="Anonymous"><Yn on={game.anonymousGame} /></WhoRow>
        </div>
      </div>
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
  const light = useSiteLight();
  useEffect(() => {
    const root = document.documentElement;
    if (!loading) return undefined;
    const id = String(Date.now());
    const shownAt = Date.now();
    root.dataset.umBusy = id;
    root.classList.add("um-loading");
    return () => {
      if (root.dataset.umBusy === id) delete root.dataset.umBusy;
      const wait = Math.max(0, 900 - (Date.now() - shownAt));
      window.setTimeout(() => {
        if (root.dataset.umBusy) return;
        if (!document.querySelector(".skin-port")) return;
        root.classList.remove("um-loading");
      }, wait);
    };
  }, [loading]);
  const rows = lobbyGames(games);
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
          const tabId = lobbyTabId(lobby);
          const spec = LOBBY_TAGS[tabId] || LOBBY_TAGS.all;
          return (
          <button
            key={lobby.name}
            type="button"
            className={lobby.name === lobbyName ? "on" : undefined}
            data-lobby={tabId}
            style={tabFaceStyle(tabId, light)}
            disabled={lobby.disabled}
            onClick={() => setLobbyName(lobby.name)}
          >
            <TagGlyph id={tabId} />
            {spec.label}
            {openGamesCounts[lobby.name] ? (
              <span className="count-pip" style={COUNT_BADGE}>{openGamesCounts[lobby.name]}</span>
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
                  <span className="help-mark" aria-hidden="true">?</span>
                </Link>
              )}
              <button type="button" className="icon-btn refresh-btn" aria-label="Refresh the games list" onClick={refreshGames}>
                <RefreshButton isSpinning={refreshButtonIsSpinning} />
              </button>
            </div>
          </div>
          <div className="game-list">
            {loading && rows.length === 0 ? null : rows.map((game) => {
              const tagId = rowTagId(game);
              const spec = LOBBY_TAGS[tagId];
              return (
              <article
                key={game.id}
                className={`game tone-${tagId}${game.competitive ? " comp" : ""}`}
                style={rowSurfaceStyle(tagId, light)}
                onMouseLeave={(event) => event.currentTarget.classList.remove("who-shut")}
              >
                <div className="stub" />
                <div className="game-main">
                  <WhoPop game={game} />
                  <div className="bar-stack">
                    <TagGlyph id={tagId} which="mark" />
                    <div className="tag-col">
                      <div className={`type-tag ${tagId}`} style={tagPillStyle(tagId, light)}>{spec.label}</div>
                      <div className="bar-meta">
                        <CountPill game={game} />
                        <span className="state-slot">
                          <StateMark game={game} />
                        </span>
                      </div>
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
            {!loading && rows.length === 0 && (
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

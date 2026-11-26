import React from "react";
import { Link } from "react-router-dom";
import { GameStatus } from "./GameRow";
import Setup from "components/Setup";
import { RefreshButton } from "./RefreshButton";
import { Time } from "components/Basic";
import StateIcon from "components/StateIcon";
import GameIcon from "components/GameIcon";
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
  if (game.lobby === "Main") return ["main", "Main"];
  return ["unranked", game.lobby || "Game"];
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

function MarkIcon({ game }) {
  const kind = game.competitive
    ? "comp"
    : game.ranked
      ? "ranked"
      : String(game.lobby || "").toLowerCase();
  const heart = "M12 20s-6.5-4.1-6.5-9A3.6 3.6 0 0 1 12 8a3.6 3.6 0 0 1 6.5 3c0 4.9-6.5 9-6.5 9z";
  const paths = {
    ranked: heart,
    comp: heart,
    sandbox: "M6 9h12l-1 10H7L6 9zm2-3h8v3H8z",
    games: "M7 4h10v10H7zM9 16h2v4H9zm4 0h2v4h-2z",
    minigames: "M7 4h10v10H7zM9 16h2v4H9zm4 0h2v4h-2z",
    survivor: "M12 3l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z",
    roleplay: "M5 8a7 7 0 0 1 14 0v3H5zM8 14h8v3a4 4 0 0 1-8 0z",
    main: heart,
  };
  return (
    <svg className={`mark-ico ${kind}`} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d={paths[kind] || "M12 6a6 6 0 1 0 .01 0z"} />
    </svg>
  );
}

function CountPill({ game }) {
  const total = (game.setup && game.setup.total) || 0;
  const taken = game.players || 0;
  if (game.status === "Finished") {
    return (
      <div className="player-count">
        <Time minSec millisec={Date.now() - (game.endTime || Date.now())} suffix=" ago" />
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
  return (
    <div className="view-player skin-port">
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
                <Link className="btn ghost small" to="/play/tutorial" data-testid="tutorial-link">Tutorial</Link>
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
                  <div className="bar-stack">
                    <div className={`type-tag ${tagClass}`}>{tagLabel}</div>
                    <div className="bar-meta">
                      <MarkIcon game={game} />
                      <CountPill game={game} />
                      <span className="state-slot">
                        {(game.gameState || game.status === "Finished") && (
                          <StateIcon
                            stateName={game.gameState || "Postgame"}
                            winnerGroups={(game.winnersInfo && game.winnersInfo.groups) || []}
                          />
                        )}
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
                    <GameStatus game={game} buttonsOnly showGameState={false} />
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

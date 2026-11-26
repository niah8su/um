import React from "react";
import { Link } from "react-router-dom";
import { GameStatus } from "./GameRow";
import Setup from "components/Setup";
import { RefreshButton } from "./RefreshButton";
import { Time } from "components/Basic";
import StateIcon from "components/StateIcon";
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
        {lobbies.filter((lobby) => !lobby.hidden).map((lobby) => (
          <button
            key={lobby.name}
            type="button"
            className={lobby.name === lobbyName ? "on" : undefined}
            data-lobby={({
              all: "all",
              main: "main",
              sandbox: "sandbox",
              competitive: "comp",
              games: "mini",
              minigames: "mini",
              survivor: "surv",
              roleplay: "roleplay",
            }[String(lobby.displayName || lobby.name || "").toLowerCase()] || "all")}
            disabled={lobby.disabled}
            onClick={() => setLobbyName(lobby.name)}
          >
            {lobby.displayName}
            {openGamesCounts[lobby.name] ? (
              <span className="count-pip">{openGamesCounts[lobby.name]}</span>
            ) : null}
          </button>
        ))}
      </div>
      <div id="skin-lobby-announce" />
      <div className="lobby-split">
        <div className="lobby-main">
          <TutorialLobbyBanner />
          <div className="games-bar panel">
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
              <article key={game.id} className={`game${game.competitive ? " comp" : ""}`}>
                <div className="stub" style={{ background: getRowStubColor(game) }} />
                <div className="game-main" style={{ background: getRowColor(game, false) }}>
                  <div className="bar-stack">
                    <div className={`type-tag ${tagClass}`}>{tagLabel}</div>
                    <div className="bar-meta">
                      <CountPill game={game} />
                      {(game.gameState || game.status === "Finished") && (
                        <StateIcon
                          stateName={game.gameState || "Postgame"}
                          winnerGroups={(game.winnersInfo && game.winnersInfo.groups) || []}
                        />
                      )}
                    </div>
                  </div>
                  <div className="bar-mid">
                    <div className="setup-row">
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

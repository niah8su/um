/*
 * Local only. Fills an open Sandbox game with dev test bots so it can leave
 * pregame. Uses the existing dev "?bot" join (user.dev + isBot). Does not
 * change game rules. Stays connected so the seats remain filled.
 *
 *   node scripts/local-fill-game.js
 *
 * Writes /tmp/filled-game.json with { id, port, state } and keeps the
 * sockets open until the process exits.
 */
const http = require("http");
const fs = require("fs");
const WebSocket = require("ws");

const COOKIE = fs.readFileSync("/tmp/local-cookie.txt", "utf8").trim();
const SETUP = process.env.SETUP_ID || "0sbUwQ_JJ";
const OUT = process.env.FILL_OUT || "/tmp/filled-game.json";

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 3000,
        path: "/api" + path,
        method,
        headers: {
          "content-type": "application/json",
          "x-csrf": "424242",
          cookie: "connect.sid=" + encodeURIComponent(COOKIE),
          ...(data ? { "content-length": Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            reject(new Error(`${method} ${path} ${res.statusCode} ${raw}`));
            return;
          }
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            resolve(raw);
          }
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function parseFrame(raw) {
  let message = String(raw);
  if (message[0] === "@") {
    const bar = message.indexOf("|");
    if (bar !== -1) message = message.slice(bar + 1);
  }
  if (message === "p") return { event: "p" };
  const split = message.split(/:(.*)/s);
  const event = split[0];
  if (split.length < 2) return { event };
  const rest = split[1].split(/:(.*)/s);
  if (rest.length < 2) return { event };
  let data = rest[1];
  if (rest[0] === "object") {
    try {
      data = JSON.parse(data);
    } catch (e) {}
  }
  return { event, data };
}

function send(ws, event, data) {
  if (data === undefined) ws.send(event);
  else if (typeof data === "object") ws.send(`${event}:object:${JSON.stringify(data)}`);
  else ws.send(`${event}:${typeof data}:${data}`);
}

function connectSeat(port, token, gameId, isBot) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    const seat = { ws, state: null, players: 0 };
    const timer = setTimeout(() => reject(new Error("join timed out")), 20000);
    ws.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    ws.on("message", (raw) => {
      const { event, data } = parseFrame(raw);
      if (event === "p") {
        ws.send("p");
        return;
      }
      if (event === "connected") send(ws, "auth", token);
      else if (event === "authSuccess") {
        send(ws, "join", isBot ? { gameId, isBot: true } : { gameId });
      } else if (event === "loaded") {
        clearTimeout(timer);
        resolve(seat);
      } else if (event === "error") {
        clearTimeout(timer);
        reject(new Error(String(data)));
      } else if (event === "state") {
        seat.state = data && (data.name || data);
      } else if (event === "players") {
        seat.players = data ? Object.keys(data).length : seat.players;
      } else if (event === "history" && data && data.currentState != null) {
        seat.currentState = data.currentState;
      }
    });
  });
}

async function main() {
  const gameId = String(
    await api("POST", "/game/host", {
      gameType: "Mafia",
      setup: SETUP,
      lobby: "Sandbox",
      private: false,
      spectating: true,
      guests: false,
      ranked: false,
      competitive: false,
      readyCheck: false,
      noVeg: true,
      anonymousGame: false,
      stateLengths: { Day: 3, Night: 2 },
    })
  ).replace(/"/g, "");
  const info = await api("GET", `/game/${gameId}/connect`);
  console.log("hosted", gameId, "port", info.port);
  const human = await connectSeat(info.port, info.token, gameId, false);
  console.log("human seated");
  const seats = [human];
  for (let i = 0; i < 8; i++) {
    try {
      const bot = await connectSeat(info.port, info.token, gameId, true);
      seats.push(bot);
      console.log("bot", seats.length);
    } catch (e) {
      console.log("stop filling", e.message);
      break;
    }
    if (seats.length >= 5) break;
  }
  const started = Date.now();
  let state = "Pregame";
  while (Date.now() - started < 20000) {
    const named = seats.map((s) => s.state).find((s) => s && s !== "Pregame");
    if (named) {
      state = typeof named === "string" ? named : "Day";
      break;
    }
    if (seats.some((s) => s.currentState >= 0)) {
      state = "Day";
      break;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  const record = { id: gameId, port: info.port, state, seats: seats.length };
  fs.writeFileSync(OUT, JSON.stringify(record));
  console.log("ready", JSON.stringify(record));
  await new Promise(() => {});
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

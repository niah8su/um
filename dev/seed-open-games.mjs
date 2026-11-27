/**
 * LOCAL DEV ONLY. Writes a few Open games into the games-process Redis
 * in the shape getGameInfo / the lobby list already read.
 * Mongo cannot hold open games. Never logs in and never writes to ultimafia.com.
 *
 * Run where Redis is reachable, after dev/seed-local-lobby.mjs:
 *   REDIS_URL=redis://127.0.0.1:6379 node dev/seed-open-games.mjs
 * Inside the dev stack the host is usually redis:6379.
 *
 * Windows, from the repo, with the docker stack up (containers web + redis):
 *   docker exec -w /home/um -e REDIS_URL=redis://redis:6379 -e MONGO_URL=mongodb://mongo:27017/ultimafia web node dev/seed-open-games.mjs
 */
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import net from "net";

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), "../react_main/package.json"));
const { MongoClient } = require("mongodb");

const REDIS = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const MONGO = process.env.MONGO_URL
  || "mongodb://admin:password@mongo:27017/ultimafia?authSource=admin";

function redisCommand(socket, args) {
  const chunks = [`*${args.length}\r\n`];
  for (const arg of args) {
    const text = String(arg);
    chunks.push(`$${Buffer.byteLength(text)}\r\n${text}\r\n`);
  }
  return new Promise((resolve, reject) => {
    const onData = (buf) => {
      socket.off("data", onData);
      resolve(buf.toString());
    };
    socket.once("error", reject);
    socket.on("data", onData);
    socket.write(chunks.join(""));
  });
}

async function main() {
  const url = new URL(REDIS);
  const socket = net.connect(Number(url.port || 6379), url.hostname);
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("error", reject);
  });

  let setupId = "setup-seed-type-unranked";
  let hostId = "local-seed-host";
  try {
    const client = new MongoClient(MONGO);
    await client.connect();
    const db = client.db("ultimafia");
    const setup = await db.collection("setups").findOne({ id: { $exists: true } });
    const user = await db.collection("users").findOne({ id: { $exists: true } });
    if (setup && setup.id) setupId = setup.id;
    if (user && user.id) hostId = user.id;
    await client.close();
  } catch (err) {
    console.log("mongo lookup skipped", err.message);
  }

  const games = [
    ["seed-open-main", "Main", "Main", false, "Open", "Pregame"],
    ["seed-open-ranked", "Main", "Ranked", true, "Open", "Pregame"],
    ["seed-open-sandbox", "Sandbox", "Sandbox", false, "Open", "Pregame"],
    ["seed-open-comp", "Competitive", "Competitive", false, "Open", "Pregame"],
    ["seed-live-sandbox", "Sandbox", "Sandbox", false, "In Progress", "Day"],
  ];

  for (const [id, lobby, lobbyName, ranked, status, gameState] of games) {
    const settings = {
      setup: setupId,
      lobbyName,
      ranked,
      competitive: lobby === "Competitive",
      private: false,
      spectating: true,
      guests: false,
      readyCheck: false,
      noVeg: false,
      anonymousGame: false,
      anonymousDeck: false,
      scheduled: 0,
    };
    const fields = {
      type: "Mafia",
      status,
      hostId,
      lobby,
      lobbyName,
      settings: JSON.stringify(settings),
      spectatorCount: "0",
      gameState,
      winnersInfo: "{}",
      createTime: String(Date.now()),
      startTime: "0",
      port: "3010",
    };
    for (const [key, value] of Object.entries(fields)) {
      await redisCommand(socket, ["SET", `game:${id}:${key}`, value]);
    }
    await redisCommand(socket, ["DEL", `game:${id}:players`]);
    await redisCommand(socket, ["SADD", `game:${id}:players`, hostId]);
    if (status === "In Progress") {
      await redisCommand(socket, ["SADD", `game:${id}:players`, "seed-seat-2", "seed-seat-3"]);
      await redisCommand(socket, ["SET", `game:${id}:startTime`, String(Date.now() - 15 * 60 * 1000)]);
    }
    await redisCommand(socket, ["SADD", "games", id]);
    console.log(status === "In Progress" ? "in-progress game" : "open game", id, lobby, gameState);
  }

  socket.end();
  console.log("Join stays on the local game server. These rows only fill the lobby list.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

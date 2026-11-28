/**
 * LOCAL DEV ONLY. Copies the current public lobby games and their setups
 * into the local Mongo database. Plain GET requests, no login, no cookies,
 * nothing is sent to ultimafia.com.
 *
 * Existing local demo games (localSeed local-lobby-seed) are left in place.
 * Re-running updates the public-lobby-read rows only.
 *
 *   docker exec -w /home/um backend node dev/run-public-lobby.cjs
 */
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), "../react_main/package.json"));
const { MongoClient, ObjectId } = require("mongodb");

const SOURCE = "https://ultimafia.com";
const MONGO = process.env.SEED_MONGO_URI;
const MARK = "public-lobby-read";

if (!MONGO) {
  console.error("SEED_MONGO_URI is not set. Run this through dev/run-public-lobby.cjs.");
  process.exit(1);
}

async function get(path) {
  const res = await fetch(SOURCE + path, {
    method: "GET",
    headers: { Accept: "application/json", "User-Agent": "ultimafia-local-seed" },
  });
  const text = await res.text();
  if (!res.ok) {
    console.log("skip", path, res.status);
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    console.log("skip", path, "not json");
    return null;
  }
}

function storedRoles(roles) {
  if (typeof roles === "string") return roles;
  if (Array.isArray(roles)) return JSON.stringify(roles);
  if (roles && typeof roles === "object") return JSON.stringify(roles);
  return "[]";
}

async function main() {
  const games = [];
  const seen = new Set();
  const lists = [
    "/api/game/list?list=open&lobby=All&page=1",
    "/api/game/list?list=all&lobby=All&page=1",
    "/api/game/list?list=all&lobby=All&page=2",
    "/api/game/list?list=finished&lobby=Main&page=1",
    "/api/game/list?list=finished&lobby=Sandbox&page=1",
    "/api/game/list?list=finished&lobby=Competitive&page=1",
  ];
  for (const path of lists) {
    const batch = await get(path);
    if (!Array.isArray(batch)) continue;
    for (const game of batch) {
      if (!game || !game.id || seen.has(game.id)) continue;
      seen.add(game.id);
      games.push(game);
    }
  }
  console.log("public games read", games.length);

  const client = new MongoClient(MONGO);
  await client.connect();
  const db = client.db();
  const setups = db.collection("setups");
  const gameCol = db.collection("games");

  const setupCache = new Map();
  let setupCount = 0;
  let gameCount = 0;
  const now = Date.now();

  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const brief = game.setup || {};
    const setupKey = brief.id;
    let setupOid = null;
    if (setupKey) {
      if (!setupCache.has(setupKey)) {
        const full = await get("/api/setup/" + encodeURIComponent(setupKey));
        const roles = storedRoles((full && full.roles) || brief.roles);
        const doc = {
          id: setupKey,
          name: (full && full.name) || brief.name || "Setup",
          gameType: (full && full.gameType) || brief.gameType || game.type || "Mafia",
          roles,
          closed: !!((full && full.closed) || brief.closed),
          useRoleGroups: !!((full && full.useRoleGroups) || brief.useRoleGroups),
          roleGroupSizes: (full && full.roleGroupSizes) || brief.roleGroupSizes || [],
          count: (full && full.count) || brief.count || {},
          total: (full && full.total) || brief.total || 0,
          localSeed: MARK,
        };
        const existing = await setups.findOne({ id: setupKey });
        if (existing && existing.localSeed && existing.localSeed !== MARK) {
          setupCache.set(setupKey, existing._id);
        } else if (existing) {
          await setups.updateOne({ _id: existing._id }, { $set: doc });
          setupCache.set(setupKey, existing._id);
          setupCount += 1;
        } else {
          const _id = new ObjectId();
          await setups.insertOne({ ...doc, _id });
          setupCache.set(setupKey, _id);
          setupCount += 1;
        }
      }
      setupOid = setupCache.get(setupKey);
    }

    const row = {
      id: game.id,
      type: game.type || "Mafia",
      lobby: game.lobby || "Main",
      lobbyName: game.lobbyName || game.lobby || "",
      setup: setupOid,
      ranked: !!game.ranked,
      competitive: !!game.competitive,
      private: false,
      spectating: game.spectating !== false,
      endTime: game.endTime || now - i * 1000,
      winnersInfo: game.winnersInfo || { players: [], groups: [] },
      players: [],
      localSeed: MARK,
    };
    const existingGame = await gameCol.findOne({ id: game.id });
    if (existingGame && existingGame.localSeed && existingGame.localSeed !== MARK) continue;
    if (existingGame) {
      await gameCol.updateOne({ _id: existingGame._id }, { $set: row });
    } else {
      await gameCol.insertOne(row);
    }
    gameCount += 1;
  }

  const kept = await gameCol.countDocuments({ localSeed: "local-lobby-seed" });
  console.log("setups stored", setupCount);
  console.log("games stored", gameCount);
  console.log("local demo games kept", kept);
  await client.close();
}

main().catch((err) => {
  console.error("seed failed");
  process.exit(1);
});

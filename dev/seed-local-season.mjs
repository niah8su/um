/**
 * LOCAL DEV ONLY. Inserts one competitive season so the Fame standings
 * tables have rows. Never logs in and never writes to ultimafia.com.
 *
 * Run after dev/seed-local-lobby.mjs, against the local database:
 *   MONGO_URL=mongodb://127.0.0.1:27017/ultimafia node dev/seed-local-season.mjs
 */
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import net from "net";

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), "../react_main/package.json"));
const { MongoClient, ObjectId } = require("mongodb");

const MONGO = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/ultimafia";
const REDIS = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const MARK = "local-lobby-seed";

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
  const client = new MongoClient(MONGO);
  await client.connect();
  const db = client.db("ultimafia");
  const setup = await db.collection("setups").findOne({ id: { $exists: true } });
  if (!setup) {
    console.log("no setups yet; run dev/seed-local-lobby.mjs first");
    await client.close();
    return;
  }
  await db.collection("setups").updateOne({ _id: setup._id }, { $set: { competitive: true } });

  const preferred = ["localtest1", "1mD9zfeMm", "30042g6fX", "8vbQeXHX3", "CCI9SpAps"];
  let users = await db.collection("users").find({ id: { $in: preferred } }).project({ id: 1 }).toArray();
  if (!users.length) {
    users = await db.collection("users").find({ id: { $exists: true } }).project({ id: 1 }).limit(5).toArray();
  }
  const scores = [42, 36, 28, 21, 14];
  const tiebreaks = [18, 22, 15, 11, 9];

  for (const name of ["competitiveseasons", "competitiverounds", "competitiveseasonstandings", "competitivegamecompletions"]) {
    await db.collection(name).deleteMany({ localSeed: MARK });
  }
  await db.collection("games").deleteMany({ id: "seed-comp-game" });

  const gameId = new ObjectId();
  await db.collection("games").insertOne({
    _id: gameId,
    id: "seed-comp-game",
    type: "Mafia",
    setup: setup._id,
    endTime: Date.now(),
    localSeed: MARK,
  });
  await db.collection("competitiveseasons").insertOne({
    number: 1,
    setups: [setup._id],
    setupOrder: [[0]],
    rounds: [],
    currentRound: 1,
    startDate: "2026-11-01",
    paused: false,
    completed: false,
    numRounds: 1,
    localSeed: MARK,
  });
  await db.collection("competitiverounds").insertOne({
    season: 1,
    number: 1,
    currentDay: 2,
    completed: false,
    accounted: false,
    startDate: "2026-11-20",
    remainingOpenDays: 2,
    remainingReviewDays: 1,
    localSeed: MARK,
  });
  if (users.length) {
    await db.collection("competitiveseasonstandings").insertMany(users.map((user, i) => ({
      userId: user.id,
      season: 1,
      points: scores[i] || 10,
      tiebreakerPoints: tiebreaks[i] || 5,
      localSeed: MARK,
    })));
    await db.collection("competitivegamecompletions").insertMany(users.map((user, i) => ({
      userId: user.id,
      game: gameId,
      season: 1,
      round: 1,
      day: 1,
      points: scores[i] || 10,
      valid: true,
      localSeed: MARK,
    })));
  }
  await client.close();

  const url = new URL(REDIS);
  const socket = net.connect(Number(url.port || 6379), url.hostname);
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("error", reject);
  });
  await redisCommand(socket, ["DEL", "competitive:season:latest:round:latest"]);
  socket.end();
  console.log("local season 1 with", users.length, "standings");
  console.log("Fame reads this from the local database only.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

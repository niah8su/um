/**
 * LOCAL DEV ONLY. Inserts one demo notification for every local user, plus one
 * demo site announcement. Does not contact ultimafia.com.
 *
 * Idempotent: each notification id is seed-demo-notif-<user id>, so running
 * this again updates those rows instead of adding duplicates.
 *
 * Run from the backend container (it has MONGO_USER / MONGO_PW / MONGO_URL / MONGO_DB):
 *   docker exec -w /home/um backend node dev/run-seed.cjs
 */
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), "../react_main/package.json"));
const { MongoClient } = require("mongodb");

const NOTIF_TEXT = "DEMO: This is a sample notification for your local test account.";
const ANNOUNCE_ID = "seed-demo-announcement";
const ANNOUNCE_TEXT = "DEMO: This is a sample site announcement. It is placeholder text for local testing only.";

function mongoUri() {
  if (process.env.SEED_MONGO_URI) return process.env.SEED_MONGO_URI;
  const raw = String(process.env.MONGO_URL || "").trim();
  if (/^mongodb(\+srv)?:\/\//i.test(raw)) return raw;
  const host = raw || "127.0.0.1:27017";
  const dbName = process.env.MONGO_DB || "ultimafia";
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PW || "";
  if (user) {
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${dbName}?authSource=admin`;
  }
  return `mongodb://${host}/${dbName}`;
}

function notifId(userId) {
  return `seed-demo-notif-${userId}`;
}

async function main() {
  const client = new MongoClient(mongoUri());
  await client.connect();
  const db = client.db(process.env.MONGO_DB || "ultimafia");
  const users = db.collection("users");
  const notifications = db.collection("notifications");
  const announcements = db.collection("announcements");

  const people = await users
    .find(
      { id: { $type: "string", $ne: "" }, deleted: { $ne: true } },
      { projection: { id: 1, name: 1, lastActive: 1 } }
    )
    .sort({ lastActive: -1 })
    .toArray();

  if (people.length === 0) {
    console.error("No users in the local users collection. Log in once, then run this again.");
    await client.close();
    process.exit(1);
  }

  // Drop the old single row that targeted a hard-coded id.
  const retired = await notifications.deleteMany({ id: "seed-demo-notif" });
  if (retired.deletedCount) console.log("removed old single demo notification", retired.deletedCount);

  let inserted = 0;
  let updated = 0;
  for (const person of people) {
    const result = await notifications.updateOne(
      { id: notifId(person.id) },
      {
        $set: {
          id: notifId(person.id),
          user: person.id,
          isChat: false,
          global: false,
          content: NOTIF_TEXT,
          icon: "bell",
          link: "/play",
          read: false,
          localSeed: "local-lobby-seed",
        },
        $setOnInsert: { date: Date.now() },
      },
      { upsert: true }
    );
    if (result.upsertedCount) inserted += 1;
    else updated += 1;
  }

  const modId = people[0].id;
  const announce = await announcements.updateOne(
    { id: ANNOUNCE_ID },
    {
      $set: {
        id: ANNOUNCE_ID,
        modId,
        content: ANNOUNCE_TEXT,
        localSeed: "local-lobby-seed",
      },
      $setOnInsert: { date: Date.now() },
    },
    { upsert: true }
  );

  console.log(
    "notifications",
    inserted ? `inserted ${inserted}` : "",
    updated ? `updated ${updated}` : "",
    "for",
    people.map((person) => person.name || person.id).join(", ")
  );
  console.log("announcement", announce.upsertedCount ? "inserted" : "updated", ANNOUNCE_ID);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

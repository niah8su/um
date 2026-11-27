/**
 * LOCAL DEV ONLY. Inserts one demo notification and one demo site announcement
 * into the local Mongo database. Does not contact ultimafia.com.
 *
 * Idempotent: both rows use fixed ids, so running this again updates them
 * instead of adding duplicates.
 *
 *   docker exec -w /home/um -e MONGO_URL=mongodb://mongo:27017/ultimafia web node dev/seed-local-notices.mjs
 *
 * If Mongo requires auth:
 *   docker exec -w /home/um -e MONGO_URL='mongodb://admin:password@mongo:27017/ultimafia?authSource=admin' web node dev/seed-local-notices.mjs
 */
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), "../react_main/package.json"));
const { MongoClient } = require("mongodb");

const MONGO = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/ultimafia";
const USER_ID = process.env.LOCAL_USER_ID || "localtest1";
const NOTIF_ID = "seed-demo-notif";
const ANNOUNCE_ID = "seed-demo-announcement";
const NOTIF_TEXT = "DEMO: This is a sample notification for your local test account.";
const ANNOUNCE_TEXT = "DEMO: This is a sample site announcement. It is placeholder text for local testing only.";

async function main() {
  const client = new MongoClient(MONGO);
  await client.connect();
  const db = client.db("ultimafia");
  const users = db.collection("users");
  const notifications = db.collection("notifications");
  const announcements = db.collection("announcements");

  const user = await users.findOne({ id: USER_ID }, { projection: { id: 1, name: 1 } });
  if (!user) {
    console.log("warning: no user with id", USER_ID, "(notification is still stored for that id)");
  }

  const notif = await notifications.updateOne(
    { id: NOTIF_ID },
    {
      $set: {
        id: NOTIF_ID,
        user: USER_ID,
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

  const announce = await announcements.updateOne(
    { id: ANNOUNCE_ID },
    {
      $set: {
        id: ANNOUNCE_ID,
        modId: USER_ID,
        content: ANNOUNCE_TEXT,
        localSeed: "local-lobby-seed",
      },
      $setOnInsert: { date: Date.now() },
    },
    { upsert: true }
  );

  console.log(
    "notification",
    notif.upsertedCount ? "inserted" : "updated",
    NOTIF_ID,
    "for",
    user ? user.name : USER_ID
  );
  console.log("announcement", announce.upsertedCount ? "inserted" : "updated", ANNOUNCE_ID);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

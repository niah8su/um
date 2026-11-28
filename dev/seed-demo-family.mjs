/**
 * LOCAL DEV ONLY. Attaches the public family FaPiCVNKh to local demo users
 * so the profile card can show it. The name and avatar flag come from one
 * logged-out GET of /api/family/FaPiCVNKh/profile. Nothing is sent to the
 * live site. The avatar file is not copied; the card uses the default
 * family image when the local upload is missing.
 *
 *   docker exec -w /home/um backend node dev/run-demo-family.cjs
 */
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), "../react_main/package.json"));
const { MongoClient, ObjectId } = require("mongodb");

const SOURCE = "https://ultimafia.com";
const FAMILY_ID = "FaPiCVNKh";
const MONGO = process.env.SEED_MONGO_URI;

if (!MONGO) {
  console.error("SEED_MONGO_URI is not set. Run this through dev/run-demo-family.cjs.");
  process.exit(1);
}

async function main() {
  const res = await fetch(SOURCE + "/api/family/" + FAMILY_ID + "/profile", {
    method: "GET",
    headers: { Accept: "application/json", "User-Agent": "ultimafia-local-seed" },
  });
  if (!res.ok) {
    console.error("family profile GET failed", res.status);
    process.exit(1);
  }
  const profile = await res.json();
  const name = profile && profile.name;
  if (!name) {
    console.error("family profile had no name");
    process.exit(1);
  }
  console.log("family", profile.id, name, "avatar", !!profile.avatar);

  const client = new MongoClient(MONGO);
  await client.connect();
  const db = client.db();
  const users = db.collection("users");
  const families = db.collection("families");
  const memberships = db.collection("infamilies");

  const anchor = await users.findOne({ id: "localtest1" }) || await users.findOne({ deleted: { $ne: true } });
  if (!anchor) {
    console.error("no local user to own the demo family");
    process.exit(1);
  }

  let family = await families.findOne({ id: FAMILY_ID });
  if (!family) {
    family = {
      _id: new ObjectId(),
      id: FAMILY_ID,
      name,
      avatar: false,
      founder: anchor._id,
      leader: anchor._id,
      members: [],
      localSeed: "demo-family",
    };
    await families.insertOne(family);
  } else {
    await families.updateOne({ _id: family._id }, { $set: { name, avatar: false, localSeed: "demo-family" } });
  }

  const targets = await users.find({
    $or: [{ id: "localtest1" }, { localSeed: "local-lobby-seed" }],
  }).project({ _id: 1, id: 1, name: 1 }).toArray();
  if (!targets.find((row) => String(row._id) === String(anchor._id))) targets.push(anchor);

  let linked = 0;
  for (const user of targets) {
    const existing = await memberships.findOne({ user: user._id });
    if (existing) {
      await memberships.updateOne({ _id: existing._id }, { $set: { family: family._id, role: "member" } });
    } else {
      await memberships.insertOne({ user: user._id, family: family._id, role: "member" });
    }
    linked += 1;
  }
  await families.updateOne({ _id: family._id }, { $set: { members: targets.map((row) => row._id) } });
  console.log("linked", linked, "local users to", name);
  await client.close();
}

main().catch(() => {
  console.error("seed failed");
  process.exit(1);
});

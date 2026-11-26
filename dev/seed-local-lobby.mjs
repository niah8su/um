/**
 * LOCAL DEV ONLY. Copies public lobby reads from ultimafia.com into the local
 * Mongo database. Never logs in and never writes to ultimafia.com.
 *
 * Open games are not in Mongo. They live in the games process Redis, so this
 * script fills finished games, lobby comments, and forum threads only.
 * Polls and stamp trades are not public without a login (poll list 500, trades 401).
 *
 * Run inside the dev web container. Do not commit this file onto a pull request.
 */
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), "../react_main/package.json"));
const { MongoClient, ObjectId } = require("mongodb");

const SOURCE = "https://ultimafia.com";
const MONGO = process.env.MONGO_URL
  || "mongodb://admin:password@mongo:27017/ultimafia?authSource=admin";
const MARK = "local-lobby-seed";

async function get(path) {
  const res = await fetch(SOURCE + path);
  const text = await res.text();
  if (!res.ok) {
    console.log("skip", path, res.status, text.slice(0, 120));
    return null;
  }
  return JSON.parse(text);
}

function userDoc(author) {
  if (!author || !author.id) return null;
  return {
    id: author.id,
    name: author.name || "Player",
    avatar: !!author.avatar,
    localSeed: MARK,
  };
}

async function main() {
  const games = [];
  for (let page = 1; page <= 3; page++) {
    const batch = await get("/api/game/list?list=finished&lobby=All&page=" + page);
    if (!Array.isArray(batch) || batch.length === 0) break;
    games.push(...batch);
  }
  const comments = await get("/api/comment/?location=lobby");
  const forums = await get("/api/forums/categories");
  await get("/api/poll/list/All?page=1");
  await get("/api/stampTrades/recent");

  const client = new MongoClient(MONGO);
  await client.connect();
  const db = client.db("ultimafia");
  const users = db.collection("users");
  const setups = db.collection("setups");
  const gameCol = db.collection("games");
  const commentsCol = db.collection("comments");
  const boards = db.collection("forumboards");
  const threads = db.collection("forumthreads");
  const replies = db.collection("forumreplies");

  for (const name of ["users", "setups", "games", "comments", "forumboards", "forumthreads", "forumreplies"]) {
    const result = await db.collection(name).deleteMany({ localSeed: MARK });
    console.log("cleared", name, result.deletedCount);
  }

  const userIds = new Map();
  async function ensureUser(author) {
    const doc = userDoc(author);
    if (!doc) return null;
    if (userIds.has(doc.id)) return userIds.get(doc.id);
    const existing = await users.findOne({ id: doc.id });
    if (existing) {
      userIds.set(doc.id, existing._id);
      return existing._id;
    }
    const _id = new ObjectId();
    await users.insertOne({ ...doc, _id });
    userIds.set(doc.id, _id);
    return _id;
  }

  if (Array.isArray(games)) {
    for (const game of games) {
      let setupId = null;
      if (game.setup && game.setup.id) {
        const existing = await setups.findOne({ id: game.setup.id });
        if (existing) setupId = existing._id;
        else {
          setupId = new ObjectId();
          await setups.insertOne({
            _id: setupId,
            id: game.setup.id,
            name: game.setup.name,
            gameType: game.setup.gameType,
            roles: game.setup.roles || [],
            closed: !!game.setup.closed,
            useRoleGroups: !!game.setup.useRoleGroups,
            roleGroupSizes: game.setup.roleGroupSizes || [],
            count: game.setup.count || {},
            total: game.setup.total || 0,
            localSeed: MARK,
          });
        }
      }
      const existingGame = await gameCol.findOne({ id: game.id });
      if (existingGame) continue;
      await gameCol.insertOne({
        id: game.id,
        type: game.type || "Mafia",
        lobby: game.lobby || "Main",
        lobbyName: game.lobbyName || "",
        setup: setupId,
        ranked: !!game.ranked,
        competitive: !!game.competitive,
        private: !!game.private,
        spectating: game.spectating !== false,
        endTime: game.endTime || Date.now(),
        winnersInfo: game.winnersInfo || { players: [], groups: [] },
        players: [],
        localSeed: MARK,
      });
    }
    console.log("finished games copied", games.length);
  }

  const showcase = [
    ["seed-type-unranked", "Main", "Main", false, false, "Unranked Sample"],
    ["seed-type-ranked", "Main", "Main", true, false, "Ranked Sample"],
    ["seed-type-sandbox", "Sandbox", "Sandbox", false, false, "Sandbox Sample"],
    ["seed-type-competitive", "Competitive", "Competitive", false, true, "Competitive Sample"],
    ["seed-type-minigames", "Games", "Minigames", false, false, "Minigames Sample"],
    ["seed-type-survivor", "Survivor", "Survivor", false, false, "Survivor Sample"],
    ["seed-type-roleplay", "Roleplay", "Roleplay", false, false, "Roleplay Sample"],
  ];
  for (let i = 0; i < showcase.length; i++) {
    const [id, lobby, lobbyName, ranked, competitive, name] = showcase[i];
    let setupId = null;
    const setupKey = "setup-" + id;
    const existingSetup = await setups.findOne({ id: setupKey });
    if (existingSetup) setupId = existingSetup._id;
    else {
      setupId = new ObjectId();
      await setups.insertOne({
        _id: setupId,
        id: setupKey,
        name,
        gameType: "Mafia",
        roles: [{ Villager: 3, Mafioso: 1, Cop: 1, Doctor: 1 }],
        closed: false,
        count: {},
        total: 6,
        localSeed: MARK,
      });
    }
    if (!(await gameCol.findOne({ id }))) {
      await gameCol.insertOne({
        id,
        type: "Mafia",
        lobby,
        lobbyName,
        setup: setupId,
        ranked,
        competitive,
        private: false,
        spectating: true,
        endTime: Date.now() - i * 60000,
        winnersInfo: { players: [], groups: [] },
        players: [],
        localSeed: MARK,
      });
    }
  }
  console.log("showcase rows", showcase.map((row) => row[2] + (row[3] ? " ranked" : row[4] ? " competitive" : "")).join(", "));
  console.log("Open and in-progress games live in Redis inside the games process, so this seed only writes finished rows for each tag.");

  const commentRows = comments && comments.comments ? comments.comments : [];
  for (const comment of commentRows) {
    const author = await ensureUser(comment.author);
    if (!author) continue;
    if (await commentsCol.findOne({ id: comment.id })) continue;
    await commentsCol.insertOne({
      id: comment.id,
      author,
      location: comment.location || "lobby",
      content: comment.content || "",
      date: comment.date || Date.now(),
      voteCount: comment.voteCount || 0,
      deleted: false,
      localSeed: MARK,
    });
  }
  console.log("lobby comments copied", commentRows.length);

  const threadIds = [];
  for (const cat of forums || []) {
    for (const board of cat.boards || []) {
      for (const thread of board.newestThreads || []) threadIds.push(thread.id);
      for (const reply of board.recentReplies || []) {
        if (reply.thread && reply.thread.id) threadIds.push(reply.thread.id);
      }
    }
  }
  const uniqueThreads = [...new Set(threadIds)].slice(0, 6);
  for (const id of uniqueThreads) {
    const thread = await get("/api/forums/thread/" + id);
    if (!thread || !thread.id) continue;
    const author = await ensureUser(thread.author);
    let boardId = null;
    if (thread.board && thread.board.id) {
      const existing = await boards.findOne({ id: thread.board.id });
      if (existing) boardId = existing._id;
      else {
        boardId = new ObjectId();
        await boards.insertOne({
          _id: boardId,
          id: thread.board.id,
          name: thread.board.name || "Board",
          localSeed: MARK,
        });
      }
    }
    if (await threads.findOne({ id: thread.id })) continue;
    const threadOid = new ObjectId();
    await threads.insertOne({
      _id: threadOid,
      id: thread.id,
      board: boardId,
      author,
      title: thread.title || "",
      content: thread.content || "",
      postDate: thread.postDate || Date.now(),
      replyCount: thread.replyCount || 0,
      deleted: false,
      localSeed: MARK,
    });
    for (const reply of (thread.replies || []).slice(0, 3)) {
      const replyAuthor = await ensureUser(reply.author);
      if (await replies.findOne({ id: reply.id })) continue;
      await replies.insertOne({
        id: reply.id,
        author: replyAuthor,
        thread: threadOid,
        content: reply.content || "",
        postDate: reply.postDate || Date.now(),
        deleted: false,
        localSeed: MARK,
      });
    }
  }
  console.log("forum threads copied", uniqueThreads.length);
  console.log("Polls and stamp trades were not copied. The public poll list returned an error and stamp trades require a login. This script does not log in.");

  await db.collection("polls").deleteMany({ localSeed: MARK });
  await db.collection("pollvotes").deleteMany({ localSeed: MARK });
  const pollId = "local-seed-poll";
  await db.collection("polls").insertOne({
    id: pollId,
    lobby: "Main",
    question: "Would you be interested in a Wacky Words / Wacky People tournament for December where the prompts are Christmas-themed?",
    options: ["YES", "NO"],
    creator: "local-seed",
    created: Date.now(),
    completed: false,
    expiresAt: Date.UTC(2026, 10, 12),
    localSeed: MARK,
  });
  const votes = [];
  for (let i = 0; i < 11; i++) votes.push({ pollId, userId: "seed-yes-" + i, optionIndex: 0, votedAt: Date.now(), localSeed: MARK });
  for (let i = 0; i < 8; i++) votes.push({ pollId, userId: "seed-no-" + i, optionIndex: 1, votedAt: Date.now(), localSeed: MARK });
  await db.collection("pollvotes").insertMany(votes);
  console.log("poll seeded", pollId);

  const people = await users.find({ id: { $exists: true, $ne: null } }).limit(8).toArray();
  await db.collection("stamptrades").deleteMany({ localSeed: MARK });
  const roles = ["Villager", "Mafioso", "Cop", "Doctor", "Jester"];
  if (people.length) {
    const trades = roles.map((role, i) => ({
      id: "seed-gift-" + i,
      initiator: people[0]._id,
      initiatorId: people[0].id,
      initiatorGameType: "Mafia",
      initiatorRole: role,
      recipient: people[Math.min(1, people.length - 1)]._id,
      recipientId: people[Math.min(1, people.length - 1)].id,
      status: "COMPLETED",
      createdAt: Date.now() - i * 3600000,
      completedAt: Date.now() - i * 3600000,
      localSeed: MARK,
    }));
    await db.collection("stamptrades").insertMany(trades);
    console.log("stamp gifts", trades.length);
  } else {
    console.log("no local users yet; stamp gifts skipped until an account exists");
  }

  if (people.length) {
    await users.updateMany(
      { id: { $in: people.map((u) => u.id) } },
      { $set: { dailyChallenges: ["Basic2", "Hard1"] } }
    );
    console.log("daily challenges set on", people.map((u) => u.id).join(", "));
  }

  await db.collection("notifications").deleteMany({ localSeed: MARK });
  const notifs = [];
  for (const u of people) {
    notifs.push(
      { id: "seed-n1-" + u.id, user: u.id, isChat: false, read: false, content: "You have a friend request.", date: Date.now(), link: "/user/notifications", localSeed: MARK },
      { id: "seed-n2-" + u.id, user: u.id, isChat: false, read: false, content: "Someone replied to your forum thread.", date: Date.now() - 60000, link: "/community/forums", localSeed: MARK },
      { id: "seed-n3-" + u.id, user: u.id, isChat: false, read: false, content: "You were invited to a game.", date: Date.now() - 120000, link: "/play", localSeed: MARK }
    );
  }
  if (notifs.length) {
    await db.collection("notifications").insertMany(notifs);
    console.log("notifications for", people.map((u) => u.name + " (" + u.id + ")").join(", "));
  } else {
    console.log("No local users yet. Log in once on localhost, then run this script again so the bell is filled for that account.");
  }

  await db.collection("chatmessages").deleteMany({ localSeed: MARK });
  let channel = await db.collection("chatchannels").findOne({ public: true });
  if (!channel) {
    channel = {
      id: "local-seed-lobby",
      name: "Lobby",
      public: true,
      memberIds: [],
      rank: 0,
      position: 0,
      lastMessageDate: Date.now(),
      localSeed: MARK,
    };
    await db.collection("chatchannels").insertOne(channel);
    console.log("created public lobby channel", channel.id);
  }
  const lines = [
    "7/15 on Classic Town if anyone wants in.",
    "Joining in a minute.",
    "Competitive round is on day 2.",
  ];
  if (people.length) {
    await db.collection("chatmessages").insertMany(lines.map((content, i) => ({
      id: "seed-chat-" + i,
      senderId: people[i % people.length].id,
      date: Date.now() - (lines.length - i) * 60000,
      channel: channel.id,
      content,
      localSeed: MARK,
    })));
    console.log("lobby chat lines", lines.length, "on channel", channel.id);
  } else {
    console.log("no local users; lobby chat lines skipped until an account exists");
  }
  console.log("Golbolco welcome chat was not seeded. That floating window is not a feature in this repo.");

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

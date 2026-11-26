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
  const games = await get("/api/game/list?list=finished&lobby=All&page=1");
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
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

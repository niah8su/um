/**
 * LOCAL DEV ONLY. Runs dev/seed-public-lobby.mjs inside the backend container.
 * Builds the Mongo address from MONGO_URL, MONGO_DB, MONGO_USER, and MONGO_PW
 * the same way the server does, and does not print that address.
 *
 *   docker exec -w /home/um backend node dev/run-public-lobby.cjs
 */
const { spawn } = require("child_process");
const path = require("path");

try {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
} catch (err) {
  // The container may already have the variables, with no dotenv install.
}

function mongoUri() {
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

const uri = mongoUri();
const child = spawn(process.execPath, [path.join(__dirname, "seed-public-lobby.mjs")], {
  stdio: "inherit",
  env: { ...process.env, SEED_MONGO_URI: uri },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code == null ? 1 : code);
});

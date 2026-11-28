/**
 * LOCAL DEV ONLY. Runs dev/seed-demo-family.mjs inside the backend container.
 * Does not print the Mongo address.
 *
 *   docker exec -w /home/um backend node dev/run-demo-family.cjs
 */
const { spawn } = require("child_process");
const path = require("path");

try {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
} catch (err) {
  // The container may already have the variables.
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

const child = spawn(process.execPath, [path.join(__dirname, "seed-demo-family.mjs")], {
  stdio: "inherit",
  env: { ...process.env, SEED_MONGO_URI: mongoUri() },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code == null ? 1 : code);
});

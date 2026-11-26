import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { lobbyGames, normalizeSetupRoles } = require("../src/pages/Play/LobbyBrowser/setupRoles.js");

// The same reads SkinLobby makes for each row: the game list, then each
// setup's roles. Missing fields must render, not throw.
function SkinLobbyProbe({ games }) {
  const rows = lobbyGames(games);
  return React.createElement(
    "div",
    { "data-error": "no", "data-rows": String(rows.length) },
    rows.map((game, index) =>
      React.createElement(
        "article",
        { key: game.id || index },
        String(normalizeSetupRoles(game.setup && game.setup.roles).length)
      )
    )
  );
}

function render(games) {
  return renderToStaticMarkup(React.createElement(SkinLobbyProbe, { games }));
}

test("a setup with no roles renders an empty role list", () => {
  assert.deepEqual(normalizeSetupRoles(undefined), []);
  assert.deepEqual(normalizeSetupRoles(null), []);
  assert.deepEqual(normalizeSetupRoles("not json"), []);
  assert.deepEqual(normalizeSetupRoles("[]"), []);
  assert.equal(normalizeSetupRoles('[{"Villager:":3}]').length, 1);
  assert.equal(render([{ id: "seed", setup: { name: "Sandbox Sample" } }]).includes("0"), true);
});

test("SkinLobby renders when the game list or setup fields are missing", () => {
  assert.equal(render(undefined).includes('data-rows="0"'), true);
  assert.equal(render(null).includes('data-rows="0"'), true);
  const html = render([
    { id: "no-setup" },
    { id: "no-roles", setup: {} },
    { id: "bad-roles", setup: { roles: "{not json" } },
    { id: "string-roles", setup: { roles: '[{"Cop:":1,"Mafioso:":1}]' } },
    { id: "array-roles", setup: { roles: [{ "Doctor:": 1 }] } },
  ]);
  assert.equal(html.includes('data-error="no"'), true);
  assert.equal(html.includes('data-rows="5"'), true);
  assert.equal(html.includes(">1<"), true);
  assert.equal(html.includes(">0<"), true);
});

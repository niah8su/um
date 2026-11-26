// Roles are stored as a JSON string. A setup can omit them, or a seed can
// write a value the string field cannot cast, and the list then sends
// undefined. Reading .length on that blanks the lobby.

function normalizeSetupRoles(roles) {
  if (typeof roles === "string") {
    try {
      roles = JSON.parse(roles);
    } catch (e) {
      return [];
    }
  }
  return Array.isArray(roles) ? roles : [];
}

function lobbyGames(games) {
  return Array.isArray(games) ? games : [];
}

module.exports = { normalizeSetupRoles, lobbyGames };

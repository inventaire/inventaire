const userDoc = (username, idLastCharacters) => ({
  _id: `00000000000000000000000000000${idLastCharacters}`,
  username,
  special: true,
  // Data required to avoid crashing users logic
  snapshot: {},
  settings: {
    contributions: {
      anonymize: false
    }
  },
})

module.exports = {
  users: {
    // A fake user used to sign entities edit generated from dataseed
    // see server/data/dataseed/dataseed.js
    seed: userDoc('seed', '000'),
    // see server/controllers/entities/lib/update_claims_hooks
    hook: userDoc('hook', '001'),
    reconciler: userDoc('reconciler', '002'),
    // used by scripts/update_entities.js
    updater: userDoc('updater', '003'),
    anonymized: userDoc('anonymized', '004')
  }
}

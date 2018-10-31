userDoc = (username, idLastCharacters)->
  _id: "00000000000000000000000000000#{idLastCharacters}"
  username: username
  special: true
  # Data required to avoid crashing users logic
  snapshot:  {}

module.exports =
  users:
    # A fake user used to sign entities edit generated from dataseed
    # see server/data/dataseed/dataseed.coffee
    seed: userDoc 'seed', '000'
    # see server/controllers/entities/lib/update_claims_hooks
    hook: userDoc 'hook', '001'
    # used by scripts/update_entities_schema
    schemaUpdater: userDoc 'schema_updater', '003'

module.exports =
  users:
    # A fake user used to sign entities edit generated from dataseed
    # see server/data/dataseed/dataseed.coffee
    seed:
      _id: '00000000000000000000000000000000'
      username: 'seed'
      special: true
      # Data required to avoid crashing users logic
      snapshot:  {}

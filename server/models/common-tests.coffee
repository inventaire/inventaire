CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

module.exports = tests = {}

tests.CouchUuid = /^[0-9a-f]{32}$/
tests.UserId = tests.CouchUuid

tests.EntityUri = /^(wd:Q[0-9]+|(isbn|inv):[0-9\-]+)$/


June2014 = 1402351200000
tests.EpochMs =
  test: (time)-> June2014 < time < _.now()
CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
regex_ = __.require 'sharedLibs', 'regex'

module.exports = tests = {}

tests.CouchUuid = regex_.CouchUuid
tests.UserId = tests.CouchUuid
tests.ItemId = tests.CouchUuid

tests.EntityUri = /^(wd:Q[0-9]+|(isbn|inv):[0-9a-f\-]+)$/

tests.Email = regex_.Email
tests.Username = /^\w{1,20}$/

# no item of this app could have a timestamp before june 2014
June2014 = 1402351200000
tests.EpochMs =
  test: (time)-> June2014 < time <= _.now()
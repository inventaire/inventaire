module.exports = tests = {}

tests.CouchUuid = /^[0-9a-f]{32}$/
tests.UserId = tests.CouchUuid

tests.EntityUri = /^(wd:Q[0-9]+|(isbn|inv):[0-9\-]+)$/
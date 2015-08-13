CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'

# wdk crashes from time to time:
# we don't want the app to display nothing
# so we query a wikidata dump when nothing else is available
# see https://github.com/inventaire/inv-wdq

# the endpoint where an instance of
# https://github.com/inventaire/inv-wdq is listening
fallbackWdq = CONFIG.fallback.wdq

module.exports =
  claim: (P, Q)->
    promises_.get _.log(buildQuery(P, Q), 'url')
    .then _.Log('localFallback res')


buildQuery = (P, Q)->
  _.buildPath "#{fallbackWdq}/claim",
    p: P
    q: Q

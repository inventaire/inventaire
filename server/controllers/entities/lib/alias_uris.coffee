__ = require('config').universalPath
_ = __.require 'builders', 'utils'
reverseClaims = require './reverse_claims'

aliases =
  # TODO: add viaf, bnf, etc.
  twitter:
    property: 'wdt:P2002'
    validator: _.isNonEmptyString
  wmsite:
    validator: _.isNonEmptyString

prefixes = []
validators = {}

for prefix, data of aliases
  prefixes.push prefix
  validators[prefix] = data.validator

sitelinkPattern = /^[\w_]+wiki\w*$/
looksLikeSitelink = (str)-> str.match(sitelinkPattern)?

module.exports = { aliases, prefixes, validators, looksLikeSitelink }

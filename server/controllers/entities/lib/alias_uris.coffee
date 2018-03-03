__ = require('config').universalPath
_ = __.require 'builders', 'utils'
reverseClaims = require './reverse_claims'
{ BoundedString } = __.require 'models', 'validations/common'

# Find properties regex on properties P1793 claims
regexValidator = (regex)-> (str)-> regex.test str

twitter =
  property: 'wdt:P2002'
  validator: regexValidator /^\w{1,15}$/

facebook =
  property: 'wdt:P2013'
  validator: BoundedString 1, 100

openlibrary =
  property: 'wdt:P648'
  validator: regexValidator /^OL[1-9]\d{0,7}[AMW]$/

aliases =
  viaf:
    property: 'wdt:P214'
    validator: regexValidator /^[1-9]\d+$/

  bnf:
    property: 'wdt:P268'
    validator: regexValidator /^\d{8}[0-9bcdfghjkmnpqrstvwxz]$/

  openlibrary: openlibrary
  ol: openlibrary

  twitter: twitter
  tw: twitter

  facebook: facebook
  fb: facebook

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

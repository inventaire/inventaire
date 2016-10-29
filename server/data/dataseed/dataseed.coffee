# Dataseed is a blackboxed service getting some basic facts on books from the web
# it is closed source as possibly in a legal grey zone
# It's a placeholder to make search results within inventaire acceptable
# while entities created internally ramp up toward getting us autonomous
# Its place should be progressively decreased until complete removal

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'

{ enabled, host } = CONFIG.dataseed

module.exports =
  # Search query parameters:
  # search: the text to search
  # lang: the language code to prioritize
  # refresh: request fresh data
  # includeDocs: include the seeds docs
  search: (query, refresh)->
    unless enabled then return promises_.resolve { isbn: [] }
    promises_.get _.buildPath("#{host}/books", { search: query.search, refresh })

  getByIsbns: (isbns, refresh)->
    unless enabled then return promises_.resolve {}
    isbns = _.forceArray(isbns).join '|'
    promises_.get _.buildPath("#{host}/books", { isbns, refresh })

# Dataseed is a blackboxed service getting some basic facts on books from the web
# it is closed source as possibly in a legal grey zone
# It's a placeholder to make search results within inventaire acceptable
# while entities created internally ramp up toward getting us autonomous
# Its place should be progressively decreased until complete removal

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
isbn_ = __.require 'lib', 'isbn/isbn'

{ readOnly } = CONFIG
{ enabled, host } = CONFIG.dataseed
enabled = enabled and not readOnly

module.exports =
  # Search query parameters:
  # search: the text to search
  # lang: the language code to prioritize
  # refresh: request fresh data
  # includeDocs: include the seeds docs
  search: (search, lang, refresh)->
    unless enabled then return promises_.resolve { isbns: [] }
    promises_.get _.buildPath("#{host}/books", { search, lang, refresh })

  getByIsbns: (isbns, refresh)->
    isbns = _.forceArray isbns
    unless enabled then return promises_.resolve isbns.map(emptySeed)
    isbns = isbns.join '|'
    promises_.get _.buildPath("#{host}/books", { isbns, refresh })

  # Provides simply an image in a prompt maner
  getImageByIsbn: (isbn)->
    isbn = isbn_.toIsbn13 isbn
    unless isbn then return promises_.reject new Error('invalid isbn')
    promises_.get _.buildPath("#{host}/images", { isbn })

  # Converts the url to an IPFS path
  getImageByUrl: (url)->
    url = encodeURIComponent url
    promises_.get _.buildPath("#{host}/images", { url })

emptySeed = (isbn)-> { isbn }

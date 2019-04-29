__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ types } =  __.require 'lib', 'wikidata/aliases'

# Takes an entity claims
# Returns a entity type string: work, edition, article, human, genre
# If no type is found from wdt:P31 (instance of), try with wdt:P279 (subclass of)
# (useful for Wikidata entities only, as all inv entities have a known P31)
module.exports = (claims)->
  type = guessType claims, 'wdt:P31'
  if type? then return type

  type = guessType claims, 'wdt:P279'
  if type? then return type

  return

guessType = (claims, property)->
  propertyClaims = claims[property]
  unless propertyClaims? then return

  propertyTypes = getTypes propertyClaims

  switch propertyTypes.length
    when 0 then return
    when 1
      # Best case: deduce type from a unique P31 value
      type = propertyTypes[0]
      if type is 'edition'
        # Wikidata contributors may have set an item to be an edition, while it's actually a mix
        # of work and edition attributes. In absence of a clear edition shape, we consider it to be
        # a work
        unless claims['wdt:P629']? then return 'work'
      return type
    else
      # Case with multiple P31 values: try to guess the most credible type
      isWork = 'work' in propertyTypes
      isEdition = 'edition' in propertyTypes
      isSerie = 'serie' in propertyTypes

      # If it has 'edition of' claims, consider that it's an edition
      if isEdition and claims['wdt:P629']? then return 'edition'
      # If it can be considered a serie, prefer that type over others
      if isSerie then return 'serie'
      if isWork then return 'work'
      return propertyTypes[0]

getTypes = (values)-> _.uniq values.map(getType)

getType = (value)-> types[value]

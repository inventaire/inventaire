__ = require('config').universalPath
{ aliases } = require './aliases'

# Regroup claims from properties that are close and would be ignored otherwise
# ex: move screen writers ('wdt:P58') to the list of authors ('wdt:P50')
module.exports = (claims)->
  for property, redirectProp of aliases
    propClaims = claims[property]
    if propClaims?.length > 0
      redirectPropClaims = claims[redirectProp] or []
      claims[redirectProp] = redirectPropClaims.concat propClaims
      delete claims[property]

  return

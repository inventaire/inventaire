_ = require 'lodash'
alphabet = 'abcdefghijklmnopqrstuvwxyz'
possibleChars = alphabet + alphabet.toUpperCase() + '0123456789'

# Generated strings should:
# - be fast to generate
# - be in a URL without requiring to be escaped
# - have the highest possible entropy with those constraints
module.exports = (length)->
  text = ''
  i = 0
  while i < length
    text += possibleChars.charAt _.random(possibleChars.length - 1)
    i++

  return text

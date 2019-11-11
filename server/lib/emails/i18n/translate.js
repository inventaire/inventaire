module.exports = (lang, polyglot)->
  modifier = if modifiers[lang]? then modifiers[lang]

  return (key, ctx)->
    val = polyglot.t key, ctx
    if modifier? then return modifier polyglot, key, val, ctx
    else return val

isShortkey = (key)-> /_/.test key
vowels = 'aeiouy'

modifiers =
  # make _.i18n('user_comment', { username: 'adamsberg' })
  # return "Commentaire d'adamsberg" instead of "Commentaire de adamsberg"
  fr: (polyglot, key, val, data)->
    if data? and isShortkey key
      k = polyglot.phrases[key]
      { username } = data
      if username?
        firstLetter = username[0].toLowerCase()
        if firstLetter in vowels
          if /(d|qu)e\s(<strong>)?%{username}/.test k
            re = new RegExp "(d|qu)e (<strong>)?#{username}"
            return val.replace re, "$1'$2#{username}"

    return val

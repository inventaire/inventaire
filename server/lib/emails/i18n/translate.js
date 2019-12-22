module.exports = (lang, polyglot) => {
  const modifier = (modifiers[lang] != null) ? modifiers[lang] : undefined

  return (key, ctx) => {
    const val = polyglot.t(key, ctx)
    if (modifier) return modifier(polyglot, key, val, ctx)
    else return val
  }
}

const isShortkey = key => /_/.test(key)
const vowels = 'aeiouy'

const modifiers = {
  // make _.i18n('user_comment', { username: 'adamsberg' })
  // return "Commentaire d'adamsberg" instead of "Commentaire de adamsberg"
  fr: (polyglot, key, val, data) => {
    if (data && isShortkey(key)) {
      const k = polyglot.phrases[key]
      const { username } = data
      if (username) {
        const firstLetter = username[0].toLowerCase()
        if (vowels.includes(firstLetter)) {
          if (/(d|qu)e\s(<strong>)?%{username}/.test(k)) {
            const re = new RegExp(`(d|qu)e (<strong>)?${username}`)
            return val.replace(re, `$1'$2${username}`)
          }
        }
      }
    }

    return val
  }
}

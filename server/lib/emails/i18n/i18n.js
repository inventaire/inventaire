
let helpers
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const Polyglot = require('node-polyglot')
const { active: activeLangs } = __.require('i18nAssets', 'langs')
const moment = require('moment')
const { appendToEmailsKeys } = __.require('lib', 'i18n_autofix')
const translate = require('./translate')

const polyglots = {}
const translators = {}

const warnAndFix = warning => {
  if (!/Missing\stranslation/.test(warning)) {
    return _.warn(warning)
  }

  // hacky solution to extract the key from polyglot warning
  const key = warning.split('"')[1]
  return appendToEmailsKeys(key)
}

activeLangs.forEach(lang => {
  const polyglot = (polyglots[lang] = new Polyglot({ locale: lang, warn: warnAndFix }))
  const phrases = __.require('i18nDist', `${lang}.json`)
  polyglots[lang].extend(phrases)
  translators[lang] = translate(lang, polyglot)
})

const solveLang = lang => {
  // There is only support for 2 letters languages for now
  lang = _.shortLang(lang)
  if (activeLangs.includes(lang)) return lang
  else return 'en'
}

module.exports = (helpers = {
  i18n: (lang, key, args) => {
    lang = solveLang(lang)
    return translators[lang](key, args)
  },

  I18n: (...args) => {
    const text = helpers.i18n.apply(null, args)
    const firstLetter = text[0].toUpperCase()
    return firstLetter + text.slice(1)
  },

  dateI18n: (lang, epochTime, format) => {
    // set default while neutralizeing handlebars object
    if (!_.isString(format)) { format = 'LLL' }
    lang = solveLang(lang)
    moment.locale(lang)
    return moment(epochTime).format(format)
  }
})

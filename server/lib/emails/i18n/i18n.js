import Polyglot from 'node-polyglot'
import moment from 'moment'
import CONFIG from 'config'
import _ from '#builders/utils'
import { active as activeLangs } from '#i18nAssets/langs'
import { appendToServerKeys } from '#lib/i18n_autofix'
import translate from './translate.js'

const { autofixI18n } = CONFIG

const polyglots = {}
const translators = {}

const warnAndFix = warning => {
  if (!/Missing\stranslation/.test(warning)) {
    return _.warn(warning)
  }

  if (!autofixI18n) return

  // hacky solution to extract the key from polyglot warning
  const key = warning.split('"')[1]
  return appendToServerKeys(key)
}

activeLangs.forEach(lang => {
  const polyglot = (polyglots[lang] = new Polyglot({ locale: lang, warn: warnAndFix }))
  const phrases = require(`i18nDist/${lang}.json`)
  polyglots[lang].extend(phrases)
  translators[lang] = translate(lang, polyglot)
})

const solveLang = lang => {
  // There is only support for 2 letters languages for now
  lang = _.shortLang(lang)
  if (activeLangs.includes(lang)) return lang
  else return 'en'
}

const helpers = {
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
    if (!_.isString(format)) format = 'LLL'
    lang = solveLang(lang)
    moment.locale(lang)
    return moment(epochTime).format(format)
  }
}
export default helpers

import CONFIG from 'config'
import { activeLanguages } from 'inventaire-i18n'
import { isString } from 'lodash-es'
import moment from 'moment'
import Polyglot from 'node-polyglot'
import { appendToServerKeys } from '#lib/i18n_autofix'
import { shortLang } from '#lib/utils/base'
import { requireJson } from '#lib/utils/json'
import { warn } from '#lib/utils/logs'
import translate from './translate.js'

const { autofix } = CONFIG.i18n

const polyglots = {}
const translators = {}

const warnAndFix = warning => {
  if (!/Missing\stranslation/.test(warning)) {
    return warn(warning)
  }

  if (!autofix) return

  // hacky solution to extract the key from polyglot warning
  const key = warning.split('"')[1]
  return appendToServerKeys(key)
}

activeLanguages.forEach(lang => {
  const polyglot = (polyglots[lang] = new Polyglot({ locale: lang, warn: warnAndFix }))
  const phrases = requireJson(`inventaire-i18n/dist/server/${lang}.json`)
  polyglots[lang].extend(phrases)
  translators[lang] = translate(lang, polyglot)
})

const solveLang = lang => {
  // There is only support for 2 letters languages for now
  lang = shortLang(lang)
  if (activeLanguages.includes(lang)) return lang
  else return 'en'
}

export const i18n = (lang, key, args) => {
  lang = solveLang(lang)
  return translators[lang](key, args)
}

export const I18n = (...args) => {
  const text = i18n.apply(null, args)
  const firstLetter = text[0].toUpperCase()
  return firstLetter + text.slice(1)
}

export const dateI18n = (lang, epochTime, format) => {
  // set default while neutralizeing handlebars object
  if (!isString(format)) format = 'LLL'
  lang = solveLang(lang)
  moment.locale(lang)
  return moment(epochTime).format(format)
}

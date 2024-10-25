import { activeLanguages } from 'inventaire-i18n'
import { isString } from 'lodash-es'
import moment, { type LongDateFormatKey } from 'moment'
import Polyglot from 'node-polyglot'
import { appendToServerKeys } from '#lib/i18n_autofix'
import { assert_ } from '#lib/utils/assert_types'
import { shortLang } from '#lib/utils/base'
import { requireJson } from '#lib/utils/json'
import { warn } from '#lib/utils/logs'
import config from '#server/config'
import translate from './translate.js'

const { autofix } = config.i18n

const polyglots = {}
const translators = {}

function warnAndFix (warning) {
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

function solveLang (lang: string) {
  // There is only support for 2 letters languages for now
  lang = shortLang(lang)
  if (activeLanguages.includes(lang)) return lang
  else return 'en'
}

export function i18n (lang: string, key: string, args?: Record<string, string | number>) {
  lang = solveLang(lang)
  assert_.string(lang)
  assert_.string(key)
  return translators[lang](key, args)
}

export function I18n (lang: string, key: string, args?: Record<string, string | number>) {
  const text = i18n(lang, key, args)
  const firstLetter = text[0].toUpperCase()
  return firstLetter + text.slice(1)
}

export function dateI18n (lang: string, epochTime: EpochTimeStamp, format?: LongDateFormatKey) {
  // set default while neutralizeing handlebars object
  if (!isString(format)) format = 'LLL'
  lang = solveLang(lang)
  moment.locale(lang)
  return moment(epochTime).format(format)
}

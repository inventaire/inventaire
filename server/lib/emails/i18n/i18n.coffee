CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Polyglot = require 'node-polyglot'
activeLangs = require './active_langs'
moment = require 'moment'
{ appendToEmailsKeys } = __.require 'lib', 'i18n_autofix'

polyglot = {}

warnAndFix = (warning)->
  unless /Missing\stranslation/.test warning
    return _.warn warning

  # hacky solution to extract the key from polyglot warning
  key = warning.split('"')[1]
  appendToEmailsKeys key

langJSON = (lang)-> _.jsonReadAsync __.path('i18nDist', "#{lang}.json")
extendPolyglot = (lang, phrases)-> polyglot[lang].extend phrases

activeLangs.forEach (lang)->
  polyglot[lang] = new Polyglot {locale: lang, warn: warnAndFix}
  langJSON(lang).then extendPolyglot.bind(null, lang)

solveLang = (lang)->
  # there is only support for 2 letters languages for now
  lang = lang?[0..1]
  if lang in activeLangs then lang else 'en'

module.exports = helpers =
  i18n: (lang, key, args)->
    lang = solveLang(lang)
    return polyglot[lang].t(key, args)

  I18n: (args...)->
    text = helpers.i18n.apply null, args
    firstLetter = text[0].toUpperCase()
    return firstLetter + text[1..-1]

  dateI18n: (lang, epochTime, format)->
    # set default while neutralizeing handlebars object
    unless _.isString format then format = 'LLL'
    lang = solveLang lang
    moment.locale lang
    return moment(epochTime).format(format)

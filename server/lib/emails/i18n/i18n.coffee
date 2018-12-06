CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Polyglot = require 'node-polyglot'
{ active: activeLangs } = __.require 'i18nAssets', 'langs'
moment = require 'moment'
{ appendToEmailsKeys } = __.require 'lib', 'i18n_autofix'
translate = __.require 'sharedLibs', 'translate'

polyglots = {}
translators = {}

warnAndFix = (warning)->
  unless /Missing\stranslation/.test warning
    return _.warn warning

  # hacky solution to extract the key from polyglot warning
  key = warning.split('"')[1]
  appendToEmailsKeys key

activeLangs.forEach (lang)->
  polyglot = polyglots[lang] = new Polyglot { locale: lang, warn: warnAndFix }
  phrases = __.require 'i18nDist', "#{lang}.json"
  polyglots[lang].extend phrases
  translators[lang] = translate lang, polyglot

solveLang = (lang)->
  # there is only support for 2 letters languages for now
  lang = lang?[0..1]
  if lang in activeLangs then lang else 'en'

module.exports = helpers =
  i18n: (lang, key, args)->
    lang = solveLang lang
    return translators[lang](key, args)

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

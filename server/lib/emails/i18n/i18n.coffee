CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Polyglot = require 'node-polyglot'
activeLangs = require './active_langs'
moment = require 'moment'

polyglot = {}

langJSON = (lang)-> _.jsonReadAsync __.path('i18nDist', "#{lang}.json")
extendPolyglot = (lang, phrases)-> polyglot[lang].extend phrases

activeLangs.forEach (lang)->
  polyglot[lang] = new Polyglot {locale: lang}
  langJSON(lang).then extendPolyglot.bind(null, lang)


solveLang = (lang)->
  # there is only support for 2 letters languages for now
  lang = lang?[0..1]
  if lang in activeLangs then lang else 'en'

module.exports =
  i18n: (lang, key, args)->
    lang = solveLang(lang)
    return polyglot[lang].t(key, args)

  dateI18n: (lang, epochTime, format)->
    # set default while neutralizeing handlebars object
    unless _.isString format then format = 'LLL'
    lang = solveLang lang
    moment.locale lang
    return moment(epochTime).format(format)

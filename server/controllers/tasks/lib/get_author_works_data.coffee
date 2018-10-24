CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'

entities_ = __.require 'controllers', 'entities/lib/entities'

module.exports = (authorId)->
  entities_.byClaim 'wdt:P50', "inv:#{authorId}", true, true
  .then (works)->
    # works = [
    #   { labels: { fr: 'Matiere et Memoire'} },
    #   { labels: { en: 'foo' } }
    # ]
    base = { authorId, labels: [], langs: [] }
    worksData = works.reduce aggregateWorksData, base
    worksData.langs = _.uniq worksData.langs
    return worksData

aggregateWorksData = (worksData, work)->
  for lang, label of work.labels
    worksData.labels.push label
    worksData.langs.push lang
  return worksData

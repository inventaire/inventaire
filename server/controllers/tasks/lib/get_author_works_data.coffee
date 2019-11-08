CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = __.require 'controllers', 'entities/lib/entities'
{ getEntityNormalizedTerms } = __.require 'controllers', 'entities/lib/terms_normalization'

module.exports = (authorId)->
  entities_.byClaim 'wdt:P50', "inv:#{authorId}", true, true
  .then (works)->
    # works = [
    #   { labels: { fr: 'Matiere et Memoire'} },
    #   { labels: { en: 'foo' } }
    # ]

    labels = _.uniq _.flatten(works.map(getEntityNormalizedTerms))
      # Filter-out labels that are too short, as it could generate false positives
      .filter (label)-> label.length > 5

    langs = _.uniq _.flatten(works.map(getLangs))

    return { authorId, labels, langs }

getLangs = (work)-> Object.keys work.labels

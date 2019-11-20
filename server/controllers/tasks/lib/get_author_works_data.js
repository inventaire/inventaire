const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const entities_ = __.require('controllers', 'entities/lib/entities')
const { getEntityNormalizedTerms } = __.require('controllers', 'entities/lib/terms_normalization')

module.exports = authorId => entities_.byClaim('wdt:P50', `inv:${authorId}`, true, true)
.then(works => {
  // works = [
  //   { labels: { fr: 'Matiere et Memoire'} },
  //   { labels: { en: 'foo' } }
  // ]
  const labels = _.uniq(_.flatten(works.map(getEntityNormalizedTerms)))
  const langs = _.uniq(_.flatten(works.map(getLangs)))
  return { authorId, labels, langs }
})

const getLangs = work => Object.keys(work.labels)

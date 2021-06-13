const _ = require('builders/utils')
const { resolveEntrySeedsByExternalIds } = require('controllers/entities/lib/resolver/resolve_by_external_ids')
const { isNotEmpty, objLength } = require('lib/utils/base')

const authorities = {
  bnb: require('data/bnb/get_bnb_entry_from_isbn'),
  bne: require('data/bne/get_bne_entry_from_isbn'),
  bnf: require('data/bnf/get_bnf_entry_from_isbn'),
  wikidata: require('data/wikidata/get_wikidata_entry_from_isbn'),
}

const authoritiesNames = Object.keys(authorities)

module.exports = async isbn => {
  const entries = await Promise.all(authoritiesNames.map(wrap(isbn)))
  // TODO: aggregate resolved data, rather than just returning the best one
  return getBestEntry(entries)
}

const wrap = isbn => async name => {
  try {
    return await authorities[name](isbn)
  } catch (err) {
    _.error(err, `${name} entry error`)
  }
}

const getBestEntry = async entries => {
  entries = entries.filter(isNotEmpty)
  if (entries.length === 0) return
  if (entries.length === 1) return entries[0]

  await Promise.all(entries.map(resolveEntrySeedsByExternalIds))

  const scoredEntriesByResolvedEntities = entries
    .map(getEntryResolutionScore)
    .sort(byScore)

  return scoredEntriesByResolvedEntities[0].entry
}

const getEntryResolutionScore = entry => {
  let score = 0
  if (entry.edition?.claims) score += objLength(entry.edition.claims)
  entry.works?.forEach(work => {
    if (work.uri) score += 100
    if (work.claims) score += objLength(work.claims)
  })
  entry.authors?.forEach(author => {
    if (author.uri) score += 20
    if (author.claims) score += objLength(author.claims)
  })
  return { entry, score }
}

const byScore = (a, b) => b.score - a.score

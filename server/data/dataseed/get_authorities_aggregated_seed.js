const _ = require('builders/utils')
const { isNotEmpty, objLength } = require('lib/utils/base')

const authorities = {
  bnb: require('data/bnb/get_bnb_seed_from_isbn'),
  bne: require('data/bne/get_bne_seed_from_isbn'),
  bnf: require('data/bnf/get_bnf_seed_from_isbn'),
}

const authoritiesNames = Object.keys(authorities)

module.exports = async isbn => {
  const seeds = await Promise.all(authoritiesNames.map(wrap(isbn)))
  // TODO: aggregate resolved data, rather than just returning the best one
  return getBestSeed(seeds)
}

const wrap = isbn => async name => {
  try {
    return await authorities[name](isbn)
  } catch (err) {
    _.error(err, `${name} seed error`)
  }
}

const getBestSeed = seeds => {
  seeds = seeds.filter(isNotEmpty)
  if (seeds.length === 0) return
  if (seeds.length === 1) return seeds[0]

  const scoredSeedsByResolvedEntities = seeds
    .map(getSeedResolutionScore)
    .sort(byScore)

  return scoredSeedsByResolvedEntities[0].seed
}

const getSeedResolutionScore = seed => {
  let score = 0
  if (seed.edition?.claims) score += objLength(seed.edition.claims)
  seed.works?.forEach(work => {
    if (work.uri) score += 50
    if (work.claims) score += objLength(work.claims)
  })
  seed.authors?.forEach(author => {
    if (author.uri) score += 50
    if (author.claims) score += objLength(author.claims)
  })
  return { seed, score }
}

const byScore = (a, b) => b.score - a.score

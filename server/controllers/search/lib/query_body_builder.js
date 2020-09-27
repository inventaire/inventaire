module.exports = params => {
  const { lang: userLang, search, limit: size } = params
  let { types } = params
  types = singularType(types)
  // must match at least one of the types
  const must = [
    { bool: { should: matchType(types) } },
    { bool: { should: matchSearch(search, userLang) } }
  ]
  return {
    query: {
      bool: { must }
    },
    size,
    min_score: 1
  }
}

const singularType = types => types.map(type => type.replace(/s$/, ''))

const matchType = types => types.map(type => ({ match: { type } }))

const matchSearch = (search, userLang) => {
  return [
    {
      multi_match: {
        query: search,
        operator: 'and',
        fields: [
          `labels.${userLang}^4`,
          'labels.*^4',
          'aliases.*^2',
          'descriptions.*^2'
        ],
      }
    },
    {
      multi_match: {
        query: search,
        fields: [
          `labels.${userLang}^2`,
          'labels.*^2',
          'aliases.*',
        ]
      }
    },
    {
      multi_match: {
        query: search,
        fields: [
          'flattenedLabels',
          'flattenedAliases',
          'flattenedDescriptions'
        ]
      }
    }
  ]
}

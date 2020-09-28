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

const matchType = types => {
  return types.map(type => (
    { match: { type } }
  ))
}

const defaultFields = userLang => {
  const fields = [
    'labels.*^4',
    'aliases.*^2',
    'descriptions.*'
  ]
  if (userLang) fields.push(`labels.${userLang}^4`)
  return fields
}

const matchSearch = (search, userLang) => {
  return [
    // strict (operator 'and'):
    // match on all words in search, so descriptions are allowed
    {
      multi_match: {
        query: search,
        operator: 'and',
        fields: defaultFields(userLang),
      }
    },
    // loose match some words in search
    {
      multi_match: {
        query: search,
        fields: [
          'flattenedLabels', // text type
          'flattenedAliases', // text type
          'flattenedDescriptions', // text type
          ...defaultFields(userLang)
        ]
      }
    },
  ]
}

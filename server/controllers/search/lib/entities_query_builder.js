module.exports = params => {
  const { lang: userLang, search, limit: size } = params
  let { types } = params
  types = singularTypes(types)

  return {
    query: {
      bool: {
        must: [
          // at least one type should match
          // this is basically an 'or' operator
          { bool: { should: matchType(types) } },
          // it must also have at least one match on the search query
          { bool: { should: matchEntities(search, userLang) } }
        ]
      }
    },
    size,
    min_score: 1
  }
}

const singularTypes = types => types.map(type => type.replace(/s$/, ''))

const matchType = types => {
  return types.map(type => (
    { match: { type } }
  ))
}

const matchEntities = (search, userLang) => {
  return [
    // strict (operator 'and') match on all words
    {
      multi_match: {
        query: search,
        operator: 'and',
        fields: defaultEntitiesFields(userLang),
      }
    },
    // match on some words
    {
      multi_match: {
        query: search,
        fields: flattenedTermsFields(userLang)
      }
    }
  ]
}

const defaultEntitiesFields = userLang => {
  const fields = [
    'labels.*^4',
    'aliases.*^2',
    'descriptions.*'
  ]
  if (userLang) fields.push(`labels.${userLang}^4`)
  return fields
}

const flattenedTermsFields = userLang => {
  return [
    'flattenedLabels', // text type
    'flattenedAliases', // text type
    'flattenedDescriptions', // text type
    ...defaultEntitiesFields(userLang)
  ]
}

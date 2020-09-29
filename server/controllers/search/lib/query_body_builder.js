const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

module.exports = params => {
  const { lang: userLang, search, limit: size } = params
  let { types } = params
  types = singularTypes(types)

  return {
    query: {
      bool: {
        must: [
        // must match at least one of the types
          { bool: { should: matchType(types) } },
          { bool: { should: matchSearchPerTypes(types, search, userLang) } }
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

const matchSearchPerTypes = (types, search, userLang) => {
  const isSocialQuery = _.includes(types, 'user') || _.includes(types, 'group')

  if (isSocialQuery) return matchSocial(search)
  return matchEntities(search, userLang)
}

const matchSocial = search => {
  return [
    {
      multi_match: {
        query: search,
        fields: [
          'name^2',
          'bio',
          'description'
        ],
      }
    },
  ]
}

const matchEntities = (search, userLang) => {
  return [
    // strict (operator 'and'):
    // match on all words in search, so descriptions are allowed
    {
      multi_match: {
        query: search,
        operator: 'and',
        fields: defaultEntitiesFields(userLang),
      }
    },
    // loose match some words in search
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

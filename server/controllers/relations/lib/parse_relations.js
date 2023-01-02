import _ from '#builders/utils'

export default res => {
  const relations = _.initCollectionsIndex(relationsTypes)
  for (const row of res.rows) {
    spreadRelation(relations, row)
  }
  return relations
}

const spreadRelation = (relations, row) => {
  // view key looks like userId:relationType
  const type = row.key[1]
  const id = row.value
  if (relationsTypes.includes(type) && (id != null)) {
    return relations[type].push(id)
  } else {
    throw new Error(`spreadRelation err: type=${type}, id=${id}`)
  }
}

const relationsTypes = [
  'friends',
  'userRequested',
  'otherRequested',
  'none',
]

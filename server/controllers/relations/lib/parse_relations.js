/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');

module.exports = function(res){
  const relations = _.initCollectionsIndex(relationsTypes);
  for (let row of res.rows) {
    spreadRelation(relations, row);
  }
  return relations;
};

var spreadRelation = function(relations, row){
  // view key looks like userId:relationType
  const type = row.key[1];
  const id = row.value;
  if (relationsTypes.includes(type) && (id != null)) {
    return relations[type].push(id);
  } else { throw new Error(`spreadRelation err: type=${type}, id=${id}`); }
};

var relationsTypes = [
  'friends',
  'userRequested',
  'otherRequested',
  'none'
];

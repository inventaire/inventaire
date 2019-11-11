/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const couch_ = __.require('lib', 'couch');
const promises_ = __.require('lib', 'promises');
const assert_ = __.require('utils', 'assert_types');

module.exports = function(db, _){
  let bundles;
  const actionAndReturn = function(verb, doc){
    assert_.object(doc);
    return db[verb](doc)
    .then(updateIdAndRev.bind(null, doc));
  };

  const bulkDelete = function(docs){
    assert_.objects(docs);
    if (docs.length === 0) { return promises_.resolve([]); }
    _.warn(docs, 'bulkDelete');
    return db.bulk(couch_.setDocsDeletedTrue(docs));
  };

  return bundles = {
    postAndReturn: actionAndReturn.bind(null, 'post'),
    putAndReturn: actionAndReturn.bind(null, 'put'),
    bulkDelete
  };
};

var updateIdAndRev = function(doc, couchRes){
  if (!doc._id) { doc._id = couchRes.id; }
  doc._rev = couchRes.rev;
  return doc;
};

const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const { BasicUpdater } = __.require('lib', 'doc_updates');

const couch_ = require('inv-couch');

// See "The three ways to remove a document from CouchDB" http://n.exts.ch/2012/11/baleting
couch_.setDeletedTrue = BasicUpdater('_deleted', true);

couch_.setDocsDeletedTrue = docs => docs.map(couch_.setDeletedTrue);

couch_.minKey = null;
// from http://docs.couchdb.org/en/latest/couchapp/views/collation.html
// > Beware that {} is no longer a suitable “high” key sentinel value.
//   Use a string like "\ufff0" instead.
couch_.maxKey = '\ufff0';

module.exports = couch_;

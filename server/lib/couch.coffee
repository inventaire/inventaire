__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ BasicUpdater } = __.require 'lib', 'doc_updates'

couch_ = require 'inv-couch'

couch_.setDeletedTrue = BasicUpdater('_deleted', true)

couch_.setDocsDeletedTrue = (docs)-> docs.map couch_.setDeletedTrue

couch_.minKey = null
# from http://docs.couchdb.org/en/latest/couchapp/views/collation.html
# > Beware that {} is no longer a suitable “high” key sentinel value.
#   Use a string like "\ufff0" instead.
couch_.maxKey = '\ufff0'

module.exports = couch_
__ = require('config').root
_ = __.require 'builders', 'utils'
{ BasicUpdater } = __.require 'lib', 'doc_updates'

couch_ = require 'inv-couch'

couch_.setDeletedTrue = BasicUpdater('_deleted', true)

couch_.setDocsDeletedTrue = (docs)-> docs.map couch_.setDeletedTrue

module.exports = couch_
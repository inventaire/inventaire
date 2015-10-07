CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Group = __.require 'models', 'group'
error_ = __.require 'lib', 'error/error'
{ BasicUpdater } = __.require 'lib', 'doc_updates'

module.exports = (db)->
  updateGroup = (data)->
    { group, attribute, value } = data

    unless attribute in Group.attributes.updatable
      throw error_.new "#{attribute} can't be updated", 400, data

    unless Group.tests[attribute](value)
      throw error_.new "invalid #{attribute}", 400, data

    return db.update group, BasicUpdater(attribute, value)

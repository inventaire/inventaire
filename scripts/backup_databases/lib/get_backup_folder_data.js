CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
backupGeneralFolder = CONFIG.db.backupFolder
fs = require 'fs'

module.exports = ->
  day = _.simpleDay()
  backupFolder = "#{backupGeneralFolder}/#{day}"

  try
    fs.mkdirSync backupFolder
  catch err
    if err.code isnt 'EEXIST' then throw err

  return { backupFolder, backupGeneralFolder, day }

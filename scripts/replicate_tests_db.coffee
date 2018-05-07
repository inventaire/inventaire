#!/usr/bin/env coffee
CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
breq = require 'bluereq'

promises_ = __.require 'lib', 'promises'

dbsNames = Object.keys __.require('db', 'couch/list')
dbHost = require('config').db.fullHost()
allDbsUrl = dbHost + '/_all_dbs'
exec = require('child_process').exec

tests_dbs = (db)-> db.includes '-tests'

remoteDb = (dbName)-> "#{dbHost}/#{dbName}"

promises_.get allDbsUrl
.filter (db)-> tests_dbs db
.tap (dbs) -> unless _.isNonEmptyArray(dbs) then exec('npm run test-api')
.map (dbTestName)->
  dbName = dbTestName.split('-tests')[0]
  repDoc =
    source: dbHost + '/' + dbTestName
    target: dbHost + '/'+ dbName
    continuous: true
  breq.post "#{dbHost}/_replicate", repDoc
  .then _.Log('..--####### LOG ######--..')
  .timeout 20000
  .catch (err)-> console.log err

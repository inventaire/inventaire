#!/usr/bin/env coffee
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
breq = require 'bluereq'
{ exec } = require 'child_process'
{ Promise } = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

dbHost = require('config').db.fullHost()
allDbsUrl = dbHost + '/_all_dbs'

dbUrl = (dbName)-> "#{dbHost}/#{dbName}"
dbsBaseNames = Object.keys __.require('couch', 'list')

Promise.all dbsBaseNames
.map (dbName)->
  dbTestName = "#{dbName}-tests"
  repDoc =
    source: dbUrl dbTestName
    target: dbUrl dbName
  breq.post "#{dbHost}/_replicate", repDoc
  .then (res)-> res.body
  .then _.Log("#{dbTestName} replication response")
.catch (err)->
  console.log "#{err.body.reason}\n\
  Hum, have you ran the tests first ?"
  error_.catchNotFound err

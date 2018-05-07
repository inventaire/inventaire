#!/usr/bin/env coffee
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
breq = require 'bluereq'
{ exec } = require 'child_process'
promises_ = __.require 'lib', 'promises'

dbHost = require('config').db.fullHost()
allDbsUrl = dbHost + '/_all_dbs'

tests_dbs = (db)-> db.includes '-tests'
dbUrl = (dbName)-> "#{dbHost}/#{dbName}"

promises_.get allDbsUrl
.filter (db)-> tests_dbs db
.map (dbTestName)->
  dbName = dbTestName.split('-tests')[0]
  repDoc =
    source: dbUrl dbTestName
    target: dbUrl dbName
  breq.post "#{dbHost}/_replicate", repDoc
  .then (res)-> res.body
  .then _.Log "#{dbTestName} replication response"
.catch (err)-> console.log err

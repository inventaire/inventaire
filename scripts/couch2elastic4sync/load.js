#!/usr/bin/env node
const exec = require('./exec')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { indexesList } = __.require('db', 'elasticsearch/list')
const createIndex = __.require('db', 'elasticsearch/create_index')

Promise.all(indexesList.map(createIndex))
.then(() => exec('load'))
.then(() => _.success('started loading (spawned processes)'))
.catch(_.Error('load'))

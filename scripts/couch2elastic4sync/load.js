#!/usr/bin/env node
// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const exec = require('./exec')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const { indexesList } = __.require('db', 'elasticsearch/list')
const createIndex = require('./create_index')

promises_.all(indexesList.map(createIndex))
.then(() => exec('load'))
.then(() => _.success('started loading (spawned processes)'))
.catch(_.Error('load'))

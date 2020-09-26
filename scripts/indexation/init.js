#!/usr/bin/env node
const __ = require('config').universalPath
const { init } = __.require('elasticsearch', 'init')
const _ = __.require('builders', 'utils')

init()
.then(() => {
  _.success('Elasticsearch is ready')
  process.exit(0)
})
.catch(err => {
  _.error(err, 'Elasticsearch failed to init')
  process.exit(1)
})

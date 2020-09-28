console.time('startup')
const CONFIG = require('config')
// Signal to other CONFIG consumers that they are in a server context
// and not simply scripts being executed in the wild
CONFIG.serverMode = true

const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

__.require('lib', 'startup/before')()

// Starting to make CouchDB initialization checks
const waitForCouchInit = __.require('couch', 'init')
const waitForElasticsearchInit = __.require('elasticsearch', 'init')
// Meanwhile, start setting up the server.
// Startup time is mostly due to the time needed to require
// all files from controllers, middlewares, libs, etc
const initExpress = require('./init_express')

Promise.all([
  waitForCouchInit().then(_.Log('couch init')),
  waitForElasticsearchInit()
])
.then(initExpress)
.then(() => console.timeEnd('startup'))
.then(__.require('lib', 'startup/after'))
.catch(_.Error('init err'))

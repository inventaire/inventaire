// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

console.time('startup')
const CONFIG = require('config')
// Signal to other CONFIG consumers that they are in a server context
// and not simply scripts being executed in the wild
CONFIG.serverMode = true

const _ = require('builders/utils')

require('lib/startup/before')()

// Starting to make CouchDB initialization checks
const waitForCouchInit = require('db/couchdb/init')
const waitForElasticsearchInit = require('db/elasticsearch/init')
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
.then(require('lib/startup/after'))
.catch(err => {
  _.error(err, 'init err')
  // Exit after the error logs where written, and give a second
  // before a process manager might attempt to restart this process in better conditions
  setTimeout(process.exit.bind(process, 1), 1000)
})

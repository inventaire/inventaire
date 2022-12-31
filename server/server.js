import CONFIG from 'config'

import _ from 'builders/utils'

// Starting to make CouchDB initialization checks
import waitForCouchInit from 'db/couchdb/init'

import waitForElasticsearchInit from 'db/elasticsearch/init'

// Meanwhile, start setting up the server.
// Startup time is mostly due to the time needed to require
// all files from controllers, middlewares, libs, etc
import initExpress from './init_express'
console.time('startup')
// Signal to other CONFIG consumers that they are in a server context
// and not simply scripts being executed in the wild
CONFIG.serverMode = true

require('lib/startup/before')()

Promise.all([
  waitForCouchInit(),
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

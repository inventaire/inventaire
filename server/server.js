import CONFIG from 'config'
import { waitForCouchInit } from '#db/couchdb/init'
import waitForElasticsearchInit from '#db/elasticsearch/init'
import { beforeStartup, afterStartup } from '#lib/startup'
import { initExpress } from '#server/init_express'

console.time('startup')
// Signal to other CONFIG consumers that they are in a server context
// and not simply scripts being executed in the wild
CONFIG.serverMode = true

beforeStartup()

await Promise.all([
  waitForCouchInit(),
  waitForElasticsearchInit(),
])

await initExpress()

console.timeEnd('startup')

afterStartup()

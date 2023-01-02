import CONFIG from 'config'
import _ from '#builders/utils'
import waitForCouchInit from '#db/couchdb/init'
import waitForElasticsearchInit from '#db/elasticsearch/init'
import initExpress from '#server/init_express'
import { initEmailServices } from '#lib/emails/mailer'

console.time('startup')
// Signal to other CONFIG consumers that they are in a server context
// and not simply scripts being executed in the wild
CONFIG.serverMode = true
console.log('CONFIG.serverMode', CONFIG.serverMode)

require('lib/startup/before')()

await Promise.all([
  waitForCouchInit(),
  waitForElasticsearchInit()
])
await initExpress()
console.timeEnd('startup')

initEmailServices()

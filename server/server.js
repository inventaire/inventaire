import { waitForCouchInit } from '#db/couchdb/init'
import waitForElasticsearchInit from '#db/elasticsearch/init'
import { confirmServerPath } from '#lib/server_mode'
import { beforeStartup, afterStartup } from '#lib/startup'
import { initExpress } from '#server/init_express'

console.time('startup')
confirmServerPath(import.meta.url)

beforeStartup()

await Promise.all([
  waitForCouchInit(),
  waitForElasticsearchInit(),
])

await initExpress()

console.timeEnd('startup')

afterStartup()

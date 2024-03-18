import { randomBytes } from 'node:crypto'
import type { CouchUuid } from '#types/couchdb'

export const someCouchUuid: CouchUuid = '00000000000000000000000000000000'
export const someRandomCouchUuid = () => randomBytes(16).toString('hex') as CouchUuid

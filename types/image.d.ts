import type { ImageHash, Url } from '#types/common'
import type { CouchDoc } from '#types/couchdb'

export interface Image extends CouchDoc {
  _id: ImageHash
  sources: Url[]
  updated: EpochTimeStamp
}

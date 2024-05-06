import type { uploadContainersNames } from '#controllers/images/lib/containers'
import type { Url } from '#types/common'
import type { CouchDoc } from '#types/couchdb'

export type ImageHash = string
export type ImageContainer = typeof uploadContainersNames[number]
export type ImagePath = `/img/${ImageContainer}/${ImageHash}`

export type AssetImagePath = `/img/assets/${string}`
export type EntityImagePath = `/img/entities/${ImageHash}`
export type GroupImagePath = `/img/groups/${ImageHash}`
export type UserImagePath = `/img/users/${ImageHash}`

export interface Image extends CouchDoc {
  _id: ImageHash
  sources: Url[]
  updated: EpochTimeStamp
}

export type ImageDataUrl = `data:image${string}`

export type WikimediaCommonsImageUrl = `https://upload.wikimedia.org/${string}`

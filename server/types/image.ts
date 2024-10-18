import type { uploadContainersNames } from '#controllers/images/lib/containers'
import type { AbsoluteUrl, Url } from '#types/common'
import type { CouchDoc } from '#types/couchdb'
import type { WikimediaCommonsFilename } from '#types/entity'

export type ImageHash = string
export type ImageContainer = typeof uploadContainersNames[number]
export type ImagePath = `/img/${ImageContainer}/${ImageHash}`

export type AssetImagePath = `/img/assets/${string}`
export type EntityImagePath = `/img/entities/${ImageHash}`
export type GroupImagePath = `/img/groups/${ImageHash}`
export type UserImagePath = `/img/users/${ImageHash}`

export interface Image extends CouchDoc {
  _id: ImageHash
  sources: AbsoluteUrl[]
  updated: EpochTimeStamp
}

export type ImageDataUrl = `data:image${string}`

export type WikimediaCommonsImageUrl = `https://upload.wikimedia.org/${string}`

export interface ImageData {
  url: AbsoluteUrl
  file: WikimediaCommonsFilename
  credits: {
    text: string
    url: AbsoluteUrl
  }
}

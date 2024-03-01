import type { CouchUuid } from '#types/common'

export type WdPropertyUri = `wdt:P${number}`
export type InvPropertyUri = `invp:P${number}`
export type PropertyUri = WdPropertyUri | InvPropertyUri

export type WdEntityId = `Q${number}`
export type WdEntityUri = `wd:${WdEntityId}`

export type InvEntityId = CouchUuid
export type InvEntityUri = `inv:${InvEntityId}`

export type Isbn = string
export type IsbnUri = `isbn:${Isbn}`

export type EntityUri = WdEntityUri | InvEntityUri | IsbnUri

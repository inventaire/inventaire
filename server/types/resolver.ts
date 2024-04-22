import type { Url } from '#types/common'
import type { Claims, EntityUri, InvClaim, Isbn, Labels, LocalPropertyUri } from '#types/entity'

export type LooseClaim = InvClaim[] | InvClaim
export type LooseClaims = Record<LocalPropertyUri, LooseClaim>

export interface EntitySeed {
  uri?: EntityUri
  labels?: Labels
  claims?: Claims
  created?: boolean
}

export interface EditionSeed extends EntitySeed {
  isbn: Isbn
  image?: Url
}

export interface EntityLooseSeed {
  uri?: EntityUri
  labels?: Labels
  claims?: LooseClaims
}

export interface EditionLooseSeed extends EntityLooseSeed {
  isbn: Isbn
  image?: Url
}

export interface ResolverEntry {
  edition: EditionLooseSeed
  works?: EntityLooseSeed[]
  authors?: EntityLooseSeed[]
}

export interface ExternalDatabaseEntryRow {
  edition?: EditionLooseSeed
  work?: EntityLooseSeed & { tempBnfId?: string }
  author?: EntityLooseSeed & { work?: unknown }
  publisher?: EntityLooseSeed
}

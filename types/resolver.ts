import type { Url } from '#types/common'
import type { EntityUri, InvClaimValue, Isbn, Labels, LocalPropertyUri } from '#types/entity'

export type LooseClaimsValues = InvClaimValue[] | InvClaimValue
export type LooseClaims = Record<LocalPropertyUri, LooseClaimsValues>

export interface EntitySeed {
  uri?: EntityUri
  labels?: Labels
  claims?: LooseClaims
}

export interface EditionSeed extends EntitySeed {
  isbn: Isbn
  image?: Url
}

export interface ResolverEntry {
  edition: EditionSeed
  works?: EntitySeed[]
  authors?: EntitySeed[]
}

export interface ExternalDatabaseEntryRow {
  edition?: EditionSeed
  work?: EntitySeed & { tempBnfId?: string }
  author?: EntitySeed & { work?: unknown }
  publisher?: EntitySeed
}

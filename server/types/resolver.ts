import type { Url } from '#types/common'
import type { ClaimByProperty, ClaimValueByProperty, Claims, EntityUri, InvClaim, Isbn, Labels } from '#types/entity'

export type LooseClaim = InvClaim[] | InvClaim
export type LooseClaims = Partial<{
  [Property in keyof ClaimValueByProperty]: ClaimByProperty[Property] | ClaimByProperty[Property][]
}>

export interface BaseSeed {
  uri?: EntityUri
  resolved?: boolean
  labels?: Labels
  claims?: Claims
  created?: boolean
}

export interface EditionSeed extends BaseSeed {
  isbn: Isbn
  image?: Url
}

export type WorkSeed = BaseSeed
export type AuthorSeed = BaseSeed
export type EntitySeed = BaseSeed | EditionSeed

export interface BaseLooseSeed {
  uri?: EntityUri
  labels?: Labels
  claims?: LooseClaims
}

export interface EditionLooseSeed extends BaseLooseSeed {
  isbn: Isbn
  image?: Url
}

export type EntityLooseSeed = BaseLooseSeed | EditionLooseSeed

export interface ResolverEntry {
  edition: EditionLooseSeed
  works?: EntityLooseSeed[]
  authors?: EntityLooseSeed[]
}

export interface SanitizedResolverEntry {
  edition: EditionSeed
  works?: EntitySeed[]
  authors?: EntitySeed[]
}

export interface ExternalDatabaseEntryRow {
  edition?: EditionLooseSeed
  work?: EntityLooseSeed & { tempBnfId?: string }
  author?: EntityLooseSeed & { work?: unknown }
  publisher?: EntityLooseSeed
}

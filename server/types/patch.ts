import type { CouchDoc } from '#types/couchdb'
import type { EntityUri, InvClaimValue, InvEntityDoc, InvEntityId, Label, PropertyUri } from '#types/entity'
import type { UserAccountUri } from '#types/server'
import type { OverrideProperties } from 'type-fest'

export type PatchId = `${InvEntityId}:${number}`

export type OperationPath = '/type' | `/labels${string}` | `/claims${string}` | `/redirect${string}`
type OperationValue = string | Label | InvClaimValue | InvClaimValue[] | EntityUri | boolean

interface AddOperation {
  op: 'add'
  path: OperationPath
  value: OperationValue
}
interface TestOperation {
  op: 'test'
  path: OperationPath
  value: OperationValue
}
interface ReplaceOperation {
  op: 'replace'
  path: OperationPath
  value: OperationValue
}
interface RemoveOperation {
  op: 'remove'
  path: OperationPath
}

export type PatchOperation = AddOperation | TestOperation | ReplaceOperation | RemoveOperation

export type BatchId = EpochTimeStamp

export interface ActionPatchContext {
  action: 'move-to-wikidata'
}

export interface MergePatchContext {
  mergeFrom: InvEntityId
}

export interface RedirectedClaimsContext {
  redirectClaims: { fromUri: EntityUri }
}

export interface RevertedPatchContext {
  revertPatch: PatchId
}

export interface RestorePatchContext {
  restoredPatch: PatchId
}

export interface RemovedPlaceholderContext {
  deletedClaims: { subject: InvEntityId, property: PropertyUri }[]
}

export type PatchContext = ActionPatchContext | MergePatchContext | RedirectedClaimsContext | RevertedPatchContext | RestorePatchContext | RemovedPlaceholderContext

export interface Patch extends CouchDoc {
  _id: PatchId
  type: 'patch'
  user: UserAccountUri
  timestamp: EpochTimeStamp
  operations: PatchOperation[]
  batch?: BatchId
  context?: PatchContext
}

export interface PatchWithSnapshot extends Patch {
  snapshot: InvEntityDoc
}

export type NewPatch = Omit<Patch, '_rev'>

export type RemovedPlaceholderPatch = OverrideProperties<Patch, { context: RemovedPlaceholderContext }>

import type { CouchRevId } from '#types/common'
import type { EntityUri, InvClaimValue, InvEntityId, InvEntityUri, Label } from '#types/entity'
import type { UserId } from '#types/user'

export type PatchId = `${InvEntityId}:${number}`

type OperationPath = '/type' | `/labels${string}` | `/claims${string}` | `/redirect${string}` | `/deletion${string}`
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
  redirectClaims: { fromUri: InvEntityUri }
}

export interface RevertedPatchContext {
  revertPatch: PatchId
}

export interface RestorePatchContext {
  restoredPatch: PatchId
}

export interface Patch {
  _id: PatchId
  _rev: CouchRevId
  type: 'patch'
  user: UserId
  timestamp: EpochTimeStamp
  operations: PatchOperation[]
  batch?: BatchId
  context?: ActionPatchContext | MergePatchContext | RedirectedClaimsContext | RevertedPatchContext | RestorePatchContext
}

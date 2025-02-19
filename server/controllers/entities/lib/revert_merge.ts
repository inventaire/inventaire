import { map } from 'lodash-es'
import { getEntityById, putInvEntityUpdate } from '#controllers/entities/lib/entities'
import { getPatchesWithSnapshots, getPatchesByEntityId, getPatchesByRedirectUri } from '#controllers/entities/lib/patches/patches'
import { prefixifyInv } from '#controllers/entities/lib/prefix'
import { newError } from '#lib/error/error'
import type { UserWithAcct } from '#lib/federation/remote_user'
import type { EntityUri, InvEntityId, InvEntityUri } from '#types/entity'
import type { Patch } from '#types/patch'
import type { UserAccountUri } from '#types/server'
import { recoverPlaceholder } from './placeholders.js'
import { revertFromPatchDoc } from './revert_edit.js'

export default async function (user: UserWithAcct, fromId: InvEntityId) {
  const { acct: userAcct } = user
  const patches = await getPatchesWithSnapshots(fromId)
  const targetVersion = await findVersionBeforeRedirect(patches)
  const currentVersion = await getEntityById(fromId)
  if ('redirect' in currentVersion) {
    const toUri: EntityUri = currentVersion.redirect
    const fromUri: InvEntityUri = `inv:${fromId}`
    targetVersion._id = currentVersion._id
    targetVersion._rev = currentVersion._rev
    targetVersion.version = currentVersion.version

    const updateRes = await putInvEntityUpdate({
      userAcct,
      currentDoc: currentVersion,
      updatedDoc: targetVersion,
    })

    const removedPlaceholdersUris = currentVersion.removedPlaceholdersIds.map(prefixifyInv)
    await recoverPlaceholders(user, removedPlaceholdersUris)
    await revertMergePatch(userAcct, fromUri, toUri)
    await revertClaimsRedirections(userAcct, fromUri)

    return updateRes
  } else {
    throw newError('"from" entity is not a redirection', 400, { fromId })
  }
}

function findVersionBeforeRedirect (patches: Patch[]) {
  const versions = map(patches, 'snapshot')
  const lastVersion = versions.at(-1)
  if (lastVersion.redirect == null) {
    throw newError("last version isn't a redirection", 400, lastVersion)
  }

  return versions
  .filter(isntRedirection)
  // Take the last
  .at(-1)
}

const isntRedirection = version => version.redirect == null

export async function recoverPlaceholders (user: UserWithAcct, removedPlaceholdersUris: InvEntityUri[]) {
  if (removedPlaceholdersUris == null || removedPlaceholdersUris.length === 0) return
  for (const uri of removedPlaceholdersUris) {
    await recoverPlaceholder(user, uri)
  }
}

async function revertMergePatch (userAcct: UserAccountUri, fromUri: InvEntityUri, toUri: EntityUri) {
  const [ prefix, toId ] = toUri.split(':')
  if (prefix !== 'inv') return

  const patches = await getPatchesByEntityId(toId)

  const mergePatch = patches.find(patch => {
    return 'context' in patch && 'mergeFrom' in patch.context && patch.context.mergeFrom === fromUri
  })

  // There might be no mergePatch: that happens when the merged entity didn't bring
  // any label or claim value that the merge target hadn't already
  if (mergePatch) {
    const currentDoc = await getEntityById(toId)
    if (!('redirect' in currentDoc)) {
      return revertFromPatchDoc(mergePatch, userAcct)
    }
  }
}

async function revertClaimsRedirections (userAcct: UserAccountUri, fromUri: EntityUri) {
  const patches = await getPatchesByRedirectUri(fromUri)
  return Promise.all(patches.map(patch => revertFromPatchDoc(patch, userAcct)))
}

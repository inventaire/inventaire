import { getEntityById } from '#controllers/entities/lib/entities'
import { isInvEntityId } from '#lib/boolean_validations'
import { newInvalidError } from '#lib/error/pre_filled'
import { retryOnConflict } from '#lib/retry_on_conflict'
import { assertEditableEntity } from '#models/entity'
import type { InvEntityId, Label } from '#types/entity'
import type { User } from '#types/user'
import { updateLabel } from './update_label.js'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

async function updateInvLabel (user: User, id: InvEntityId, lang: WikimediaLanguageCode, value: Label) {
  const { _id: reqUserId } = user

  if (!isInvEntityId(id)) throw newInvalidError('id', id)

  const entity = await getEntityById(id)
  assertEditableEntity(entity)
  return updateLabel(lang, value, reqUserId, entity)
}

export default retryOnConflict(updateInvLabel)

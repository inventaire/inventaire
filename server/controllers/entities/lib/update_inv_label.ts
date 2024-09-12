import { getEntityById } from '#controllers/entities/lib/entities'
import { isInvEntityId } from '#lib/boolean_validations'
import { newInvalidError } from '#lib/error/pre_filled'
import { retryOnConflict } from '#lib/retry_on_conflict'
import updateLabel from './update_label.js'

async function updateInvLabel (user, id, lang, value) {
  const { _id: reqUserId } = user

  if (!isInvEntityId(id)) throw newInvalidError('id', id)

  const entity = await getEntityById(id)
  return updateLabel(lang, value, reqUserId, entity)
}

export default retryOnConflict(updateInvLabel)

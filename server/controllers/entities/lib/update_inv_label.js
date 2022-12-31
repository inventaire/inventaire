import _ from 'builders/utils'
import error_ from 'lib/error/error'
import entities_ from './entities'
import retryOnConflict from 'lib/retry_on_conflict'
import updateLabel from './update_label'

const updateInvLabel = async (user, id, lang, value) => {
  const { _id: reqUserId } = user

  if (!_.isInvEntityId(id)) throw error_.newInvalid('id', id)

  const entity = await entities_.byId(id)
  return updateLabel(lang, value, reqUserId, entity)
}

export default retryOnConflict({ updateFn: updateInvLabel })

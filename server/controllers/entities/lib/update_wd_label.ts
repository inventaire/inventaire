import { isWdEntityId } from '#lib/boolean_validations'
import { error_ } from '#lib/error/error'
import wdEdit from '#lib/wikidata/edit'
import wdOauth from './wikidata_oauth.js'

export default async (user, id, language, value) => {
  if (!isWdEntityId(id)) throw error_.newInvalid('id', id)

  wdOauth.validate(user)
  const credentials = wdOauth.getOauthCredentials(user)

  return wdEdit.label.set({ id, language, value }, { credentials })
}

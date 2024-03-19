import { getWikidataOAuthCredentials, validateWikidataOAuth } from '#controllers/entities/lib/wikidata_oauth'
import { isWdEntityId } from '#lib/boolean_validations'
import { newInvalidError } from '#lib/error/pre_filled'
import wdEdit from '#lib/wikidata/edit'

export default async (user, id, language, value) => {
  if (!isWdEntityId(id)) throw newInvalidError('id', id)

  validateWikidataOAuth(user)
  const credentials = getWikidataOAuthCredentials(user)

  return wdEdit.label.set({ id, language, value }, { credentials })
}

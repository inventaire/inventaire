import { triggerSubjectEntityCacheRefresh } from '#controllers/entities/lib/entities_relations_temporary_cache'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { getWikidataOAuthCredentials, validateWikidataOAuth } from '#controllers/entities/lib/wikidata_oauth'
import { isWdEntityId } from '#lib/boolean_validations'
import { newInvalidError } from '#lib/error/pre_filled'
import wdEdit from '#lib/wikidata/edit'

export default async function (user, id, language, value) {
  if (!isWdEntityId(id)) throw newInvalidError('id', id)

  validateWikidataOAuth(user)
  const credentials = getWikidataOAuthCredentials(user)

  const res = await wdEdit.label.set({ id, language, value }, { credentials })
  triggerSubjectEntityCacheRefresh(prefixifyWd(id))
  return res
}

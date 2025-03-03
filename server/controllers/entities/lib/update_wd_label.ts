import { triggerSubjectEntityCacheRefresh } from '#controllers/entities/lib/entities_relations_temporary_cache'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { getWikidataOAuthCredentials } from '#controllers/entities/lib/wikidata_oauth'
import { isWdEntityId } from '#lib/boolean_validations'
import { newInvalidError } from '#lib/error/pre_filled'
import type { MinimalRemoteUser } from '#lib/federation/remote_user'
import wdEdit from '#lib/wikidata/edit'
import type { Label, WdEntityId } from '#types/entity'
import type { User } from '#types/user'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

export async function updateWdLabel (user: User | MinimalRemoteUser, id: WdEntityId, language: WikimediaLanguageCode, value: Label) {
  if (!isWdEntityId(id)) throw newInvalidError('id', id)

  const { credentials, summarySuffix } = getWikidataOAuthCredentials(user)

  const res = await wdEdit.label.set({ id, language, value }, { credentials, summarySuffix })
  triggerSubjectEntityCacheRefresh(prefixifyWd(id))
  return res
}

import { absolutePath } from '#lib/absolute_path'
import { requireJson } from '#lib/utils/json'
import { warn } from '#lib/utils/logs'
import { getTypesFromTypesAliases, type TypesAliases } from '#lib/wikidata/aliases'

const extendedAliasesPath = absolutePath('server', 'assets/extended_types_aliases.json')
let _extendedTypesAliases = {} as TypesAliases
try {
  _extendedTypesAliases = requireJson(extendedAliasesPath)
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    warn(`Extended entities types aliases not found at ${extendedAliasesPath}. Run scripts/entities_extended_types_aliases/build_extended_aliases.ts to fix`)
  } else {
    throw err
  }
}

export const extendedTypesAliases = _extendedTypesAliases
export const typesByExtendedP31AliasesValues = getTypesFromTypesAliases(extendedTypesAliases)

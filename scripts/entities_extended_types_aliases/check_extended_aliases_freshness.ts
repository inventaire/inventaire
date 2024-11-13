#!/usr/bin/env tsx

import { absolutePath } from '#lib/absolute_path'
import { requireJson } from '#lib/utils/json'
import { success, warn } from '#lib/utils/logs'
import { getExtendedAliasesQueriesHash } from '#scripts/entities_extended_types_aliases/extended_type_aliases_queries'

const [ exitCodeWhenOutdated = '0' ] = process.argv.slice(2)

const currentHash = getExtendedAliasesQueriesHash()
const extendedAliasesPath = absolutePath('server', 'assets/extended_types_aliases.json')
const { queriesHash } = requireJson(extendedAliasesPath)

if (queriesHash === currentHash) {
  success('Extended entities types aliases are up-to-date')
} else {
  warn('Extended entities types aliases are outdated: run scripts/entities_extended_types_aliases/build_extended_aliases.ts to update')
  process.exit(parseInt(exitCodeWhenOutdated))
}

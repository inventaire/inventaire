import sub from 'subleveldown'
import { assert_ } from '#lib/utils/assert_types'
import { memoize } from '#lib/utils/memoize'
import { generalDb } from './get_db.js'
import type { LevelUp } from 'levelup'

// Available encodings: https://github.com/Level/codec#builtin-encodings
export const leveldbFactory = memoize<LevelUp>((dbName, valueEncoding) => {
  assert_.string(dbName)
  assert_.string(valueEncoding)
  return sub(generalDb, dbName, { valueEncoding })
})

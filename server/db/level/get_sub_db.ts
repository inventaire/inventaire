import sub from 'subleveldown'
import { assert_ } from '#lib/utils/assert_types'
import { memoize } from '#lib/utils/memoize'
import { generalDb } from './get_db.js'

// See level-codec for all available built-in encodings
// https://github.com/Level/codec#builtin-encodings
type ValueEncoding = 'utf8' | 'json' | 'binary'

// Available encodings: https://github.com/Level/codec#builtin-encodings
export const leveldbFactory = memoize((dbName: string, valueEncoding: ValueEncoding) => {
  assert_.string(dbName)
  assert_.string(valueEncoding)
  return sub(generalDb, dbName, { valueEncoding })
})

// Lodash functions, but preserving types

import { difference as _difference } from 'lodash-es'

export function difference <T> (array1: T[], array2: T[]) {
  return _difference(array1, array2) as T[]
}

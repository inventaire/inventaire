// Lodash functions, but preserving types
import {
  difference as _difference,
  groupBy as _groupBy,
  map as _map,
  uniq as _uniq,
} from 'lodash-es'

export function difference <T> (array1: T[], array2: T[]) {
  return _difference(array1, array2) as T[]
}

export function groupBy <T, K extends keyof T> (array: T[], attribute: K) {
  return _groupBy(array, attribute) as (Record<T[K] extends (string | number) ? T[K] : never, T[]>)
}

export function map <T, K extends keyof T> (array: T[], attribute: K) {
  return _map(array, attribute) as T[K][]
}

export function uniq <T> (array: T[]) {
  return _uniq(array) as T[]
}

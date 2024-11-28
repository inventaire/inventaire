import isbn3 from 'isbn3'
import { parseIsbn } from '#lib/isbn/parse'
import type { NormalizedIsbn } from '#types/entity'
import type { Replace } from 'type-fest'

const { parse: isbnParser } = isbn3

// Removing any non-alpha numeric characters, especially '-' and spaces
export function normalizeIsbn <T extends string> (text: T) {
  return text
  // Remove hypens
  .replace(/\W/g, '')
  // Make sure any 'x' is an X
  .toUpperCase() as Uppercase<Replace<T, '-', '', { all: true }>>
}

export function isNormalizedIsbn (text: string): text is NormalizedIsbn {
  return /^(97(8|9))?\d{9}(\d|X)$/.test(text)
}

// Generate a regex at every function call to be able to use g flag
// see https://stackoverflow.com/questions/1520800/why-does-a-regexp-with-global-flag-give-wrong-results
export function findIsbns (text: string) {
  const matches = text.match(/(97(8|9))?[\d-]{9,13}([\dX])/g) || []
  return matches.map(normalizeIsbn).filter(isNormalizedIsbn) as NormalizedIsbn[]
}

export function looksLikeAnIsbn (text: string) {
  if (typeof text !== 'string') return false
  const cleanedText = normalizeIsbn(text)
  if (isNormalizedIsbn(cleanedText)) {
    if (cleanedText.length === 10) return 10
    if (cleanedText.length === 13) return 13
  }
  return false
}

export const isValidIsbn = (isbn: string) => isbnParser(isbn) != null

export const toIsbn13 = (isbn: string) => parseIsbn(isbn)?.isbn13
export const toIsbn13h = (isbn: string) => parseIsbn(isbn)?.isbn13h
export const toIsbn10h = (isbn: string) => parseIsbn(isbn)?.isbn10h

export function guessLangFromIsbn (isbn?: string) {
  if (!isbn) return
  const isbnData = parseIsbn(isbn)
  if (isbnData == null) return
  return isbnData.groupLang
}

export function formatIsbn (isbn: string, formatCode: '10' | '10h' | '13' | '13h') {
  const isbnData = parseIsbn(isbn)
  return isbnData?.[`isbn${formatCode}`]
}

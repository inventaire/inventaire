import isbn3 from 'isbn3'
import { parseIsbn } from '#lib/isbn/parse'

const { parse: isbnParser } = isbn3

// Removing any non-alpha numeric characters, especially '-' and spaces
export function normalizeIsbn (text) {
  return text
  // Remove hypens
  .replace(/\W/g, '')
  // Make sure any 'x' is an X
  .toUpperCase()
}

export const isNormalizedIsbn = text => /^(97(8|9))?\d{9}(\d|X)$/.test(text)

// Generate a regex at every function call to be able to use g flag
// see https://stackoverflow.com/questions/1520800/why-does-a-regexp-with-global-flag-give-wrong-results
export function findIsbns (text) {
  const matches = text.match(/(97(8|9))?[\d-]{9,13}([\dX])/g) || []
  return matches.map(normalizeIsbn).filter(isNormalizedIsbn)
}

export function looksLikeAnIsbn (text) {
  if (typeof text !== 'string') return false
  const cleanedText = normalizeIsbn(text)
  if (isNormalizedIsbn(cleanedText)) {
    if (cleanedText.length === 10) return 10
    if (cleanedText.length === 13) return 13
  }
  return false
}

export const isValidIsbn = isbn => isbnParser(isbn) != null

export const toIsbn13 = isbn => parseIsbn(isbn)?.isbn13
export const toIsbn13h = isbn => parseIsbn(isbn)?.isbn13h
export const toIsbn10h = isbn => parseIsbn(isbn)?.isbn10h

export function guessLangFromIsbn (isbn) {
  if (!isbn) return
  const isbnData = parseIsbn(isbn)
  if (isbnData == null) return
  return isbnData.groupLang
}

export function formatIsbn (isbn, formatCode) {
  const isbnData = parseIsbn(isbn)
  return isbnData?.[`isbn${formatCode}`]
}

import isbn3 from 'isbn3'
import { parseIsbn } from '#lib/isbn/parse'

const { isbnParser } = isbn3

// Removing any non-alpha numeric characters, especially '-' and spaces
export const normalizeIsbn = text => {
  return text
  // Remove hypens
  .replace(/\W/g, '')
  // Make sure any 'x' is an X
  .toUpperCase()
}

export const isNormalizedIsbn = text => /^(97(8|9))?\d{9}(\d|X)$/.test(text)

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

export function toIsbn13 (isbn, hyphenate) {
  const data = parseIsbn(isbn)
  if (data == null) return
  if (hyphenate) return data.isbn13h
  else return data.isbn13
}

export const toIsbn13h = isbn => parseIsbn(isbn).isbn13h
export const toIsbn10h = isbn => parseIsbn(isbn).isbn10h

export function guessLangFromIsbn (isbn) {
  if (!isbn) return
  const isbnData = parseIsbn(isbn)
  if (isbnData == null) return
  return isbnData.groupLang
}

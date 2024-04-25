import { randomBytes } from 'node:crypto'

// Generated strings should:
// - be fast to generate
// - be in a URL or file path without requiring to be escaped
// - have the highest possible entropy with those constraints
export function getRandomString (length: number) {
  // 1 byte = 8 bits
  // 1 base64 character = log2(64) bits = 6 bits
  // So to get x base64 characters, we need x*6/8 bytes,
  // but we request more as some characters will be dropped to keep only alphanumerics

  const result = randomBytes(length)
    .toString('base64')
    .replace(/\W/g, '')

  // Due to the dropped characters, there is chance we don't have enough
  if (result.length >= length) {
    return result.slice(0, length)
  } else {
    return getRandomString(length)
  }
}

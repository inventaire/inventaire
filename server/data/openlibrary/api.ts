import type { AbsoluteUrl } from '#types/common'

const coverBase = 'http://covers.openlibrary.org'

export const coverByOlId = (olId: string, type = 'b') => `${coverBase}/${type}/olid/${olId}.jpg` as AbsoluteUrl

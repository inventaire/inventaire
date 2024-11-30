import { getWikipediaArticle } from '#data/wikipedia/get_article'
import { newError } from '#lib/error/error'
import { normalizeWikimediaLang } from '#lib/wikimedia'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  title: {},
  lang: {
    type: 'wikimedia',
  },
}

async function controller ({ lang, title }: SanitizedParameters) {
  lang = normalizeWikimediaLang(lang)
  if (isInvalidTitle(title)) {
    throw newError('invalid title', 400, { title })
  }
  return getWikipediaArticle({ lang, title, introOnly: true })
}

const isInvalidTitle = title => /[{}]/.test(title)

export default { sanitization, controller }

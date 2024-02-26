import { getWikipediaArticle } from '#data/wikipedia/get_article'
import { newError } from '#lib/error/error'
import { normalizeWikimediaLang } from '#lib/wikimedia'

const sanitization = {
  title: {},
  lang: {
    type: 'wikimedia',
  },
}

const controller = async ({ lang, title }) => {
  lang = normalizeWikimediaLang(lang)
  if (isInvalidTitle(title)) {
    throw newError('invalid title', 400, { title })
  }
  return getWikipediaArticle({ lang, title, introOnly: true })
}

const isInvalidTitle = title => /[{}]/.test(title)

export default { sanitization, controller }

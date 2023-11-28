import getArticle from '#data/wikipedia/get_article'
import { normalizeWikimediaLang } from '#lib/wikimedia'

const sanitization = {
  title: {},
  lang: {
    type: 'wikimedia',
  },
}

const controller = async ({ lang, title }) => {
  lang = normalizeWikimediaLang(lang)
  return getArticle({ lang, title, introOnly: true })
}

export default { sanitization, controller }

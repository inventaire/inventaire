import getArticle from 'data/wikipedia/get_article'

const sanitization = {
  title: {},
  lang: {
    type: 'wikimedia'
  },
}

const controller = async ({ lang, title }) => {
  return getArticle({ lang, title, introOnly: true })
}

export default { sanitization, controller }

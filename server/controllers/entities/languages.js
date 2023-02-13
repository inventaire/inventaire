import { searchLanguages } from '#controllers/entities/lib/languages'

const sanitization = {
  search: {},
  lang: {
    default: 'en',
  },
  limit: { default: 10, max: 100 },
  offset: { default: 0, max: 500 },
}

async function controller ({ search, lang, limit, offset }) {
  const results = await searchLanguages({ search, lang, limit, offset })
  return { languages: results }
}

export default { sanitization, controller }

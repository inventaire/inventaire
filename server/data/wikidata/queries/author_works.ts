import { authorRelationsProperties } from '#controllers/entities/lib/properties/properties'

export default {
  parameters: [ 'qid' ],

  relationProperties: authorRelationsProperties,

  query: params => {
    const { qid: authorQid } = params
    return `SELECT ?work ?type ?date ?serie WHERE {
  ?work ${authorRelationsProperties.join('|')} wd:${authorQid} .
  ?work wdt:P31 ?type .
  FILTER NOT EXISTS { ?work wdt:P31 wd:Q3331189 }
  OPTIONAL { ?work wdt:P577 ?date . }
  OPTIONAL { ?work wdt:P179 ?serie . }
  OPTIONAL { ?work wdt:P361 ?serie . }
}`
  },
}

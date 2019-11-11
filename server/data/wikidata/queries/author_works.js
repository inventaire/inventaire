// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = {
  parameters: [ 'qid' ],
  query(params){
    const { qid:authorQid } = params
    return `\
SELECT ?work ?type ?date ?serie WHERE {
  ?work wdt:P50|wdt:P58|wdt:P110|wdt:P6338 wd:${authorQid} .
  ?work wdt:P31 ?type .
  FILTER NOT EXISTS { ?work wdt:P31 wd:Q3331189 }
  OPTIONAL { ?work wdt:P577 ?date . }
  OPTIONAL { ?work wdt:P179 ?serie . }
  OPTIONAL { ?work wdt:P361 ?serie . }
}\
`
  }
}

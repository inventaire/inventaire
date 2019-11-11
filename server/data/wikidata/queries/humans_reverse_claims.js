/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = {
  parameters: [ 'pid', 'qid' ],
  query(params){
    const { pid, qid } = params;
    return `\
SELECT DISTINCT ?item WHERE {
  ?item wdt:${pid} wd:${qid} .
  ?item wdt:P31 wd:Q5 .

  # Keep only humans that are known for at least one work
  ?work wdt:P50 ?item .
  # book
  { ?work wdt:P31 wd:Q571 . }
  # literary work
  UNION { ?work wdt:P31 wd:Q7725634 . }
  # comic book album
  UNION { ?work wdt:P31 wd:Q2831984 . }
  # comic book
  UNION { ?work wdt:P31 wd:Q1004 . }
  # manga
  UNION { ?work wdt:P31 wd:Q8274 . }
}
LIMIT 1000\
`;
  }
};

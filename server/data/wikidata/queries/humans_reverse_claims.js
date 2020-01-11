module.exports = {
  parameters: [ 'pid', 'qid' ],
  query: params => {
    const { pid, qid } = params
    // Keep only humans that are known for at least one work

    // Work types:
    // Q571       book
    // Q47461344  written work
    // Q7725634   literary work
    // Q2831984   comic book album
    // Q1004      comic
    // Q1760610   comic book
    // Q8274      manga

    return `SELECT DISTINCT ?item WHERE {
  ?item wdt:${pid} wd:${qid} .
  ?item wdt:P31 wd:Q5 .
  ?work wdt:P50 ?item .
  VALUES (?work_type) { (wd:Q571) (wd:Q47461344) (wd:Q7725634) (wd:Q2831984) (wd:Q1004) (wd:Q1760610) (wd:Q8274) } .
  ?work wdt:P31 ?work_type .
}
LIMIT 1000`
  }
}

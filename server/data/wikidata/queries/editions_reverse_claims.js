module.exports = {
  parameters: [ 'pid', 'qid' ],
  query: params => {
    const { pid, qid } = params
    // Filter-out entities tagged as both work and edition (Q3331189)

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
  ?item wdt:P31 wd:Q3331189 .
  FILTER NOT EXISTS {
    VALUES (?work_type) { (wd:Q571) (wd:Q47461344) (wd:Q7725634) (wd:Q2831984) (wd:Q1004) (wd:Q1760610) (wd:Q8274) } .
    ?item wdt:P31 ?work_type
  }
}
LIMIT 1000`
  }
}

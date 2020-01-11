module.exports = {
  parameters: [ 'pid', 'qid' ],
  query: params => {
    const { pid, qid } = params
    return `SELECT DISTINCT ?item WHERE {
  ?item wdt:${pid} wd:${qid} .
  ?item wdt:P31 wd:Q3331189 .
  # Filter-out entities tagged as both work and edition
  FILTER NOT EXISTS {
    VALUES (?work_type) { (wd:Q571) (wd:Q47461344) (wd:Q7725634) (wd:Q2831984) (wd:Q1004) (wd:Q1760610) (wd:Q8274) } .
    ?item wdt:P31 ?work_type
  }
}
LIMIT 1000`
  }
}

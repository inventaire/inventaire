// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

module.exports = {
  parameters: [ 'pid', 'qid' ],

  relationProperties: [ '*' ],

  query: params => {
    const { pid, qid } = params
    return `SELECT DISTINCT ?item WHERE {
  ?item wdt:${pid} wd:${qid} .
  # book
  { ?item wdt:P31 wd:Q571 . }
  # written work
  UNION { ?item wdt:P31 wd:Q47461344 . }
  # literary work
  UNION { ?item wdt:P31 wd:Q7725634 . }
  # comic book album
  UNION { ?item wdt:P31 wd:Q2831984 . }
  # comic book
  UNION { ?item wdt:P31 wd:Q1004 . }
  # manga
  UNION { ?item wdt:P31 wd:Q8274 . }
  # book series
  UNION { ?item wdt:P31 wd:Q277759 . }
  # comic book series
  UNION { ?item wdt:P31 wd:Q14406742 . }
  # manga series
  UNION { ?item wdt:P31 wd:Q21198342 . }
  # novel series
  UNION { ?item wdt:P31 wd:Q1667921 . }
  # Filter-out entities tagged as both work and edition
  FILTER NOT EXISTS { ?item wdt:P31 wd:Q3331189 }
}
LIMIT 1000`
  }
}

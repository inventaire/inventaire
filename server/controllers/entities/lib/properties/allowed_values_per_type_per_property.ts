export const allowedValuesPerTypePerProperty = {
  'wdt:P31': {
    collections: [
      'wd:Q20655472', // editorial collection
    ],
    editions: [
      'wd:Q3331189', // edition
    ],
    humans: [
      'wd:Q5', // human
    ],
    publishers: [
      'wd:Q2085381', // publisher
    ],
    series: [
      'wd:Q277759', // book series
      'wd:Q1667921', // novel series
      'wd:Q14406742', // comic book series
      'wd:Q21198342', // manga series
      'wd:Q74262765', // manhwa series
      'wd:Q104213567', // light novel series
    ],
    works: [
      'wd:Q47461344', // written work
      'wd:Q7725634', // literary work
      'wd:Q1004', // bande dessinée / comic book
      'wd:Q8261', // novel / roman
      'wd:Q725377', // graphic novel
      'wd:Q25379', // theatre play
      'wd:Q49084', // short story / conte
      'wd:Q8274', // manga
      'wd:Q562214', // manhwa
    ],
  },

  'wdt:P437': {
    editions: [
      'wd:Q193934', // paperback
      'wd:Q193955', // hardback
      'wd:Q17994250', // pocket edition
      'wd:Q2831984', // comic book album
      'wd:Q128093', // ebook
      'wd:Q106833', // audiobook
    ],
  },
  'wdt:P7937': {
    works: [
      'wd:Q8261',
      'wd:Q25379',
      'wd:Q1279564',
      'wd:Q12106333',
      'wd:Q125544547',
      'wd:Q19357149',
      'wd:Q105420',
      'wd:Q1266946',
      'wd:Q384515',
      'wd:Q193495',
      'wd:Q83790',
      'wd:Q35760',
      'wd:Q1143604',
      'wd:Q780605',
      'wd:Q23622',
      'wd:Q5292',
      'wd:Q49084',
      'wd:Q472808',
      'wd:Q43334491',
      'wd:Q5185279',
      'wd:Q149537',
      'wd:Q642946',
      'wd:Q20024995',
      'wd:Q2352616',
      'wd:Q27560760',
      'wd:Q65085460',
      'wd:Q5456296',
      'wd:Q725377',
      'wd:Q49850',
      'wd:Q185598',
      'wd:Q111180384',
    ],
  },
} as const

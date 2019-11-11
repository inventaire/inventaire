const coverBase = 'http://covers.openlibrary.org';

module.exports =
  {coverByOlId(olId, type = 'b'){ return `${coverBase}/${type}/olid/${olId}.jpg`; }};

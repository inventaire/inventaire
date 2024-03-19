import { simplifySparqlResults } from 'wikibase-sdk'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { setEditionContributors } from '#data/bnf/helpers'
import { formatAuthorName } from '#data/commons/format_author_name'
import { buildEntryFromFormattedRows } from '#data/lib/build_entry_from_formatted_rows'
import { parseSameasMatches } from '#data/lib/external_ids'
import { setEditionPublisherClaim } from '#data/lib/set_edition_publisher_claim'
import { parseIsbn } from '#lib/isbn/parse'
import { requests_ } from '#lib/requests'
import { requireJson } from '#lib/utils/json'
import { warn } from '#lib/utils/logs'
import { fixedEncodeURIComponent } from '#lib/utils/url'
import type { Url } from '#types/common'
import type { ExternalDatabaseEntryRow } from '#types/resolver'

const wdIdByIso6392Code = requireJson('wikidata-lang/mappings/wd_id_by_iso_639_2_code.json')
const wmCodeByIso6392Code = requireJson('wikidata-lang/mappings/wm_code_by_iso_639_2_code.json')

// Using a shorter timeout as the query is never critically needed but can make a user wait
const timeout = 10000

const headers = { accept: '*/*' }
const base = `https://data.bnf.fr/sparql?default-graph-uri=&format=json&timeout=${timeout}&query=`

export default async isbn => {
  const url = base + getQuery(isbn) as Url
  const response = await requests_.get(url, { headers, timeout })
  const simplifiedResults = simplifySparqlResults(response)
  const { bindings: rawResults } = response.results
  const rows = await Promise.all(simplifiedResults.map((result, i) => {
    return formatRow(isbn, result, rawResults[i])
  }))
  const entry = buildEntryFromFormattedRows(rows, getSourceId)
  await setEditionPublisherClaim(entry)
  await addImage(entry)
  return entry
}

const getQuery = isbn => {
  const isbnData = parseIsbn(isbn)
  if (!isbnData) throw new Error(`invalid isbn: ${isbn}`)
  const { isbn10h, isbn13h, isbn13 } = isbnData
  const query = `
  PREFIX bibo: <http://purl.org/ontology/bibo/>
  PREFIX bnf-onto: <http://data.bnf.fr/ontology/bnf-onto/>
  PREFIX bnfroles: <http://data.bnf.fr/vocabulary/roles/>
  PREFIX dcterms: <http://purl.org/dc/terms/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX marcrel: <http://id.loc.gov/vocabulary/relators/>
  PREFIX owl: <http://www.w3.org/2002/07/owl#>
  PREFIX rdagroup1elements: <http://rdvocab.info/Elements/>
  PREFIX rdarelationships: <http://rdvocab.info/RDARelationshipsWEMI/>

  SELECT DISTINCT ?edition ?editionTitle ?editionPublicationDate ?work ?workLabel ?workPublicationDate ?author ?authorLabel ?authorFamilyName ?expressionLang ?publisherLabel (GROUP_CONCAT(?editionMatch;separator=",") AS ?editionMatches) (GROUP_CONCAT(?workMatch;separator=",") AS ?workMatches) (GROUP_CONCAT(?authorMatch;separator=",") AS ?authorMatches) (GROUP_CONCAT(?translator;separator=",") AS ?translators) (GROUP_CONCAT(?postfaceAuthor;separator=",") AS ?postfaceAuthors) (GROUP_CONCAT(?prefaceAuthor;separator=",") AS ?prefaceAuthors) WHERE {

  { ?edition bnf-onto:isbn "${isbn10h}" }
  UNION { ?edition bnf-onto:isbn "${isbn13h}" }
  UNION { ?edition bnf-onto:ean "${isbn13}" }

  OPTIONAL{ ?edition dcterms:date ?editionPublicationDate }
  OPTIONAL{ ?edition dcterms:title ?editionTitle }
  OPTIONAL{ ?edition rdagroup1elements:publishersName ?publisherLabel }

  OPTIONAL {
    { ?edition owl:sameAs ?editionMatch . } UNION { ?edition skos:exactMatch ?editionMatch . }
  }

  OPTIONAL {
    ?edition rdarelationships:expressionManifested ?expression_a .
    OPTIONAL { ?expression_a dcterms:language ?expressionLang . }
    OPTIONAL { ?expression_a bnfroles:r680 ?translator . }
    OPTIONAL { ?expression_a bnfroles:r540 ?postfaceAuthor . }
    OPTIONAL { ?expression_a bnfroles:r550 ?prefaceAuthor . }
  }

  OPTIONAL {
    ?edition rdarelationships:workManifested ?work .

    OPTIONAL {
      { ?work owl:sameAs ?workMatch . } UNION { ?work skos:exactMatch ?workMatch . }
    }
    OPTIONAL { ?work dcterms:title ?workLabel }
    OPTIONAL { ?work bnf-onto:firstYear ?workPublicationDate }
  }

  OPTIONAL {
    {
      ?edition rdarelationships:workManifested ?work .
      ?work dcterms:creator ?author .
    } UNION {
      ?edition rdarelationships:expressionManifested ?expression_b .
      ?expression_b marcrel:aut ?author .
    }
    OPTIONAL {
      ?author foaf:name ?authorLabel .
    }
    OPTIONAL {
      ?author foaf:familyName ?authorFamilyName .
    }
    OPTIONAL {
      { ?author owl:sameAs ?authorMatch . }
      UNION { ?author skos:exactMatch ?authorMatch . }
      UNION {
        ?author foaf:Person ?person .
        { ?person owl:sameAs ?authorMatch . } UNION { ?person skos:exactMatch ?authorMatch . }
      }
    }
  }
}
GROUP BY ?edition ?editionTitle ?editionPublicationDate ?work ?workLabel ?workPublicationDate ?author ?authorLabel ?authorFamilyName ?expressionLang ?publisherLabel`
  return fixedEncodeURIComponent(query)
}

const formatRow = async (isbn, result, rawResult) => {
  const { edition, work, author, publisherLabel, translators, postfaceAuthors, prefaceAuthors } = result
  const expressionLang = result.expressionLang?.replace('http://id.loc.gov/vocabulary/iso639-2/', '')
  const workLabelLang = rawResult.workLabel?.['xml:lang'] || wmCodeByIso6392Code[expressionLang]
  if (workLabelLang) result.work.labelLang = workLabelLang
  const entry: ExternalDatabaseEntryRow = {
    edition: { isbn },
  }
  if (edition) {
    const { claims } = await parseSameasMatches({
      matches: [ edition.value, edition.matches ],
      expectedEntityType: 'edition',
    })
    entry.edition.claims = {
      'wdt:P1476': cleanupBnfTitle(edition.title),
      'wdt:P577': edition.publicationDate,
      ...claims,
    }
    if (expressionLang && wdIdByIso6392Code[expressionLang]) {
      entry.edition.claims['wdt:P407'] = prefixifyWd(wdIdByIso6392Code[expressionLang])
    }
    if (translators) {
      await setEditionContributors(entry.edition, 'wdt:P655', translators)
    }
    if (prefaceAuthors) {
      await setEditionContributors(entry.edition, 'wdt:P2679', prefaceAuthors)
    }
    if (postfaceAuthors) {
      await setEditionContributors(entry.edition, 'wdt:P2680', postfaceAuthors)
    }
  }
  if (work.value) {
    const { uri, claims } = await parseSameasMatches({
      matches: [ work.value, work.matches ],
      expectedEntityType: 'work',
    })
    entry.work = {
      uri,
      labels: {
        [work.labelLang]: work.label,
      },
      claims,
    }
    if (work.value.includes('temp-work')) entry.work.tempBnfId = work.value
  }
  if (author.value) {
    const { uri, claims } = await parseSameasMatches({
      matches: [ author.value, author.matches ],
      expectedEntityType: 'human',
    })
    entry.author = {
      uri,
      claims,
      work,
    }
    if (author.label || author.familyName) {
      entry.author.labels = {
        fr: formatAuthorName(author.label || author.familyName),
      }
    }
    // Remove author if it doesn't match a valid entry format
    // as it would otherwise crash at validation
    if (!(entry.author.uri || entry.author.labels.fr)) {
      warn(author, 'invalid BNF author entry')
      delete entry.author
    }
  }
  if (publisherLabel) {
    entry.publisher = {
      labels: { fr: publisherLabel },
    }
  }
  return entry
}

const getSourceId = entity => entity.claims?.['wdt:P268'] || entity.tempBnfId || entity.labels?.fr

const addImage = async entry => {
  const bnfId = entry?.edition.claims['wdt:P268']
  if (!bnfId) return
  const url = `https://catalogue.bnf.fr/couverture?appName=NE&idArk=ark:/12148/cb${bnfId}&couverture=1` as Url
  const { statusCode, headers } = await requests_.head(url)
  let { 'content-length': contentLength } = headers
  if (contentLength) contentLength = parseInt(contentLength)
  if (statusCode === 200 && !placeholderContentLengths.includes(contentLength)) {
    entry.edition.image = url
  }
}

const placeholderContentLengths = [
  4566,
  4658,
]

export function cleanupBnfTitle (title) {
  return title
  // 'some title : [roman]' => 'some title'
  .replace(/: \[?((a|an|un|une) )?((actes|antholog(ie|y)|autobiograph(ie|y)|bande dessinée|biograph(ie|y)|casebook|comédie|conte|document|encyclopedia|encyclopédie|entretien|essai|history|memoir|mémoire|nouvelle|novel|photographies|poem|poème|poésie|récit|roman|stories|texte intégral|théâtre|thriller)s?)( \w+)?\]?$/i, '')
  .trim()
  // ':20000 :+vingt mille+ lieues sous les mers' => 'vingt mille lieues sous les mers'
  .replace(/:\d+ :\+([^+]+)\+ /g, '$1 ')
  // '"some title"' => 'some title'
  .replace(/^"([^"]+)"$/, '$1')
  .trim()
}

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
require 'should'
automergeFn = __.require 'controllers', 'tasks/lib/automerge'

suspect =
  uri: 'inv:00000000000000000000000000000000'
  labels: { en: 'Loic Faujour' }
  claims: { 'wdt:P31': [ 'wd:Q5' ] }

addOccurrence = (suggestion, urls, matchedTitles)->
  urls.map (url)->
    suggestion.occurrences.push { url, matchedTitles }

createSuggestions = ->
  [
      uri: 'wd:Q3067358'
      occurrences: []
  ]

describe 'tasks automerge', ->
  it 'should return an empty list when no occurrence exists', (done)->
    matchedTitles = [ 'random title' ]
    suggestions = []
    automerge(suggestions, matchedTitles).should.deepEqual suggestions
    done()

  it 'should return occurrences when untrustworthy occurrences are passed', (done)->
    urls = [
      'https://fr.wikipedia.org/wiki/Faujour'
      'https://pl.wikipedia.org/wiki/Faujour'
      'https://la.wikipedia.org/wiki/Faujour'
    ]
    matchedTitles = [ 'Short title' ]
    suggestions = createSuggestions()
    addOccurrence(suggestions[0], urls, matchedTitles)

    # when no merge was done return suggestions
    automerge(suggestions, matchedTitles).should.deepEqual suggestions
    done()

  it 'should merge and return a Promise when trustworthy occurences are passed', (done)->
    urls = [
      'http://data.bnf.fr/ark:/12345/cb410608300#about'
      'http://datos.bne.es/resource/XX2052428'
    ]

    matchedTitles = [ 'Short title' ]
    suggestions = createSuggestions()
    addOccurrence(suggestions[0], urls, matchedTitles)

    # return a mergeEntities promise
    automerge(suggestions, matchedTitles).should.be.Promise()
    done()

  it 'should not merge when several suggestions have occurences', (done)->
    urls1 = [
      'http://data.bnf.fr/ark:/12345/cb410608300#about'
      'http://datos.bne.es/resource/XX12345'
    ]
    urls2 = [
      'http://data.bnf.fr/ark:/54321/cb410608300#about'
      'http://datos.bne.es/resource/XX54321'
    ]
    matchedTitles = [ 'Short title' ]
    suggestions = createSuggestions()
    suggestions.push { uri: 'wd:Q6530', occurrences: [] }
    addOccurrence(suggestions[0], urls1, matchedTitles)
    addOccurrence(suggestions[1], urls2, matchedTitles)

    automerge(suggestions, matchedTitles).should.deepEqual suggestions
    done()

  it 'should merge when one suggestions have trusted occurences', (done)->
    urls1 = [
      'http://data.bnf.fr/ark:/12345/cb410608300#about'
      'http://datos.bne.es/resource/XX12345'
    ]
    urls2 = [
      'https://fr.wikipedia.org/wiki/Faujour'
      'https://pl.wikipedia.org/wiki/Faujour'
    ]
    matchedTitles = [ 'Short title' ]
    suggestions = createSuggestions()
    suggestions.push { uri: 'wd:Q6530', occurrences: [] }
    addOccurrence(suggestions[0], urls1, matchedTitles)
    addOccurrence(suggestions[1], urls2, matchedTitles)

    automerge(suggestions, matchedTitles).should.be.Promise()
    done()

  it 'should not merge when author name is in work title', (done)->
    # known cases : autobiography
    urls = [
      'http://data.bnf.fr/ark:/12148/cb410608300#about'
      'http://datos.bne.es/resource/XX2052428'
    ]

    matchedTitles = [ suspect.labels.en ]
    suggestions = createSuggestions()
    addOccurrence(suggestions[0], urls, matchedTitles)

    automerge(suggestions, matchedTitles).should.deepEqual suggestions
    done()

automerge = (suggestions, matchedTitles)->
  automergeFn(suspect, matchedTitles)(suggestions)


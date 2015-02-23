#Inventaire
Libre collaborative resource mapper powered by open-knowledge

[![Licence](https://img.shields.io/badge/licence-AGPL3-blue.svg)](http://www.gnu.org/licenses/agpl-3.0.html)
[![Node](https://img.shields.io/node/v/gh-badges.svg)](http://www.gnu.org/licenses/agpl-3.0.html)

[![inventory-en](http://profile.maxlath.eu/slides/backbone-meetup/img/inventory-en.png)](https://inventaire.io)

This repository hosts [Inventaire.io](https://inventaire.io) source code. Its a collaborative resources mapper project, while yet only focused on exploring books mapping with [wikidata](https://wikidata.org/) and [ISBNs](https://en.wikipedia.org/wiki/International_Standard_Book_Number)

This repository tracks the server-side developments, while the (heavy) [client-side can be found here](https://github.com/maxlath/inventaire-client).

##Stack approximative overview
![stack-en](http://profile.maxlath.eu/slides/backbone-meetup/img/stack-en.jpg)


##Contributions

###Internationalization (i18n)
Want to help translating Inventaire in your language?
You can edit the files in the [client i18n branch](https://github.com/maxlath/inventaire-client/tree/i18n).

You will find three subfolders containing json files

####fullkey
ex: `src/fullkey/xx.json`
Keys are the full text in English
For instance, in fullkeys you will find keys like `delete` or `welcome`.

####shortkey
ex: `src/shortkey/xx.json`
Keys are made of some English words indicating the context and `snake_cased` with always at least one `_`.
It is used for text that would take a lot of space as a fullkeys or that require a special treatment:
  - shortkeys may contain string interpolation. ex: `"has_it": "%{username} has it"`
  - shortkeys may contain a few supported markdown syntax elements (links `[text](href)` and `**bold text**`)

####wikidata
ex: `src/wikidata/xx.json`
Keys are a wikidata property identifier like `P50`.
You don't need to edit those as those files are generated from wikidata api, but if you find a missing translation, you can directly edit the properties on wikidata ([P50](https://www.wikidata.org/wiki/Property:P50) for instance) and ask for a regeneration of those files.

####i18n file generation and archives
*i18n file generation is a bit hacky, but you don't need to understand the full process if you just want to edit a language file*
Lang files are updated using the [https://github.com/maxlath/inventaire-client/blob/master/scripts/generate_lang_json.coffee](generate_lang_json) script: it takes the language files (fullkey, shortkeys and wikidata) as first source, then fills the holes with the English values.
It outputs 7 files per languages:
- a `dist/xx.json` file with all the key / values pairs needed by the website at the moment
- updated versions of `src/fullkey/xx.json`, `src/shortkey/xx.json`, and `src/wikidata/xx.json` where keys not found in the reference file (the English version) were removed and keys not found in this file were added with value `null`.
- updated versions of `src/fullkey/archived/xx.json`, `src/shortkey/archived/xx.json`, and `src/wikidata/archived/xx.json`, gathering non-null keys that were removed. Those key may come back in the game if the key reappears in the reference file.

####currently active languages
- English (en - reference files): [fullkeys](https://github.com/maxlath/inventaire-client/blob/i18n/src/fullkeys/en.json), [shortkeys](https://github.com/maxlath/inventaire-client/blob/i18n/src/shortkey/en.json)
- French (fr): [fullkeys](https://github.com/maxlath/inventaire-client/blob/i18n/src/fullkeys/fr.json), [shortkeys](https://github.com/maxlath/inventaire-client/blob/i18n/src/shortkey/fr.json)

*start a new language by adding missing values in its [fullkeys](https://github.com/maxlath/inventaire-client/blob/i18n/src/fullkeys) or [shortkeys](https://github.com/maxlath/inventaire-client/blob/i18n/src/shortkey) file*



## Installation

```
git clone git@github.com:maxlath/inventaire.git
cd inventaire
npm install
npm run install-client
```

##Day-dreaming on future evolutions

[Inventaire.io](https://inventaire.io) is a hub for open-knowledge-based peers inventory data. This prototype uses a centralized database to make the early development easier, while being as easy as possible to 'install' and use: well, it's just a classic website. Meanwhile, this repository is public as there is no reason it should ever stay so: this is a research work in progress, if you can think of a better/more decentralized way for peers to keep their inventory data and share it with others, you are very welcome to join the effort or experiment on your own with what you can find here. The hard point being sharing data between this centralized website and other inventory implementations. Works on a standard data model and an API would be a priority as soon as meaningful.

**Ideas for experimentations:**

- port to custom desktop clients using [node-webkit](https://github.com/rogerwang/node-webkit) or alike
- port to an app for personal cloud platforms: [Cozy](http://cozy.io), [OwnCloud](http://owncloud.org/)...
- server-less/P2P inventory sharing using WebRTC DataChannel / [WebTorrent](https://github.com/feross/webtorrent)
- any other IndieWeb / [Unhosted](https://unhosted.org/) crazyness? :)

**Already experiementing**

*see [Labs settings](https://inventaire.io/settings/labs)*
- user data backup to any CouchDB using [PouchDB](http://pouchdb.com/).

## Powered by

- [CoffeeScript](http://coffeescript.org/)

**Server-side**
- [ExpressJs](http://expressjs.com/) within a ligth wrapper: [Americano](https://github.com/cozy/americano)
- [Bluebird](https://github.com/petkaantonov/bluebird) for promises
- [Lodash](http://lodash.com/) utils
- [node-config](https://github.com/lorenwest/node-config)


*find a more complete list of dependencies in the [package.json](https://github.com/maxlath/inventaire/blob/dev/package.json)*

**Databases**
- [CouchDB](http://couchdb.apache.org/)
- [LevelDB](http://leveldb.org/) with [LevelUp](https://github.com/rvagg/node-levelup) and [LevelGraph](https://github.com/mcollina/levelgraph)

**Client-side**
- [BackboneJs](http://backbonejs.org/) / [MarionetteJs](http://marionettejs.com/)
- [Handlebars](http://handlebarsjs.com/) for templates
- some [Foundation](http://foundation.zurb.com/) for UI framework, but more and more just standard CSS3 flexbox everywhere (hammer, nail, blablabla)
- [Font-Awesome icons](http://fortawesome.github.io/Font-Awesome/icons/)
- [qLabel](https://github.com/googleknowledge/qlabel/) to work with Wikidata entities labels
- [Level.js](https://github.com/maxogden/level.js) for client-side caching
- [Polyglot.js](http://airbnb.github.io/polyglot.js/) for i18n
- [Brunch](http://brunch.io/) (task-runner)

*find a more complete list of dependencies in [package.json](https://github.com/maxlath/inventaire-client/blob/dev/package.json) and [bower.json](https://github.com/maxlath/inventaire-client/blob/dev/bower.json)*

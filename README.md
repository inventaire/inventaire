#Inventaire

Libre collaborative resource mapper powered by open-knowledge

[![Licence](https://img.shields.io/badge/licence-AGPL3-blue.svg)](http://www.gnu.org/licenses/agpl-3.0.html)
[![Node](https://img.shields.io/node/v/gh-badges.svg)](http://www.gnu.org/licenses/agpl-3.0.html)
![dependencies](https://david-dm.org/inventaire/inventaire.svg)
[![Join the chat at https://gitter.im/inventaire/inventaire](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/inventaire/inventaire)

[![inventory-georges](http://profile.maxlath.eu/slides/backbone-meetup/img/inventory-georges.png)](https://inventaire.io)

This repository hosts [Inventaire.io](https://inventaire.io) source code. Its a collaborative resources mapper project, while yet only focused on exploring books mapping with [wikidata](https://wikidata.org/) and [ISBNs](https://en.wikipedia.org/wiki/International_Standard_Book_Number)

This repository tracks the server-side developments, while the (heavy) [client-side can be found here](https://github.com/inventaire/inventaire-client).

##Stack approximative overview
![stack-en](http://profile.maxlath.eu/slides/backbone-meetup/img/stack-en.jpg)

##Concepts map
the whole app turns around 3 core concepts:
- Users
- Entities : encompass authors (ex: [wd:Q353](https://inventaire.io/entity/wd:Q535)), books (ex: [wd:Q393018](https://inventaire.io/entity/wd:Q393018)) and books' specific editions (ex: [isbn:9782070389162](https://inventaire.io/entity/isbn:9782070389162)). The term *entities* is inherited from wikidata terminology.
- Items : instances of those entities that a user declare to own

##Contributions

###Internationalization (i18n)
* see wiki: [Internationalization](https://github.com/inventaire/inventaire/wiki/Internationalization)

## Installation

General dependencies:
- git, node (0.10), npm, coffee-script, brunch
- a CouchDB (>=1.6) instance (on port 5984 for default config)
- an AWS account (Used to host images for the moment, but it might change soon. See the note below on how to get ride of this dependency in development)

```
git clone git@github.com:inventaire/inventaire.git
cd inventaire
npm install
npm run install-client
```

now, you need to create a ./config/local.coffee to override the default configuration in ./config/default.coffee:
```
module.exports =
  'key to override': 'your custom value'
```

All the default values can be kept, out of your CouchDB and AWS credentials that need to be customized by your own.

```
// in ./config/local.coffee
  ...
  db:
    ...
    username: 'your couchdb username'
    password: 'your couchdb password'
  ...
  aws:
    key: 'yoursettings'
    secret: 'yoursettings'
    region: 'yoursettings'
    bucket: 'yoursettings'
```

 AWS is used to stock user book's images, if you don't want to use an AWS account, you can send a PR to make ./server/lib/knox-client.coffee configurable: it should be possible to just save pictures to ./client/public/images in development. It might be easy to do, I just couldn't give it the time it needs yet.

Emails are disabled in default config to avoid having to configure that too for development.


##Day-dreaming on future evolutions

[Inventaire.io](https://inventaire.io) is a hub for open-knowledge-based peers inventory data. This prototype uses a centralized database to make the early development easier, while being as easy as possible to 'install' and use: well, it's just a "classic" social network. Meanwhile, this repository is public as there is no reason it should always stay centralized: this is a research work in progress, if you can think of a better/more decentralized way for peers to keep their inventory data and share it with others, you are very welcome to join the effort or experiment on your own with what you can find here. The hard point being sharing data between this centralized website and other inventory implementations. Works on a standard data model and an API would be a priority as soon as meaningful.

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
- [ExpressJs](http://expressjs.com/) within a light wrapper: [Americano](https://github.com/cozy/americano)
- [Bluebird](https://github.com/petkaantonov/bluebird) for promises
- [Lodash](http://lodash.com/) utils
- [node-config](https://github.com/lorenwest/node-config)


*find a more complete list of dependencies in the [package.json](https://github.com/inventaire/inventaire/blob/dev/package.json)*

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

*find a more complete list of dependencies in [package.json](https://github.com/inventaire/inventaire-client/blob/dev/package.json) and [bower.json](https://github.com/inventaire/inventaire-client/blob/dev/bower.json)*


## Contributors

<table><tbody>
<tr><th align="left">Maxime Lathuilière</th><td><a href="https://github.com/maxlath">GitHub/maxlath</a></td><td><a href="https://twitter.com/maxlath">Twitter/@maxlath</a></td></tr>
</tbody></table>


## License
[AGPL](LICENSE.md)
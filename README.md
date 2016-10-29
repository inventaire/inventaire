#Inventaire

Libre collaborative resource mapper powered by open-knowledge<br>
[![License](https://img.shields.io/badge/license-AGPL3-blue.svg)](http://www.gnu.org/licenses/agpl-3.0.html)
[![RoadMap](https://img.shields.io/badge/roadmap-contributive-blue.svg)](https://trello.com/b/0lKcsZDj/inventaire-roadmap)
[![Node](https://img.shields.io/badge/node->=v4-brightgreen.svg)](http://nodejs.org)
[![Code Climate](https://codeclimate.com/github/inventaire/inventaire/badges/gpa.svg)](https://codeclimate.com/github/inventaire/inventaire)<br>
Come to say hi on your prefered chat<br>
[![Join the chat at https://gitter.im/inventaire/inventaire](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/inventaire/inventaire)
[![IRC](https://img.shields.io/badge/irc-%23inventaire-orange.svg)](https://kiwiirc.com/client/irc.freenode.net/inventaire)

[![inventory-georges](http://maxlath.eu/slides/backbone-meetup/img/inventory-georges.png)](https://inventaire.io)

This repository hosts [Inventaire.io](https://inventaire.io) source code. Its a collaborative resources mapper project, while yet only focused on exploring books mapping with [wikidata](https://wikidata.org/) and [ISBNs](https://en.wikipedia.org/wiki/International_Standard_Book_Number)

This repository tracks the server-side developments, while the (heavy) [client-side can be found here](https://github.com/inventaire/inventaire-client). Client-related technical issues should go in the client repo, while this repo gathers all other technical issues. Non-technical discussions such as feature requests should preferably happen in the [Roadmap](https://trello.com/b/0lKcsZDj/inventaire-roadmap) Trello. In doubt, just use your best guess :)

## inventaire stack map
[![stack](https://raw.githubusercontent.com/inventaire/stack/master/snapshots/stack-from-server.png)](https://inventaire.github.io/stack/)

## Concepts map
the whole app turns around a few core concepts:
- Users
- Entities : encompass authors (ex: [wd:Q353](https://inventaire.io/entity/wd:Q535)), books (ex: [wd:Q393018](https://inventaire.io/entity/wd:Q393018)) and books' specific editions (ex: [isbn:9782070389162](https://inventaire.io/entity/isbn:9782070389162)). The term *entities* is inherited from wikidata terminology.
- Items : instances of book entities that a user declare to own. Can be an instance of a work or a specific edition of a work.
- Transactions : discussion between two users involving a specific item with an open transaction mode (giving, lending, selling). Transactions have effects on items: giving and selling an item make it move from the owner to the requester inventory; lending an item make it appear as unavailable.
- Groups: groups of users with one or more admins

![concepts map](https://raw.githubusercontent.com/inventaire/inventaire/master/docs/visualizations/concepts.jpg)

## Contribute
see [wiki](https://github.com/inventaire/inventaire/wiki) to get started, especially the [new contributors](https://github.com/inventaire/inventaire/wiki#new-contributors) section

## Installation

*see also*: [inventaire/inventaire-deploy](https://github.com/inventaire/inventaire-deploy)

General dependencies:
- git, node, npm, coffee-script, brunch (see package.json for versions)
- a CouchDB (>=1.6) instance (on port 5984 for default config)
  - you need an admin to be set, which can be done with this command:<br>
    `curl -XPUT http://localhost:5984/_config/admins/yourcouchdbusername -d '"'yourcouchdbpassword'"'`
- an Elasticsearch (>=2.4) instance (on port 9200 for default config)

```
git clone https://github.com/inventaire/inventaire.git
cd inventaire
npm install
npm run install-client
```

now, you need to create a ./config/local.coffee to override the default configuration in ./config/default.coffee:
```
module.exports =
  'key to override': 'your custom value'
```

All the default values can be kept, out of your CouchDB credentials that need to be customized by your own.

```
// in ./config/local.coffee
  ...
  db:
    ...
    username: 'yourcouchdbusername'
    password: 'yourcouchdbpassword'
  ...
```

Emails are disabled in default config to avoid having to configure that too for development.

## API
see wiki: [API](https://github.com/inventaire/inventaire/wiki/API)

## Day-dreaming on future evolutions

[Inventaire.io](https://inventaire.io) is a hub for open-knowledge-based peers inventory data. This prototype uses a centralized database to make the early development easier, while being as easy as possible to 'install' and use: well, it's just a "classic" social network. Meanwhile, this repository is public as there is no reason it should always stay centralized: this is a research work in progress, if you can think of a better/more decentralized way for peers to keep their inventory data and share it with others, you are very welcome to join the effort or experiment on your own with what you can find here. The hard point being sharing data between this centralized website and other inventory implementations. Works on a standard data model and an API would be a priority as soon as meaningful.

**Ideas for experimentations:**

- port to custom desktop clients using [node-webkit](https://github.com/nwjs/nw.js) or alike
- port to an app for personal cloud platforms: [Cozy](http://cozy.io), [OwnCloud](https://owncloud.org/)...
- server-less/P2P inventory sharing using WebRTC DataChannel / [WebTorrent](https://github.com/feross/webtorrent) / [IPFS](http://ipfs.io/) / [Ethereum](https://www.ethereum.org/) / you name it
- any other IndieWeb / [Unhosted](https://unhosted.org/) crazyness? :)

**Already experiementing**
- the [API](http://github.com/inventaire/inventaire/wiki/API) should allow a first level of decentralization: having personal clients allowing to manage an inventory out of inventaire.io but that could publish on inventaire.io what belongs there, public and semi public items, while keeping private items private.
*see [Labs settings](https://inventaire.io/settings/labs)*

## License
[AGPL](LICENSE.md)

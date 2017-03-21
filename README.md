#Inventaire

Libre collaborative resource mapper powered by open-knowledge<br>
[![License](https://img.shields.io/badge/license-AGPL3-blue.svg)](http://www.gnu.org/licenses/agpl-3.0.html)
[![RoadMap](https://img.shields.io/badge/roadmap-contributive-blue.svg)](https://trello.com/b/0lKcsZDj/inventaire-roadmap)
[![Node](https://img.shields.io/badge/node->=v4-brightgreen.svg)](http://nodejs.org)
[![Code Climate](https://codeclimate.com/github/inventaire/inventaire/badges/gpa.svg)](https://codeclimate.com/github/inventaire/inventaire)<br>
Come to say hi on your prefered chat<br>
[![Join the chat at https://gitter.im/inventaire/inventaire](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/inventaire/inventaire)
[![IRC](https://img.shields.io/badge/irc-%23inventaire-orange.svg)](https://kiwiirc.com/client/irc.freenode.net/inventaire)

[![inventory-georges](https://cloud.githubusercontent.com/assets/1596934/19841022/70efebce-9f03-11e6-97d2-a86162b59123.png)](https://inventaire.io)

This repository hosts [Inventaire.io](https://inventaire.io) source code. Its a collaborative resources mapper project, while yet only focused on exploring books mapping with [wikidata](https://wikidata.org/) and [ISBNs](https://en.wikipedia.org/wiki/International_Standard_Book_Number)

This repository tracks the server-side developments, while the (heavy) [client-side can be found here](https://github.com/inventaire/inventaire-client). Client-related technical issues should go in the client repo, while this repo gathers all other technical issues. Non-technical discussions such as feature requests should preferably happen in the [Roadmap](https://trello.com/b/0lKcsZDj/inventaire-roadmap) Trello. In doubt, just use your best guess :)

## Summary
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installation](#installation)
  - [Dependencies to install manually:](#dependencies-to-install-manually)
    - [Required dependencies](#required-dependencies)
    - [Dependencies with an easy/lazy alternative install option](#dependencies-with-an-easylazy-alternative-install-option)
    - [Dependency installation on Ubuntu 16.04](#dependency-installation-on-ubuntu-1604)
  - [Project development environment installation](#project-development-environment-installation)
  - [Installation tips](#installation-tips)
- [Inventaire stack map](#inventaire-stack-map)
- [Concepts map](#concepts-map)
- [Contribute](#contribute)
- [API](#api)
- [Day-dreaming on future evolutions](#day-dreaming-on-future-evolutions)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

> This is the installation documentation for a developement environment. For production setup, see: [inventaire-deploy](https://github.com/inventaire/inventaire-deploy)

### Dependencies to install manually:

#### Required dependencies
- [git](https://git-scm.com/), [curl](http://curl.haxx.se) (used in some installation scripts), [graphicsmagick](www.graphicsmagick.org/README.html) (used to resize images), [zsh](http://www.zsh.org/) (used in some scripts, no need to make it your default shell)
- [NodeJS](http://nodejs.org/) (>=6, [NVM](https://github.com/creationix/nvm) is a great way to install it)

#### Dependencies with an easy/lazy alternative install option
> In production, you definitly need those dependencies but to fastly get a working development environement and start coding, we got you covered: start by giving a shot to the normal install, but if anything goes wrong, go for the **Easy setup** instead of loosing time on installation issues.

- a [CouchDB](http://couchdb.apache.org/) (>=1.6) instance (on port 5984 for default config).<br>
  **Easy setup**: If for some reason installing CouchDB isn't straight forward (that is, more difficult than the `apt-get install couchdb` hereafter), you can use [`./scripts/easy_database_install`](https://github.com/inventaire/inventaire/blob/master/scripts/easy_database_install) to setup [pouchdb-server](https://github.com/pouchdb/pouchdb-server) as an easy substitute. The only usability downside is that you then need to start it manually: [`./scripts/easy_database_start`](https://github.com/inventaire/inventaire/blob/master/scripts/easy_database_start)
- an [ElasticSearch](https://www.elastic.co/fr/products/elasticsearch) (>=2.4) instance (on port 9200 for default config)<br>
  **Easy setup**: Elasticsearch is a heavy beast, implying installing a Java. If that's an issue, just go for the lazy option: don't install it! You will simply miss some search features.

#### Dependency installation on Ubuntu 16.04
To install those on Ubuntu that could give something like:
```sh
sudo add-apt-repository ppa:couchdb/stable -y
sudo apt-get update
sudo apt-get install git curl wget graphicsmagick zsh couchdb cowsay

# Install ElasticSearch and its main dependency: Java
# You might want to make sure that no previous version of Java is installed first as it might trigger version issues:
# ElasticSearch requires Java 8/Oracle JDK version 1.8. See https://www.elastic.co/guide/en/elasticsearch/reference/current/_installation.html
# (yes, piping a script to bash is a bad security habit, just as is executing anything on your machine coming from the wild and internet without checking what it does, but we trust this source. For the sake of good practices, you may want to read the script first though ;) )
curl https://raw.githubusercontent.com/inventaire/inventaire-deploy/d8c8bee46c241ceca0ddf3d9c319d84bfb0734d9/install_elasticsearch | bash

# Installing NodeJs and NPM using NVM, the Node Version Manager https://github.com/creationix/nvm
# (same remarque as above on piping a script)
curl https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash
exit
```
(reopen terminal)
```sh
# Check that the nvm command can be found
# If you get a 'command not found' error, check NVM documentation https://github.com/creationix/nvm#installation
nvm
nvm install 6
cowsay -f dragon "♫ ♪ copy/paste code, copy/paste code, the world is beautiful when all's in simple mode ♪ ♫"
```

### Project development environment installation
```sh
git clone https://github.com/inventaire/inventaire.git
cd inventaire
npm install
# If you haven't done it previously, set an admin on CouchDB and update ./config/local.coffee accordingly
curl -XPUT http://localhost:5984/_config/admins/yourcouchdbusername -d '"'yourcouchdbpassword'"'
```
We are all set! You can now start the server (in watch mode so that it reboots on file changes)
```sh
npm run watch
```
If you want to work on the client code, we also need to start Brunch in another terminal
```sh
cd client
npm run watch
```

### Installation tips
* To use executable that are used by the project (such as `coffee`, `mocha`,`couch2elastic4sync`), you can either find them in `./node_modules/.bin` or install them globally with npm: `npm install -g coffee-script mocha brunch bower supervisor` etc.
* If your computer has many CPU cores, you can make Brunch compile even faster by setting an environment variable: `BRUNCH_JOBS=4`

## Inventaire stack map
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

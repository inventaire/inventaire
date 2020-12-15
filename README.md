# Inventaire

Libre collaborative resource mapper powered by open-knowledge<br>
[![License](https://img.shields.io/badge/license-AGPL3-blue.svg)](http://www.gnu.org/licenses/agpl-3.0.html)
[![Node](https://img.shields.io/badge/node->=v4-brightgreen.svg)](http://nodejs.org)
[![Code Climate](https://codeclimate.com/github/inventaire/inventaire/badges/gpa.svg)](https://codeclimate.com/github/inventaire/inventaire)<br>
<br>
[![chat](https://img.shields.io/badge/chat-%23inventaire-ffd402.svg)](https://riot.im/app/#/room/#freenode_#inventaire:matrix.org)
[![general wiki](https://img.shields.io/badge/wiki-general-319cc2.svg)](https://wiki.inventaire.io)
[![technical wiki](https://img.shields.io/badge/wiki-technical-222222.svg)](http://github.com/inventaire/inventaire/wiki/)
[![roadmap](https://img.shields.io/badge/roadmap-contributive-4eba76.svg)](http://roadmap.inventaire.io)

[![inventory-graph](https://user-images.githubusercontent.com/1596934/35507755-1a159b62-04ee-11e8-8391-5808223caa51.png)](https://inventaire.io)

This repository hosts [Inventaire.io](https://inventaire.io) source code. Its a collaborative resources mapper project, while yet only focused on exploring books mapping with [wikidata](https://wikidata.org/) and [ISBNs](https://en.wikipedia.org/wiki/International_Standard_Book_Number)

This repository tracks the server-side developments, while the (heavy) [client-side can be found here](https://github.com/inventaire/inventaire-client). Client-related technical issues should go in the client repo, while this repo gathers all other technical issues. Non-technical discussions such as feature requests should preferably happen in the [roadmap](http://roadmap.inventaire.io). In doubt, just use your best guess or come ask on the chat :)

## Summary
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installation](#installation)
  - [Dependencies to install manually:](#dependencies-to-install-manually)
  - [Project development environment installation](#project-development-environment-installation)
  - [Installation tips](#installation-tips)
  - [Repositories and Branches](#repositories-and-branches)
    - [server](#server)
    - [client](#client)
    - [i18n](#i18n)
    - [deploy](#deploy)
    - [docker](#docker)
- [Inventaire stack map](#inventaire-stack-map)
- [Concepts map](#concepts-map)
- [Contribute](#contribute)
- [Documentation](#documentation)
- [API](#api)
- [Administration](#administration)
- [Day-dreaming on future evolutions](#day-dreaming-on-future-evolutions)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

*This is the installation documentation for a developement environment. For production setup, see*: [inventaire-deploy](https://github.com/inventaire/inventaire-deploy)

### Dependencies to install manually:
- [git](https://git-scm.com/), [curl](http://curl.haxx.se) (used in some installation scripts), [graphicsmagick](www.graphicsmagick.org/README.html) (used to resize images), [inotify-tools](https://github.com/rvoicilas/inotify-tools) (used in API tests scripts)
- [NodeJS](http://nodejs.org/) (>=6, recommended 12.2), [NVM](https://github.com/creationix/nvm) (allows great version update flexibility)
- a [CouchDB](http://couchdb.apache.org/) (>=1.6, recommended 1.7) instance (on port 5984 for default config)
- an [Elasticsearch](https://www.elastic.co/fr/products/elasticsearch) (>=7.9) instance (on port 9200 for default config)

To install those on Ubuntu that could give something like:
```sh
sudo add-apt-repository ppa:couchdb/stable -y
sudo apt-get update
sudo apt-get install git curl wget graphicsmagick couchdb inotify-tools

# Install Elasticsearch and its main dependency: Java
# You might want to make sure that no previous version of Java is installed first as it might trigger version issues:
# Elasticsearch requires Java 8/Oracle JDK version 1.8. See https://www.elastic.co/guide/en/elasticsearch/reference/current/_installation.html
# (yes, piping a script to bash is a bad security habit, just as is executing anything on your machine coming from the wild and internet without checking what it does, but we trust this source. For the sake of good practices, you may want to read the script first though ;) )
curl https://raw.githubusercontent.com/inventaire/inventaire-deploy/d8c8bee46c241ceca0ddf3d9c319d84bfb0734d9/install_elasticsearch | bash

# Installing NodeJs and NPM using NVM, the Node Version Manager https://github.com/creationix/nvm
# (see above text on piping a script)
curl https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash
exit
```
(reopen terminal)
```sh
# Check that the nvm command can be found
# If you get a 'command not found' error, check NVM documentation https://github.com/creationix/nvm#installation
nvm
nvm install 8
```

### Project development environment installation
```sh
git clone https://github.com/inventaire/inventaire.git
cd inventaire
npm install
# If you haven't done it previously, set an admin on CouchDB and update ./config/local.js accordingly
curl -XPUT http://localhost:5984/_config/admins/yourcouchdbusername -d '"'yourcouchdbpassword'"'
```
You are all set! You can now start the server (in watch mode so that it reboots on file changes)
```sh
npm run watch
```
If you want to work on the client code, you also need to start Brunch in another terminal
```sh
cd client
npm run watch
```

### Installation tips
* To use executable that are used by the project (such as `mocha`,`couch2elastic4sync`), you can either find them in `./node_modules/.bin` or install them globally with npm: `npm install -g mocha brunch bower supervisor` etc.
* If your computer has many CPU cores, you can make Brunch compile even faster by setting an environment variable: `BRUNCH_JOBS=4`

### Repositories and Branches

#### [server](http://github.com/inventaire/inventaire)
- [**master**](http://github.com/inventaire/inventaire/tree/master): the stable branch. Unstable work should happen in feature-specific branches and trigger pull requests when ready to be merged in master. See [Code Contributor Guidelines](https://github.com/inventaire/inventaire/wiki/Code-Contributor-Guidelines).

#### [client](http://github.com/inventaire/inventaire-client)
- [**master**](http://github.com/inventaire/inventaire-client/tree/master): the stable branch. Unstable work should happen in feature-specific branches and trigger pull requests when ready to be merged in master. See [Code Contributor Guidelines](https://github.com/inventaire/inventaire/wiki/Code-Contributor-Guidelines).

#### [i18n](http://github.com/inventaire/inventaire-i18n)
the repo tracking strings used in the client and emails in all the supported languages. For helping to translate, see [translate.inventaire.io](http://translate.inventaire.io)
- [**master**](http://github.com/inventaire/inventaire-i18n/tree/master): tracking translations fetched from the [translation tool](http://translate.inventaire.io) and build scripts
- [**dist**](http://github.com/inventaire/inventaire-i18n/tree/dist): same as master but with pre-built files

#### [deploy](http://github.com/inventaire/inventaire-deploy)
tracking installation scripts and documentation to run inventaire in production
- [**master**](http://github.com/inventaire/inventaire-deploy/tree/master): the main implementation targeting Ubuntu 16.04. Additional branches can be started to document installation on other environments

#### [docker](https://github.com/inventaire/docker-inventaire)
- [**master**](http://github.com/inventaire/docker-inventaire/tree/master): tracking docker installation files for development and testing use

## Inventaire stack map
[![stack](https://raw.githubusercontent.com/inventaire/stack/master/snapshots/stack-from-server.png)](https://inventaire.github.io/stack/)

## Concepts map
the app has a few core concepts:
- Users
- Entities : which can be authors (ex: [wd:Q353](https://inventaire.io/entity/wd:Q535)), books (ex: [wd:Q393018](https://inventaire.io/entity/wd:Q393018)) and books' specific editions (ex: [isbn:9782070389162](https://inventaire.io/entity/isbn:9782070389162)). The term *entities* comes from wikidata terminology. See the [entities map](https://inventaire.github.io/entities-map/).
- Items : instances of book entities that a user says they have. It can be an instance of a work or a specific edition of a work.
- Transactions : discussion between two users about a specific item with an open transaction mode (giving, lending, selling). Transactions have effects on items: giving and selling an item make it move from the owner to the requester inventory; lending an item shows it as unavailable.
- Groups: groups of users with one or more admins

![concepts map](https://raw.githubusercontent.com/inventaire/inventaire/master/docs/visualizations/concepts.jpg)

![entities map](https://raw.githubusercontent.com/inventaire/entities-map/master/screenshots/entities-map-2.png)

## Contribute
For code-related contributions, see the [repo wiki](https://github.com/inventaire/inventaire/wiki) to get started, especially the [new contributors](https://github.com/inventaire/inventaire/wiki#new-contributors) section.
For a more general introduction to contribution, see [*How to contribute* on wiki.inventaire.io](https://wiki.inventaire.io/wiki/How-to-contribute).

## Documentation
see [docs](https://github.com/inventaire/inventaire/tree/master/docs/)

## Wiki
see [wiki.inventaire.io](http://wiki.inventaire.io)
You may want to directly go to the [technical wiki page](https://wiki.inventaire.io/wiki/Technic)

## API
see wiki: [API](https://github.com/inventaire/inventaire/wiki/API)

## Administration
see [Administration](./docs/administration.md)

## Day-dreaming on future evolutions

[Inventaire.io](https://inventaire.io) is a hub for open-knowledge-based peers inventory data. This prototype uses a centralized database to make the early development easier, while being as easy as possible to 'install' and use: well, it's just a "classic" social network. Meanwhile, this repository is public as there is no reason it should always stay centralized: this is a research work in progress, if you can think of a better/more decentralized way for peers to keep their inventory data and share it with others, you are very welcome to join the effort or experiment on your own with what you can find here. The hard point being sharing data between this centralized website and other inventory implementations. Works on a standard data model and an API would be a priority as soon as meaningful.

**Ideas for experimentations:**

- port to custom desktop clients using [node-webkit](https://github.com/nwjs/nw.js) or alike
- port to an app for personal cloud platforms: [Cozy](http://cozy.io), [NextCloud](https://nextcloud.org/)...
- server-less/P2P inventory sharing using WebRTC DataChannel / [WebTorrent](https://github.com/feross/webtorrent) / [IPFS](http://ipfs.io/) / [Ethereum](https://www.ethereum.org/) / [OpenBazaar](https://www.openbazaar.org) / [Scuttlebot](https://scuttlebot.io) / you name it
- any other IndieWeb / [Unhosted](https://unhosted.org/) crazyness? :)

**Already experiementing**
- the [API](http://github.com/inventaire/inventaire/wiki/API) should allow a first level of decentralization: having personal clients allowing to manage an inventory out of inventaire.io but that could publish on inventaire.io what belongs there, public and semi public items, while keeping private items private.
*see [Labs settings](https://inventaire.io/settings/labs)*

## License
[AGPL](LICENSE)

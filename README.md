# Inventaire

Libre collaborative resource mapper powered by open-knowledge<br>
[![License](https://img.shields.io/badge/license-AGPL3-blue.svg)](http://www.gnu.org/licenses/agpl-3.0.html)
[![Node](https://img.shields.io/badge/node->=v4-brightgreen.svg)](http://nodejs.org)
[![Code Climate](https://codeclimate.com/github/inventaire/inventaire/badges/gpa.svg)](https://codeclimate.com/github/inventaire/inventaire)<br>
<br>
[![chat](https://img.shields.io/badge/chat-%23inventaire-ffd402.svg)](https://riot.im/app/#/room/#freenode_#inventaire:matrix.org)
[![wiki](https://img.shields.io/badge/wiki-general-319cc2.svg)](https://wiki.inventaire.io)
[![roadmap](https://img.shields.io/badge/roadmap-contributive-4eba76.svg)](http://roadmap.inventaire.io)

[![inventory-graph](https://user-images.githubusercontent.com/1596934/35507755-1a159b62-04ee-11e8-8391-5808223caa51.png)](https://inventaire.io)

This repository hosts [Inventaire.io](https://inventaire.io) source code. Its a collaborative resources mapper project, while yet only focused on exploring books mapping with [wikidata](https://wikidata.org/) and [ISBNs](https://en.wikipedia.org/wiki/International_Standard_Book_Number)

This repository tracks the server-side developments, while the (heavy) [client-side can be found here](https://github.com/inventaire/inventaire-client). Client-related technical issues should go in the client repo, while this repo gathers all other technical issues. Non-technical discussions such as feature requests should preferably happen in the [roadmap](http://roadmap.inventaire.io). In doubt, just use your best guess or come ask on the chat :)

## Summary
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
  - [Dependencies to install manually](#dependencies-to-install-manually)
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
- [Wiki](#wiki)
- [API](#api)
- [Administration](#administration)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

*This is the installation documentation for a developement environment. For production setup, see*: [inventaire-deploy](https://github.com/inventaire/inventaire-deploy)

### Dependencies to install manually
- [git](https://git-scm.com/), [curl](http://curl.haxx.se) (used in some installation scripts), [graphicsmagick](www.graphicsmagick.org/README.html) (used to resize images), [inotify-tools](https://github.com/rvoicilas/inotify-tools) (used in API tests scripts):
- [NodeJS](http://nodejs.org/) (>=8, using the latest LTS is recommended), [NVM](https://github.com/creationix/nvm) (allows greater version update flexibility)
- a [CouchDB](http://couchdb.apache.org/) (>=3.1) instance (on port 5984 for default config)
- an [Elasticsearch](https://www.elastic.co/fr/products/elasticsearch) (>=7.10) instance (on port 9200 for default config)

To install all this those dependneices on Ubuntu 20.04:

For packages available in Ubuntu default repositories:
```sh
sudo apt-get update
sudo apt-get install git curl wget graphicsmagick inotify-tools
```
For packages that need a more elaborated installation, see their own documentation:
* [Install NodeJS latest LTS via NVM](https://github.com/nvm-sh/nvm#installing-and-updating)
* [Install CouchDB](https://docs.couchdb.org/en/stable/install/unix.html)
* [Install ElasticSearch](https://www.elastic.co/guide/en/elasticsearch/reference/7.10/deb.html)

### Project development environment installation
```sh
git clone https://github.com/inventaire/inventaire.git
cd inventaire
npm install
```

This should have installed:
- the server (this git repository) in the current directory
- the client ([inventaire-client](https://github.com/inventaire/inventaire-client)) in the `client` directory
- i18n strings ([inventaire-i18n](https://github.com/inventaire/inventaire-i18n)) in the `inventaire-i18n` directory

This should also have created a `./config/local.js` file, in which you can override all present in `./config/default.js`: make sure to set `db` `username` and `password` to your CouchDB username and password.

And now you should be all set! You can now start the server (on port `3006` by default)
```sh
# Starting the server in watch mode so that it reboots on file changes
npm run watch
```
If you want to work on the [client](https://github.com/inventaire/inventaire-client), you need to start the webpack watcher and dev server (on port `3005` by default)
```sh
# In another terminal
cd inventaire/client
npm run watch
```

### Installation tips
* To use executable that are used by the project (such as `mocha`), you can either find them in `./node_modules/.bin` or install them globally with npm: `npm install -g mocha supervisor lev2` etc.

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
For code-related contributions, see [*How to contribute* on wiki.inventaire.io](https://wiki.inventaire.io/wiki/Technic#How_to_contribute).

## Documentation
see [docs](https://github.com/inventaire/inventaire/tree/master/docs/)

## Wiki
see [wiki.inventaire.io](http://wiki.inventaire.io)
You may want to directly go to the [technical wiki page](https://wiki.inventaire.io/wiki/Technic)

## API
see wiki: [API](https://wiki.inventaire.io/wiki/Technic#About_the_API)

## Administration
see [Administration](./docs/administration.md)

## License
[AGPL](LICENSE)

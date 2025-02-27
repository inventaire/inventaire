# Install for Debian based systems

## Dependencies

```sh
apt-get install curl git nginx graphicsmagick openssl inotify-tools software-properties-common -y
```

and optionnaly:

```sh
apt-get install fail2ban build-essential zsh
```

## Node

Follow the [official NVM install](https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script) documentation.

Once installed, you may install a version of node defined in `package.json`

```json
"engines": {
  "node": ">= 18"
},
```

ie. `nvm install 20`

Once node is installed (check with command `node -v`), install global dependencies:

```sh
npm install -g --production lev2 couchdb-bulk2
```

## Couchdb

See https://git.inventaire.io/inventaire/docs/installation/install_couchdb.md

## Elasticsearch

See https://git.inventaire.io/inventaire/docs/installation/install_elasticsearch.md

## Inventaire

```sh
git clone http://github.com/inventaire/inventaire
cd inventaire
npm install --production
```

You also may setup the root folder variable:

```sh
PROJECT_ROOT=$PWD
```

## Reverse proxy

See https://git.inventaire.io/inventaire/docs/installation/install_reverse_proxy.md

## Usage

Run the app:

```sh
$(which node) $(pwd)/server/server.js
```

If you feel like setup systemd configuration, you may check : https://git.inventaire.io/inventaire-deploy/install_inventaire

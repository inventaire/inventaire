# Setup reverse proxy

The only offical documentation is with Ngnix.


## Prerequisites

- Having Nginx and openssl installed
- Some knowledge about how to setup this software

## Configure

### Download templates

You may prefer to setup a "light" Nginx setup done for the Docker repository.

```sh
wget https://git.inventaire.io/docker-inventaire/blob/main/nginx/templates/default.conf.template
```

(for information, inventaire.io is using a more complicated version available in the [inventaire-deploy](https://github.com/inventaire/inventaire-deploy/blob/main/nginx/inventaire.original.nginx) repository.)

Add the snippets:

```sh
wget https://raw.githubusercontent.com/inventaire/inventaire-deploy/refs/heads/main/nginx/security_headers.conf
wget https://raw.githubusercontent.com/inventaire/inventaire-deploy/refs/heads/main/nginx/ssl.conf
cp ssl.conf security_headers.conf /etc/nginx/snippets
```

### Setup the environment variables

```sh
DOMAIN_NAME=your-domain-name.org
```

Check that `PROJECT_ROOT` has already been set:

```sh
echo $PROJECT_ROOT
```

### Generate the Nginx file

```sh
cat default.conf.template |
 sed "s@PROJECT_ROOT@$PROJECT_ROOT@g" |
 sed "s@DOMAIN_NAME@$DOMAIN_NAME@g" > /etc/nginx/sites-enabled/default
```

### Other dependencies

Generate dhparam.pem file

```sh
openssl dhparam -out /etc/nginx/dhparam.pem 2048
```


```sh
mkdir -p /tmp/nginx/tmp /tmp/nginx/resize/img/users /tmp/nginx/resize/img/groups /tmp/nginx/resize/img/entities /tmp/nginx/resize/img/remote /tmp/nginx/resize/img/assets
```

Reload nginx

```sh
sudo nginx -s reload
```

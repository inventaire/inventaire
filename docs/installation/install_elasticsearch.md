# Setup elasticsearch on Debian based systems

## Install

Inventaire does not use the lastest version of elasticsearch, please make sure of which version to install, by checking what the team is using to develop locally in the [docker-compose file](https://github.com/inventaire/docker-inventaire/main/tree/docker-compose.yml).

After checking which version to install, follow the official install guide. ie. for version 7.16: https://www.elastic.co/guide/en/elasticsearch/reference/7.16/install-elasticsearch.html

## Configure

You may use systemd to restart on failure

See:
  - https://github.com/elastic/elasticsearch/issues/25425
  - https://github.com/elastic/puppet-elasticsearch/pull/870
  - https://www.digitalocean.com/community/tutorials/understanding-systemd-units-and-unit-files

```sh
sudo mkdir -p /etc/systemd/system/elasticsearch.service.d
echo '
[Unit]
StartLimitInterval=200
StartLimitBurst=5

[Service]
Restart=always
RestartSec=3
Environment=ES_JAVA_OPTS="-Xms2g -Xmx2g"
' | sudo tee /etc/systemd/system/elasticsearch.service.d/override.conf
```

## Start ElasticSearch at startup

```sh
sudo systemctl daemon-reload
sudo systemctl enable elasticsearch
sudo systemctl start elasticsearch
```

## Disabling GeoIP

See https://www.elastic.co/guide/en/elasticsearch/reference/current/geoip-processor.html
and https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-update-settings.html


```sh
curl -H 'content-type: application/json' -XPUT "http://localhost:9200/_cluster/settings" -d '{
  "persistent" : {
    "ingest.geoip.downloader.enabled" : false
  }
}'
```

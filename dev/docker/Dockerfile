FROM node:10

ENV BIND_HOST=0.0.0.0 ELASTICSEARCH_HOST=elasticsearch ELASTICSEARCH_PORT=9200 REDIS_HOST=redis REDIS_PORT=6379 REDIS_DB=0 PM2_ARGS=--no-daemon VS_ENV=prod

WORKDIR /var/www

COPY . .

RUN apt update && apt install -y git \
  && yarn install

COPY dev/docker/vue-storefront-api.sh /usr/local/bin/

ENTRYPOINT ["vue-storefront-api.sh"]

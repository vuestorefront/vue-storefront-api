FROM node:8-alpine

ENV VS_ENV prod

WORKDIR /var/www

RUN apk add --no-cache imagemagick

COPY package.json ./

RUN apk add --no-cache --virtual .build-deps ca-certificates wget git && \
    yarn install --no-cache && \
    apk del .build-deps

COPY docker/vue-storefront-api/vue-storefront-api.sh /usr/local/bin/

CMD ["vue-storefront-api.sh"]

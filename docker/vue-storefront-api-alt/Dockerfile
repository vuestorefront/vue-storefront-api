FROM node:10-alpine

ENV VS_ENV prod

WORKDIR /var/www

RUN apk add --no-cache curl git

RUN apk add --no-cache --virtual .build-deps ca-certificates wget && \
  apk del .build-deps

COPY package.json ./
COPY yarn.lock ./
RUN yarn install

COPY var /var/www/var
COPY scripts /var/www/scripts
COPY migrations /var/www/migrations
COPY babel.config.js /var/www/babel.config.js
COPY nodemon.json /var/www/nodemon.json
COPY tsconfig.json /var/www/tsconfig.json
COPY ecosystem.json /var/www/ecosystem.json
COPY src /var/www/src

RUN yarn install
RUN yarn build

EXPOSE 8080

COPY docker/vue-storefront-api-alt/healthcheck.js /usr/local/bin/
HEALTHCHECK CMD node /usr/local/bin/healthcheck.js || exit 1
COPY docker/vue-storefront-api-alt/vue-storefront-api.sh /usr/local/bin/

CMD ["vue-storefront-api.sh"]

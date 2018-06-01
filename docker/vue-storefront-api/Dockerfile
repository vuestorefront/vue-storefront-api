FROM node:8-alpine

ARG REPO_TAG
ENV REPO_TAG ${REPO_TAG:-master}

ENV VS_ENV prod

WORKDIR /var/www

RUN apk add --no-cache --virtual .build-deps ca-certificates wget git \
  && wget https://raw.githubusercontent.com/DivanteLtd/vue-storefront-api/$REPO_TAG/package.json \
  && yarn install --no-cache \
  && apk del .build-deps

COPY vue-storefront-api.sh /usr/local/bin/

CMD ["vue-storefront-api.sh"]

#!/bin/sh
set -e
if [ "$VS_ENV" = 'dev' ]; then
  #yarn install || exit $?
  yarn dev
else
  if [ "$API_MODE" = 'api' ]; then
    yarn ts-node /var/www/dist/src/index.js
  elif [ "$API_MODE" = 'o2m' ]; then
    yarn ts-node /var/www/dist/src/worker/order_to_magento2.js start
  else
    yarn start
  fi
fi

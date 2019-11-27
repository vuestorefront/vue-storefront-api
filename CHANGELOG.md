# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.11.0-rc.2] - unreleased

### Fixed

- Fixed some smaller issues with graphql so that it is now working again with the fronted - #350


## [1.11.0-rc.1] - 2019.10.03

### Added
- Experimental Elastic 7 support - @pkarw (#342)
- Output cache support with tagging and cache invalidate requests forwarding - @pkarw @resubaka (https://github.com/DivanteLtd/vue-storefront/issues/3367, #333)
- Constant for Mailchimp subscription status - @KonstantinSoelch (#294)
- mage2vs import now has optional `--generate-unique-url-keys` parameter which defaults to `false` to enable/disable the url key generation with name and id for categories - @rain2o (#232)
- `extensions/elastic-stock` module added which is a drop-in replacement for `stock`; the difference is that it's getting the stock information from Elastic, not from e-Commerce backend directly; to use it - please just make sure your `config/local.json` file has `elastic-stock` in the `registeredExtensions` collection; then please make sure in the `vue-storefront` to change the `config.stock.ednpoint`  from `http://<your-api-host>/api/stock` to `http://<your-api-host>/api/ext/elastic-stock`
- Added eslint config from vue-storefront so we have the same config and in both repos typescript support - @resubaka (#320)
- Added jest support - @resubaka (#321)
- Added caching factory and action factory for the image endpoint. This gives the possibility to use other services for caching or image processing - @resubaka (#317, #315)
- Added support for tax calculation where the values from customer_tax_class_ids is used - @resubaka (#307)
- The `db` context object - passed to every api endpoint now has two usefull methods: `getElasticClient` and `getRedisClient` for accesing the data stores - @pkarw (#328)
- The `lib/utils` got two new methods `getStoreCode(req: Express.Request)` and `getStoreView(code: string)` for getting the current multistore context from `vue-storefront` frontend requests - @pkarw

### Removed
- The `scripts/seo.js` tool has been removed, the legacy `migrations` scripts have been removed, the unused legacy extensions (`gls-parcelshop-dk`, `postnord-parcelshop-dk`) - @pkarw (#342)

### Fixed
- The way Elastic and Redis clients have been fixed and code duplication removed across the app - @pkarw (#327)
- The `product.price_*` fields have been normalized with the backward compatibility support (see `config.tax.deprecatedPriceFieldsSupport` which is by default true) - @pkarw (#289)
- The `product.final_price` field is now being taken into product price calcualtion. Moreover, we've added the `config.tax.finalPriceIncludesTax` - which is set to `true` by default. All the `price`, `original_price` and `special_price` fields are calculated accordingly. It was required as Magento2 uses `final_price` to set the catalog pricing rules after-prices - @pkarw (#289)
- Force ES connections to use protocol config option - @cewald (#303, #304)
- Better handling of HTTP error codes provided by API client - #3151

### Changed
- Error responses for mailchimp - @andrzejewsky (#3337)
- Replaced function arguments to object destructuring in `calculateProductTax` - @andrzejewsky (#3337)
- Refactor `taxcalc.js` similar to frontend - @gibkigonzo (#356)

## [1.10.0] - 2019.08.12

### Added
- Typescript support - @ResuBaka (#210, #242)
- Multi Stock Inventory (Magento MSI) support - @aleron75, @dimasch (#226)
- Import of magento 2 cms pages and blocks to the full import - @toh82 (#235)
- Information about magento 2 cms pages and blocks import to the readme - @toh82 (#235)
- Introduce orderNumber to order creation endpoint - @Flyingmana (#251)
- Optional Redis Auth functionality. - @rain2o (#267)
- Extensions have ability to modify Elasticsearch results. - @grimasod (#269)
- Refactored Travis build config - @Tjitse-E (#273)
- Multistore support for `magento1`-platform using `magento1-vsbridge` - @cewald (#276)
- Support self signed certificates - @lukeromanowicz (#287)

### Changed
- Sharp dependency has been updated. *It might require reinstalling yarn dependencies* - @lukeromanowicz
- Replaced index property value `not_analyzed` with `true` for `options` field in attribute schema - @adityasharma7 (#334)

### Fixed
- Missing `res` and `req` parameters are now passed to ProductProcessor - @jahvi (#218)
- Moving of graphql files to the dist folder - @ResuBaka (#242)
- Moving of schema files to the dist folder - @ResuBaka (#244)
- Missing assetPath config for magento1 - @ResuBaka (#245)
- New payload for magento1 stock check endpoint - @cewald (#261)
- `yarn dev:inspect` command and extract nodemon config to nodemon.json - @Tjitse-E, @cewald (#272, #279)
- Include Magento Currency Code in mage2vs import and productsdelta if available - @rain2o (#281)
- Better handling of HTTP error codes provided by API client - @pkarw (#3151)

## [1.9.6] - 2019.07.11
- Dependencies update to avoid lodash security issues.

## [1.9.5] - 2019.06.17
- Dependencies update to avoid js-yaml security issues.

## [1.9.4] - 2019.06.03
- Extension schemas in `src/models` are not required anymore - @EmilsM, @lukeromanowicz (#259, #263)

## [1.9.3] - 2019.05.27
- Change min postal code length in user profile to 3 so it's sames as in orders - @lukeromanowicz (#253)

## [1.9.2] - 2019.05.20
- Fix failing o2m when parsing order schema - @lukeromanowicz (#248)

## [1.9.1] - 2019.05.10
- Mount ElasticSearch data to `docker/elasticsearch/data` directory - @dimasch, @lukeromanowicz (#237, #241)
- Fix product schema and importer in migration process - @lukeromanowicz (#239)

## [1.9.0] - 2019.05.06
- Changed location of magento1 platform js client. Moved from `src/platform/magento1/module` to [magento1-vsbridge-client](https://github.com/DivanteLtd/magento1-vsbridge-client) - @mtarld (#195)
- Update Babel from 6 to 7 - @lukeromanowicz (#202)
- Support unicode characters in order requests - @lukeromanowicz (#201)
- TravisCI configured for building and linting - @lukeromanowicz (#204)
- Use Redis database from configuration in mage2vs - @Cyclonecode (#211)
- Requests with invalid body result in HTTP code 400 instead of 500 - @AndreiBelokopytov (#220)
- `src/models/order.schema.json` was moved to `src/models/order.schema.js` to support regex transformation - @lukeromanowicz (#201)

## [1.8.4] - 2019.04.17
- Use encrypted token for user authentication - @pkarw (#215)

## [1.8.3] - 2019.03.05
- Use store id from configuration in `mage2vs import` - @boehsermoe (#179)

## [1.8.2] - 2019.03.04
- Magento 1 bridge client - @afirlejczyk (#190)
- configurable ElasticSearch `apiVersion` - @Resubaka (#192)

## [1.8.1] - 2019.02.11
- Fixed `apiVersion` property for ElasticSearch driver - now it's available thru `config/*.json` - @mdanilowicz (#185)

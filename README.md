REST API backend for vue-storefront
===================================

This is a backend service for [vue-storefront](https://github.com/DivanteLtd/vue-storefront). Provides data access to product catalog (via ElasticSearch) and allows users to place orders into order queue (by default it's Redis queue supported via kqueue library).

## Installation

**Warm up ElasticSearch and Redis**
`docker up`

**Import product catalog**
Product catalog is imported using [elasticdump](https://www.npmjs.com/package/elasticdump), which is installed automatically via project dependency. The default ElasticSearch index name is: `vue_storefront_catalog`

`npm run restore`

It restores JSON documents stored in `./var/catalog.json`. The oposite command - used to generate `catalog.json` file from runing ElasticSearch cluster:

`npm run dump`

**Run development server**
Code autoreload is enabled along with eslint, babel support.

`PORT=8080 npm run dev`

## API access
Catalog API calls are compliant with ElasticSearch (it works like a filtering proxy to ES). More on ES queries: [ElasticSearch queries tutorial](http://okfnlabs.org/blog/2013/07/01/elasticsearch-query-tutorial.html)

Elastic search endpoint: `http://localhost:8080/api/search/<INDEX_NAME>/`. You can run the following command to check if everything is up and runing (it assumes `vue_storefront_catalog` as default index name):

`curl -i http://localhost:8080/api/search/vue_storefront_catalog/_search?query=*`

## Data formats
This backend is using ElasticSearch data formats popularized by [ElasticSuite for Magento2 by Smile.fr](https://github.com/Smile-SA/elasticsuite).

* [Product model](./src/models/catalog-category.md)
* [Category model](./src/models/catalog-product.md)

License
-------

MIT

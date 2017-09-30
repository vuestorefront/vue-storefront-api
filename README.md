REST API backend for vue-storefront
===================================

This is a backend service for [vue-storefront](https://github.com/DivanteLtd/vue-storefront). Provides data access to product catalog (via ElasticSearch) and allows users to place orders into order queue (by default it's Redis queue supported via kqueue library).

## Vue Storefront

Vue Storefront is a standalone PWA storefront for your eCommerce, possible to connect with any eCommerce backend (eg. Magento, Prestashop or Shopware) through the API.

Vue Storefront is and always will be in the open source. Anyone can use and support the project, we want it to be a tool for the improvement of the shopping experience. The project is still in the prove of concept phase. We are looking for Contributors and Designer willing to help us the the solution development.

Vue Storefront was build as a all-in-one front-end for eCommerce. For providing the best performance we decided to use Vue.js as a front-end library, Node.js + Express (and maybe GraphQL support) as a server-API, Elastic Search as a database of products and full PWA/off-line support.
Here you can read more about the proof of concept for [Vue Storefront connected with Magento2](https://www.linkedin.com/pulse/magento2-nosql-database-pwa-support-piotr-karwatka).

Besides a big improvement for the shopping experience, we also want to create a great code base for every developer who needs to work on a front-end application for the eCommerce.


## Installation

**Warm up ElasticSearch and Redis**
`docker-compose up`

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

Elastic search endpoint: `http://localhost:8080/api/catalog/search/<INDEX_NAME>/`. You can run the following command to check if everything is up and runing (it assumes `vue_storefront_catalog` as default index name):

`curl -i http://localhost:8080/api/search/vue_storefront_catalog/_search?query=*`

## Data formats
This backend is using ElasticSearch data formats popularized by [ElasticSuite for Magento2 by Smile.fr](https://github.com/Smile-SA/elasticsuite).

* [Product model](./src/models/catalog-category.md)
* [Category model](./src/models/catalog-product.md)

License
-------

MIT

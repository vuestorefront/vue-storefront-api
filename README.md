REST API backend for vue-storefront
===================================

# Install dependencies
npm install

# Start development live-reload server
PORT=8080 npm run dev

# Start production server:
PORT=8080 npm start

# Example API Call for product search:
http://localhost:8080/api/catalog/_search?query=search%20query

Catalog API calls are compliant with ElasticSearch (it works like a filtering proxy to ES). More on ES queries: (ElasticSearch queries tutorial)[http://okfnlabs.org/blog/2013/07/01/elasticsearch-query-tutorial.html]

License
-------

MIT

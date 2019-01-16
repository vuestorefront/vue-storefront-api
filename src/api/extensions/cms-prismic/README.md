# Prismic Api Module

This API extension 
1. get data from prismic repository  
2. Saving this data to Elastic Search and uses Elastic Search data layer (you can switch it off in configs `useElasticSearchLayer`) 
3. Listen to Prismic webhooks, on api change updates 3 lately published pages (you can switch it off in configs `useElasticSearchLayer`) 
4. Provides methods to modify the Prismic content on return

# Installation
In your `config/local.json` file you should register the extension:
`"registeredExtensions": ["cms-prismic"],`

and also add your prismic API config: 
  `
  "prismic": {
    "apiEndpoint": "https://publicrepo.prismic.io/api/v2",
    "useElasticSearchLayer": true,
    "webhook": {
      "secretKey": "<< your secret >>"
    }
  }
  `
Make sure that you have installed `prismic-javascript` npm module 
`npm install prismic-javascript --save`

**To switch off Elastic Search layer** and stop to listen to Prismic weebhooks 
in config file set `useElasticSearchLayer` to false.

# GET /api/ext/cms-prismic/index/

**GET parameters** 
1. id - id from Prismic. 
`/api/ext/cms-prismic/index/?id=W1G4GxEAACIAdKrj` 
-> will search for document with id W1G4GxEAACIAdKrj

2. type - type from Prismic, type of document
`/api/ext/cms-prismic/index/?type=cms_page` 
-> will search for documents with type cms_page 
**NOTE**, if you want to use searching by `type` with Elastic Search Layer on,
then use `node src/api/extensions/cms-prismic/scripts/prismic.js fetch` command in console to fetch and save Prismic data 

3. tag - Prismic document tag
**NOTE**, if you want to use searching by `tag` with Elastic Search Layer on,
then use `node src/api/extensions/cms-prismic/scripts/prismic.js fetch` command in console to fetch and save Prismic data 

4. index_name - use if you have multiple indexes in ElasticSearch (for different languages). By default module uses:
`vue_storefront_catalog` (from config, first of elasticsearch.indices)

5. filter - use filter with given name

6. filter_option - use with `filter`, passing parameter to filters 

**Example response**
```
{
  "code":200,
  "result":
  {
    "prismic_content":[{"image":{"dimensions":{"width":1920,"height":350},"alt":null ...
  }
}
```

# POST /api/ext/cms-prismic/webhook/
listens to Prismic webhooks.

To listen to Prismic webhooks:
1. set up webhook on your Prismic repo (Look on Prismic docs: [https://user-guides.prismic.io/webhooks/webhooks])
2. Use url: <your domain>/api/ext/cms-prismic/webhook/
3. Paste your secret token to config/local.json


# Ideas for use
Imagine that you want to promote your 'New product' on some landing page, or anywhere on your store.
You have multiple documents in prismic, with many types like 'banner', 'promotion_text', 'countdown' etc. containing information about 'New product'
So give them new, common tag like 'new-product' and fetch your data like this:
http://localhost:8080/api/ext/cms-prismic/index/?tag=new-product

You want to manage menu using prismic, so copy id of this document
http://localhost:8080/api/ext/cms-prismic/index/?id=W-G4GxEAACIAdKrj

Using types, for example fetch all social media data
http://localhost:8080/api/ext/cms-prismic/index/?type=social_media

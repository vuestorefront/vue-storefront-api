# Magento 2 cms data extension

This API extension get data from cms page and cms static block your Magento 2 instance.
It use `snowdog/module-cms-api` composer module so you have to install it in your Magento instance.

in your `local.json` file you should register the extension:
`"registeredExtensions": ["mailchimp-subscribe", "example-magento-api", "cms-data"],`

The API endpoitns are:
```
/api/ext/cms-data/cmsPage/:id
/api/ext/cms-data/cmsBlock/:id
```

where `:id` is an id of page or block

# ICMAA - Headless cms data extension

This API extension get data from headless cms of choice.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-cms", …],`

2. Add the configs to your `local.json`:
   ```json
   "extensions": {
     …
     "icmaaCms": {
       "service": "prismic", // prismic | storyblok
       "prismic": {
         "apiEndpoint": "https://YOUR-ENDPOINT.cdn.prismic.io/api/v2",
         "apiToken": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
         "fallbackLanguage": "de-de"
       },
       "storyblok": {
         "accessToken": "XXXXXXXXXXXXXXXXXXXXXXXX"
       }
    }
  },
   ```

## API endpoints
```
/api/ext/icmaa-cms/by-uid?uid=navigation-main&type=block&lang=de-de
/api/ext/icmaa-cms/search?type=block&lang=de-de&q={"identifier":%20{"in":%20"navigation-meta,navigation-main"}}
```

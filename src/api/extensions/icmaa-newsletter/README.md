# ICMAA - Newsletter data extension

This API extension gets subscriber information from a custom `vsf-bridge` endpoint in Magento.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-newsletter", …],`
2. Change the original endpoint of VSF in `local.json` to:
   ```
   "newsletter": {
     "endpoint": "/api/ext/icmaa-newsletter/subscribe"
   }
   ```

## API endpoints
```
/api/ext/icmaa-newsletter/subscribe
```

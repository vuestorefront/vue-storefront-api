# ICMAA - Review data extension

This API extension add Magento1 actions for a custom `vsf-bridge` endpoint in Magento.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-review", …],`
2. Change the original endpoint of VSF in `local.json` to:
   ```
   "review": {
     "create_endpoint": "/api/ext/icmaa-review/create"
   }
   ```

## API endpoints
```
/api/ext/icmaa-review/create
```

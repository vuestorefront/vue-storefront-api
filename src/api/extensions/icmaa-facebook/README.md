# ICMAA - Facebook data extension

This API extension gets data from our custom Facebook-Login endpoints of the `vsf-bridge` in Magento.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-facebook", …],`
2. Add the endpoint of VSF in `local.json` to:
   ```
   "icmaa_facebook": {
    "endpoint": "/api/ext/icmaa-facebook",
    ...
   }
   ```

## API endpoints
```
/api/ext/icmaa-facebook/login
```

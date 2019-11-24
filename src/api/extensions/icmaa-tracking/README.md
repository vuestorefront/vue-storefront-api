# ICMAA - Order tracking data extension

This API extension add Magento1 actions for a custom `vsf-bridge` endpoint in Magento.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-tracking", …],`
2. Change the original endpoint of VSF in `local.json` to:
   ```
   "icmaa_tracking": {
     "endpoint": "/api/ext/icmaa-tracking"
   }
   ```

## API endpoints
```
/api/ext/icmaa-tracking
```

# ICMAA - Product alert data extension

This API extension add Magento1 actions for a custom `vsf-bridge` endpoint in Magento.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-product-alert", …],`
2. Add the endpoint of VSF in `local.json` to:
   ```
   "icmaa_product_alert": {
    "endpoint": "/api/ext/icmaa-product-alert",
    ...
   }
   ```

## API endpoints
```
/api/ext/icmaa-product-alert/stock
```

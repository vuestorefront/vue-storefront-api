# ICMAA - GiftCert extension

This API extension add Magento1 actions for a custom `vsf-bridge` endpoint in Magento.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-giftcert", …],`
2. Change the original endpoint of VSF in `local.json` to:
   ```
   "icmaa_giftcert": {
     "endpoint": "/api/ext/icmaa-giftcert"
   }
   ```

## API endpoints
```
/api/ext/icmaa-giftcert
```

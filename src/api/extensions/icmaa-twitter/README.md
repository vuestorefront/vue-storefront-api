# ICMAA - Twitter data extension

This API extension gets data from Twitter API

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-twitter", …],`

2. Add the configs to your `local.json`:
   ```json
   "extensions": {
     …
     "icmaaTwitter": {
       "clientId": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
       "secretId": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    }
  },
   ```

## API endpoints
```
/api/ext/icmaa-twitter/feed/USERACCOUNT
```

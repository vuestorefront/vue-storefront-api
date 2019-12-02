# ICMAA - Competitions API extension

This API extension add support for out competition forms.

It checks if the entered captcha is valid and saves the submitted data into a google sheet.

## Google-API

We are using the [Google API NodeJS Client](https://github.com/googleapis/google-api-nodejs-client) to connect to the Google-Sheets API.
See their samples to get to know more about authorization and sheet traversing.

For authentitation we are using OAUTH2 and  a service-account – see the [docs for more details](https://cloud.google.com/iam/docs/service-accounts?hl=de). Because our Google account is limited to its domain (for security reasons) we need to use [domain-wide authority to the service account](https://developers.google.com/identity/protocols/OAuth2ServiceAccount#delegatingauthority). This needs to be setup with an admin of this account.  
This is neccessary to be able to share documents to our service-account or let it create own documents like it is a real user.

## Configuration

1. In your `local.json` file you should register the extension like:
   `"registeredExtensions": ["icmaa-competitions", …],`
2. Add your Google Service-Account credentials as JSON to your `local.json` like:
   ```
    "icmaa": {
    "googleServiceAccount": {
      "type": "service_account",
      "project_id": "XXXXXXXXXXXXX",
      "private_key_id": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "private_key": "...",
      "client_email": "sample@projektid.iam.gserviceaccount.com",
      "client_id": "XXXXXXXXXXXXXXXXXXXXX",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/smaple%projektid.iam.gserviceaccount.com"
    }
   },
   ```
3. Change the original endpoint of VSF in `local.json` to:
   ```
   "icmaa_competitions": {
     "endpoint": "/api/ext/icmaa-competitions"
   }
   ```

## API endpoints
```
/api/ext/icmaa-competitions/form
```

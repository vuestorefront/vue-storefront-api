# ICMAA - Mailer API extension

This API extension add mail support for our forms and other email use cases.
It should send an email string to a specific email address.

We are using a new endpoint based onto the `/api/ext/mail-service/send-email` one of the `mail-service` module and extend it by using GoogleReCaptcha and an optional IP lock using Redis.

## Configuration

1. In your `local.json` file you should register the extension like `"registeredExtensions": ["icmaa-mailer", …],` and disable the original mailer `mail-service` to prevent sending emails without using captcha over the old endpoint.
1. Add your SMTP credentials to your `local.json` like:
   ```
   "extensions": {
     "icmaa-mailer": {
       "transport": {
         "host": "smtp.gmail.com",
         "port": 465,
         "secure": true,
         "user": "vuestorefront",
         "pass": "vuestorefront.io"
       },
       "targetAddressWhitelist": ["contributors@vuestorefront.io"],
       "secretString": "__THIS_IS_SO_SECRET__"
     }
   }
   ```
2. Change the original endpoint of VSF in `local.json` to the new ones of our modules:
   ```
   "mailer": {
     "endpoint": {
       "send": "/api/ext/icmaa-mailer/send-email",
       "token": "/api/ext/icmaa-mailer/get-token"
     }
   }
   ```

## API endpoints
```
/api/ext/icmaa-mailer/send-email
/api/ext/icmaa-mailer/get-token
```

Order model
=============

Orders are queued - the format is very similar to the original Magento2 json format for the following API method:

```
curl -g -X POST "/rest/V1/guest-carts/56241bf6bc084cd7589426c8754fc9c5/shipping-information" \
```

The difference is that for vue-storefront order format MUST be 100% self-sufficient. So we merged the cart items reference from:

```
curl -g -X GET "/rest/V1/guest-carts/e3e1fd447e0e315dd761942cf949ce5d/items" 
```

So the format is as following:

```json
{
    "items": [
        {
        "item_id": 100,
        "sku": "abc-1",
        "qty": 1,
        "name": "Product one",
        "price": 19,
        "product_type": "simple",
        "quote_id": "e3e1fd447e0e315dd761942cf949ce5d"
        },
        {
        "item_id": 101,
        "sku": "abc-2",
        "qty": 1,
        "name": "Product two",
        "price": 54,
        "product_type": "simple",
        "quote_id": "e3e1fd447e0e315dd761942cf949ce5d"
        }
    ], 
    "addressInformation": {
        "shippingAddress": {
            "region": "MH",
            "region_id": 0,
            "country_id": "PL",
            "street": [
                "Street name line no 1",
                "Street name line no 2"
            ],
            "company": "Company name",
            "telephone": "0048 123 123 123",
            "postcode": "00123",
            "city": "Cityname",
            "firstname": "John ",
            "lastname": "Doe",
            "email": "john@doe.com",
            "region_code": "MH",
            "sameAsBilling": 1
        },
        "billingAddress": {
            "region": "MH",
            "region_id": 0,
            "country_id": "PL",
            "street": [
                "Street name line no 1",
                "Street name line no 2"
            ],
            "company": "abc",
            "telephone": "1111111",
            "postcode": "00123",
            "city": "Mumbai",
            "firstname": "Sameer",
            "lastname": "Sawant",
            "email": "john@doe.com",
            "prefix": "address_",
            "region_code": "MH"
        },
        "shipping_method_code": "flatrate",
        "shipping_carrier_code": "flatrate",
        "payment_method_code": "flatrate"
    }
}
 ```
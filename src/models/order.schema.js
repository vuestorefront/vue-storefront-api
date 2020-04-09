exports.default = {
  additionalProperties: false,
  required: [
    'products',
    'addressInformation'
  ],
  properties: {
    order_id: {
      type: 'string'
    },
    created_at: {
      type: 'string'
    },
    updated_at: {
      type: 'string'
    },
    transmited: {
      type: 'boolean'
    },
    transmited_at: {
      type: 'string'
    },
    status: {
      type: 'string'
    },
    state: {
      type: 'string'
    },
    user_id: {
      type: 'string'
    },
    cart_id: {
      type: 'string'
    },
    store_code: {
      type: 'string'
    },
    store_id: {
      type: 'number'
    },
    products: {
      description: 'Products list',
      type: 'array',
      minItems: 1,
      items: [
        {
          required: [
            'sku',
            'price',
            'qty'
          ],
          properties: {
            sku: {
              type: 'string',
              minLength: 1,
              regexp: /[\p{L}\d_]+/u
            },
            qty: {
              type: 'number',
              minimum: 1
            },
            name: {
              type: 'string',
              minLength: 1,
              regexp: /[\p{L}\d_]+/u
            },
            price: {
              type: 'number',
              minimum: 1
            },
            product_type: {
              type: 'string',
              minLength: 1,
              regexp: /[\p{L}]+/u
            }
          }
        }
      ]
    },
    addressInformation: {
      properties: {
        shippingAddress: {
          required: [
            'street',
            'city',
            'postcode',
            'firstname',
            'lastname'
          ],
          properties: {
            region: {
              type: 'string'
            },
            region_id: {
              type: 'number'
            },
            country_id: {
              type: 'string',
              pattern: '[a-zA-Z]'
            },
            street: {
              description: 'Street name',
              minItems: 1,
              items: {
                minLength: 1,
                description: 'Street name'
              }
            },
            company: {
              type: 'string'
            },
            telephone: {
              type: 'string'
            },
            postcode: {
              type: 'string',
              minLength: 3,
              regexp: /[\p{L}\d_]+/u
            },
            city: {
              type: 'string',
              regexp: /[\p{L}]+/u
            },
            firstname: {
              type: 'string',
              regexp: /[\p{L}]+/u,
              description: 'First name'
            },
            lastname: {
              type: 'string',
              regexp: /[\p{L}]+/u,
              description: 'Last name'
            },
            email: {
              type: 'string',
              pattern: '[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?'
            },
            region_code: {
              type: 'string'
            },
            sameAsBilling: {
              type: 'number'
            },
            save_address: {
              type: 'number'
            }
          }
        },
        billingAddress: {
          required: [
            'street',
            'city',
            'postcode',
            'firstname',
            'lastname'
          ],
          properties: {
            properties: {
              region: {
                type: 'string'
              },
              region_id: {
                type: 'number'
              },
              country_id: {
                type: 'string',
                pattern: '[a-zA-Z]'
              },
              street: {
                minItems: 1,
                items: {
                  minLength: 1
                }
              },
              company: {
                type: 'string'
              },
              telephone: {
                type: 'string'
              },
              postcode: {
                type: 'string',
                minLength: 3,
                regexp: /[\p{L}\d_]+/u
              },
              city: {
                type: 'string',
                regexp: /[\p{L}]+/u
              },
              firstname: {
                type: 'string',
                regexp: /[\p{L}]+/u,
                description: 'First name'
              },
              lastname: {
                type: 'string',
                regexp: /[\p{L}]+/u,
                description: 'Last name'
              },
              email: {
                type: 'string',
                pattern: '[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?'
              },
              region_code: {
                type: 'string'
              },
              sameAsBilling: {
                type: 'number'
              },
              save_address: {
                type: 'number'
              }
            }
          }
        },
        shipping_method_code: {
          type: 'string',
          pattern: '[a-zA-Z]+'
        },
        shipping_carrier_code: {
          type: 'string',
          pattern: '[a-zA-Z]+'
        },
        payment_method_code: {
          type: 'string',
          pattern: '[a-zA-Z]+'
        },
        payment_method_additional: {}
      }
    }
  }
}

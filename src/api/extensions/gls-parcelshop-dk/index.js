import {apiStatus} from '../../../lib/util';
import {Router} from 'express';

const request = require('request');

module.exports = ({config, db}) => {
    let glsApi = Router();

    glsApi.get('/zipcode/:zipcode', (req, res) => {
        if (req.params.zipcode.length != 4) {
            return apiStatus(res, {error: 'Invalild zipcode length.'}, 200)
        }

        let returnData = {};

        returnData.extraFields = {
            pickup_name: {
                title: "Name of person who will pick up the package",
                required: true
            }
        }
        returnData.droppoints = []

        // pass the request to elasticsearch
        const url = 'http://' + config.elasticsearch.host + ':' + config.elasticsearch.port + '/gls_parcelshop_dk/droppoint/_search';

        request({ // do the elasticsearch request
            uri: url,
            method: 'POST',
            body: {
                "query": {
                    "term": {
                        "ZipCode": {
                            "value": req.params.zipcode
                        }
                    }
                }
            },
            json: true,
            auth: {
                user: config.elasticsearch.user,
                pass: config.elasticsearch.password
            },
        }, function (_err, _res, _resBody) {
            if (_resBody && _resBody.hits && _resBody.hits.hits) {
                let latitude = 0;
                let longitude = 0;

                const results = _resBody.hits.hits
                let length = 0

                for (let i = 0; i < results.length; i++) {
                    const droppoint = results[i]._source

                    returnData.droppoints.push({
                        id: droppoint.Number,
                        name: droppoint.CompanyName,
                        streetname: droppoint.Streetname,
                        streetname2: droppoint.Streetname2,
                        zipcode: droppoint.ZipCode,
                        country: droppoint.CountryCodeISO3166A2,
                        city: droppoint.CityName,
                        icon: {url: 'assets/gls.png'},
                        position: {
                            lat: parseFloat(droppoint.Latitude),
                            lng: parseFloat(droppoint.Longitude)
                        }
                    })

                    longitude += parseFloat(droppoint.Longitude)
                    latitude += parseFloat(droppoint.Latitude)
                    length = i + 1
                }

                returnData.center = {
                    position: {
                        lat: parseFloat(latitude) / length,
                        lng: parseFloat(longitude) / length
                    }
                }

                return apiStatus(res, returnData, 200)
            }

            return apiStatus(res, {error: 'Invalid zipcode.'}, 200)
        })
    })

    return glsApi
}

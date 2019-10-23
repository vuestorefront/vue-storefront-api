import {apiStatus} from '../../../lib/util';
import {Router} from 'express';

const {Magento2Client} = require('magento2-rest-client');

interface MagentoRestResponseInterface {
}

interface CmsRestInterface {
  getPage: (id: string|number) => Promise<MagentoRestResponseInterface>,
  getBlock: (id: string|number) => Promise<MagentoRestResponseInterface>,
  getPageIdentifier: (identifier: string, storeId: string) => Promise<MagentoRestResponseInterface>,
  getBlockIdentifier: (identifier: string, storeId: string) => Promise<MagentoRestResponseInterface>
}

module.exports = ({config, db}) => {
  let cmsApi = Router();

  const client = Magento2Client(config.magento2.api);

  client.addMethods('cmsData', (restClient) => {
    return {
      getPage: function (id: string|number) {
        return restClient.get(`/snowdog/cmsPage/${id}`);
      },
      getBlock: function (id: string|number) {
        return restClient.get(`/snowdog/cmsBlock/${id}`);
      },
      getPageIdentifier: function (identifier: string, storeId: string) {
        return restClient.get(`/snowdog/cmsPageIdentifier/${identifier}/storeId/${storeId}`);
      },
      getBlockIdentifier: function (identifier: string, storeId: string) {
        return restClient.get(`/snowdog/cmsBlockIdentifier/${identifier}/storeId/${storeId}`);
      }
    };
  });

  cmsApi.get('/cmsPage/:id', (req, res) => {
    client.cmsData.getPage(req.params.id)
      .then((result) => {
        // just dump it to the browser, result = JSON object
        apiStatus(res, result, 200);
      })
      .catch(err => {
        apiStatus(res, err, 500);
      })
  });

  cmsApi.get('/cmsBlock/:id', (req, res) => {
    client.cmsData.getBlock(req.params.id)
      .then((result) => {
        // just dump it to the browser, result = JSON object
        apiStatus(res, result, 200);
      })
      .catch(err => {
        apiStatus(res, err, 500);
      })
  });

  cmsApi.get('/cmsPageIdentifier/:identifier/storeId/:storeId', (req, res) => {
    client.cmsData.getPageIdentifier(req.params.identifier, req.params.storeId)
      .then((result) => {
        // just dump it to the browser, result = JSON object
        apiStatus(res, result, 200);
      })
      .catch(err => {
        apiStatus(res, err, 500);
      })
  });

  cmsApi.get('/cmsBlockIdentifier/:identifier/storeId/:storeId', (req, res) => {
    client.cmsData.getBlockIdentifier(req.params.identifier, req.params.storeId)
      .then((result) => {
        // just dump it to the browser, result = JSON object
        apiStatus(res, result, 200);
      })
      .catch(err => {
        apiStatus(res, err, 500);
      })
  });

  return cmsApi
};

import {apiStatus} from '../../../lib/util';
import {Router} from 'express';

const Magento2Client = require('magento2-rest-client').Magento2Client;

interface MagentoRestResponseInterface {
}

interface CmsRestInterface {
  getPage: () => Promise<MagentoRestResponseInterface>,
  getBlock: () => Promise<MagentoRestResponseInterface>,
  getPageIdentifier: () => Promise<MagentoRestResponseInterface>,
  getBlockIdentifier: () => Promise<MagentoRestResponseInterface>
}

module.exports = ({config, db}) => {
  let cmsApi = Router();

  cmsApi.get('/cmsPage/:id', (req, res) => {
    const client = Magento2Client(config.magento2.api);

    client.addMethods('cmsPage', (restClient) => {
      return {
        getPage: function () {
          return restClient.get('/snowdog/cmsPage/' + req.params.id);
        }
      };
    });

    client.cmsPage.getPage()
      .then((result) => {
        apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
      })
      .catch(err => {
        apiStatus(res, err, 500);
      })
  });

  cmsApi.get('/cmsBlock/:id', (req, res) => {
    const client = Magento2Client(config.magento2.api);
    client.addMethods('cmsBlock', (restClient) => {
      return {
        getBlock: function () {
          return restClient.get('/snowdog/cmsBlock/' + req.params.id);
        }
      }
    });

    client.cmsBlock.getBlock()
      .then((result) => {
        apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
      })
      .catch(err => {
        apiStatus(res, err, 500);
      })
  });

  cmsApi.get('/cmsPageIdentifier/:identifier/storeId/:storeId', (req, res) => {
    const client = Magento2Client(config.magento2.api);
    client.addMethods('cmsPageIdentifier', (restClient) => {
      return {
        getPageIdentifier: function () {
          return restClient.get(`/snowdog/cmsPageIdentifier/${req.params.identifier}/storeId/${req.params.storeId}`);
        }
      };
    });

    client.cmsPageIdentifier.getPageIdentifier()
      .then((result) => {
        apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
      })
      .catch(err => {
        apiStatus(res, err, 500);
      })
  });

  cmsApi.get('/cmsBlockIdentifier/:identifier/storeId/:storeId', (req, res) => {
    const client = Magento2Client(config.magento2.api);
    client.addMethods('cmsBlockIdentifier', (restClient) => {
      return {
        getBlockIdentifier: function () {
          return restClient.get(`/snowdog/cmsBlockIdentifier/${req.params.identifier}/storeId/${req.params.storeId}`);
        }
      };
    });

    client.cmsBlockIdentifier.getBlockIdentifier()
      .then((result) => {
        apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
      })
      .catch(err => {
        apiStatus(res, err, 500);
      })
  });

  return cmsApi
};

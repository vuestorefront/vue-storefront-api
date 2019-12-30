import { Router } from 'express';
import createMapRoute from './map';

module.exports = ({ config }) => {
  const router = Router()

  router.use('/map', createMapRoute({ config }))

  return router
}

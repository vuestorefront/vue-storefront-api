import { Router } from 'express';
import createMapRoute from './map';

const url = ({ config }) => {
  const router = Router()

  router.use('/map', createMapRoute({ config }))

  return router
}

export default url

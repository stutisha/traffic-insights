
import { Router } from 'express';
import {
  getCountries,
  getCountryTraffic,
  getCountryTrend,
  getVehicleMix,
  getVehicleTrend,
  getYears,
} from './traffic.controller';

const router = Router();

router.get('/years', getYears);
router.get('/countries', getCountries);
router.get('/by-country', getCountryTraffic);
router.get('/by-vehicle', getVehicleMix);
router.get('/country-trend', getCountryTrend);
router.get('/vehicle-trend', getVehicleTrend);

export default router;

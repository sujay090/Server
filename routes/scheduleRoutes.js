import express from 'express';
import {
  createSchedule,
  getScheduleByCustomer,
  getAllSchedules,
  updateSchedule,
  deleteSchedule,
} from '../controllers/scheduleController.js';

const router = express.Router();

router.post('/create', createSchedule);
router.get('/customer/:customerId', getScheduleByCustomer);
router.get('/', getAllSchedules);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;


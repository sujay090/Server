import express from 'express';
import {
  createSchedule,
  getScheduleByCustomer,
  getAllSchedules,  // Import this handler
  deleteSchedule,
} from '../controllers/scheduleController.js';

const router = express.Router();

router.post('/create', createSchedule);
router.get('/customer/:customerId', getScheduleByCustomer);

// ADD THIS:
router.get('/', getAllSchedules);

router.delete('/:id', deleteSchedule);

export default router;


import express from 'express';
import multer from 'multer';
import {
  addCustomer,
  editCustomer,
  deleteCustomer,
  getAllCustomers
} from '../controllers/customerController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/add', upload.single('logo'), addCustomer);
router.put('/edit/:id', upload.single('logo'), editCustomer);
router.delete('/:id', deleteCustomer);
router.get('/', getAllCustomers);

export default router;

import Poster from '../models/Poster.js';
import Customer from '../models/Customer.js';
import Schedule from '../models/Schedule.js';

export const getDashboardData = async (req, res) => {
  try {
    const posters = await Poster.countDocuments();
    const customers = await Customer.countDocuments();
    const scheduled = await Schedule.countDocuments();

    res.json({ posters, customers, scheduled });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
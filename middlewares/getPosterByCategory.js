import Poster from '../models/Poster.js';

export const getPosterByCategory = async (req, res, next) => {
  try {
    const { category } = req.body;
    if (!category) return res.status(400).json({ message: 'Category is required' });

    const poster = await Poster.findOne({ category }).sort({ createdAt: -1 });
    if (!poster) return res.status(404).json({ message: 'No poster found for this category' });

    req.posterData = {
      originalImagePath: poster.originalImagePath,
      placeholders: poster.placeholders,
      posterDoc: poster,
    };
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error fetching poster by category' });
  }
};

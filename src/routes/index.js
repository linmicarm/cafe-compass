import { Router } from 'express';
import { listCafes, getCafe, addReview } from '../controllers/cafes.js';
import {
  listCollections, getCollection, addCafeToCollection,
} from '../controllers/collections.js';
import { listVibes } from '../controllers/vibes.js';

const router = Router();

// Cafés
router.get('/cafes', listCafes);
router.get('/cafes/:id', getCafe);
router.post('/cafes/:id/reviews', addReview);

// Collections
router.get('/collections', listCollections);
router.get('/collections/:id', getCollection);
router.post('/collections/:id/cafes', addCafeToCollection);

// Vibes (filter metadata)
router.get('/vibes', listVibes);

export default router;

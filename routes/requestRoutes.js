import express from 'express';
import {
	createRequest,
	getNearbyRequests,
	getRequestById,
	acceptRequest,
	completeRequest,
} from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(createRequest);
router.route('/nearby').get(getNearbyRequests);
router.route('/:id').get(protect, getRequestById);
router.route('/:id/accept').post(protect, acceptRequest);
router.route('/:id/complete').post(protect, completeRequest);

export default router;

import express from 'express';
import {
	createRequest,
	getNearbyRequests,
	getMyRequests,
	getMyDonations,
	getRequestById,
	acceptRequest,
	cancelAcceptedRequest,
	completeRequest,
} from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createRequest);
router.route('/nearby').get(protect, getNearbyRequests);
router.route('/mine').get(protect, getMyRequests);
router.route('/my-donations').get(protect, getMyDonations);
router.route('/:id').get(protect, getRequestById);
router.route('/:id/accept').post(protect, acceptRequest);
router.route('/:id/cancel').post(protect, cancelAcceptedRequest);
router.route('/:id/complete').post(protect, completeRequest);

export default router;

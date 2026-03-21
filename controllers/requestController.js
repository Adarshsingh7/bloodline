import asyncHandler from 'express-async-handler';
import BloodRequest from '../models/BloodRequest.js';
import User from '../models/User.js';

const requestPopulation = [
	{ path: 'patient', select: 'name phone email bloodGroup' },
	{ path: 'acceptedBy', select: 'name phone email bloodGroup' },
];

const findRequestById = async (id) =>
	BloodRequest.findById(id).populate(requestPopulation);

// @desc    Create a new blood request
// @route   POST /api/requests
// @access  Private
const createRequest = asyncHandler(async (req, res) => {
	const { bloodGroup, units, hospital, note, longitude, latitude } = req.body;

	if (!bloodGroup || !hospital || longitude == null || latitude == null) {
		res.status(400);
		throw new Error(
			'Please provide blood group, hospital, longitude and latitude',
		);
	}

	const request = new BloodRequest({
		patient: req.user._id,
		patientName: req.user.name,
		bloodGroup,
		units: Number(units) || 1,
		hospital,
		note,
		location: {
			type: 'Point',
			coordinates: [Number(longitude), Number(latitude)],
		},
		status: 'pending',
	});

	const createdRequest = await request.save();
	const populatedRequest = await findRequestById(createdRequest._id);
	res.status(201).json(populatedRequest);
});

// @desc    Get all active blood requests for the map
// @route   GET /api/requests/nearby
// @access  Private
const getNearbyRequests = asyncHandler(async (req, res) => {
	const requests = await BloodRequest.find({
		status: { $in: ['pending', 'accepted'] },
		'location.coordinates.0': { $exists: true, $ne: null },
		'location.coordinates.1': { $exists: true, $ne: null },
	})
		.populate(requestPopulation)
		.sort({ createdAt: -1 });

	res.json(requests);
});

// @desc    Get current user's blood requests
// @route   GET /api/requests/mine
// @access  Private
const getMyRequests = asyncHandler(async (req, res) => {
	const requests = await BloodRequest.find({ patient: req.user._id })
		.populate(requestPopulation)
		.sort({ createdAt: -1 });

	res.json(requests);
});

// @desc    Get current user's donation activity
// @route   GET /api/requests/my-donations
// @access  Private
const getMyDonations = asyncHandler(async (req, res) => {
	const donations = await BloodRequest.find({
		acceptedBy: req.user._id,
		status: { $in: ['accepted', 'completed'] },
	})
		.populate(requestPopulation)
		.sort({ acceptedAt: -1, completedAt: -1, updatedAt: -1 });

	res.json(donations);
});

// @desc    Get blood request by ID
// @route   GET /api/requests/:id
// @access  Private
const getRequestById = asyncHandler(async (req, res) => {
	const request = await BloodRequest.findById(req.params.id)
		.populate('patient', 'name phone email')
		.populate('acceptedBy', 'name phone email');

	if (!request) {
		res.status(404);
		throw new Error('Request not found');
	}

	res.json(request);
});

// @desc    Accept a blood request
// @route   POST /api/requests/:id/accept
// @access  Private
const acceptRequest = asyncHandler(async (req, res) => {
	const request = await BloodRequest.findById(req.params.id);

	if (!request) {
		res.status(404);
		throw new Error('Request not found');
	}

	if (request.status !== 'pending') {
		res.status(400);
		throw new Error('Request is already accepted or completed');
	}

	if (request.patient.toString() === req.user._id.toString()) {
		res.status(400);
		throw new Error('You cannot accept your own request');
	}

	request.status = 'accepted';
	request.acceptedBy = req.user._id;
	request.acceptedAt = new Date();
	request.completedAt = undefined;

	await request.save();
	const updatedRequest = await findRequestById(request._id);
	res.json(updatedRequest);
});

// @desc    Cancel an accepted donor for a request
// @route   POST /api/requests/:id/cancel
// @access  Private
const cancelAcceptedRequest = asyncHandler(async (req, res) => {
	const request = await BloodRequest.findById(req.params.id);

	if (!request) {
		res.status(404);
		throw new Error('Request not found');
	}

	if (request.patient.toString() !== req.user._id.toString()) {
		res.status(401);
		throw new Error('Only the patient can cancel this donor');
	}

	if (request.status !== 'accepted') {
		res.status(400);
		throw new Error('Only accepted requests can be cancelled');
	}

	request.status = 'pending';
	request.acceptedBy = undefined;
	request.acceptedAt = undefined;
	request.completedAt = undefined;

	await request.save();
	const updatedRequest = await findRequestById(request._id);
	res.json(updatedRequest);
});

// @desc    Complete a blood request
// @route   POST /api/requests/:id/complete
// @access  Private
const completeRequest = asyncHandler(async (req, res) => {
	const request = await BloodRequest.findById(req.params.id);

	if (!request) {
		res.status(404);
		throw new Error('Request not found');
	}

	if (request.patient.toString() !== req.user._id.toString()) {
		res.status(401);
		throw new Error(
			'Not authorized. Only the patient can approve blood received',
		);
	}

	if (request.status !== 'accepted' || !request.acceptedBy) {
		res.status(400);
		throw new Error('Only accepted requests can be approved');
	}

	request.status = 'completed';
	request.completedAt = new Date();

	await request.save();

	await User.findByIdAndUpdate(request.acceptedBy, {
		lastDonationDate: request.completedAt,
	});

	const updatedRequest = await findRequestById(request._id);
	res.json(updatedRequest);
});

export {
	createRequest,
	getNearbyRequests,
	getMyRequests,
	getMyDonations,
	getRequestById,
	acceptRequest,
	cancelAcceptedRequest,
	completeRequest,
};

import asyncHandler from "express-async-handler";
import BloodRequest from "../models/BloodRequest.js";

// @desc    Create a new blood request
// @route   POST /api/requests
// @access  Private
const createRequest = asyncHandler(async (req, res) => {
  const { bloodGroup, units, hospital, note, longitude, latitude } = req.body;

  const request = new BloodRequest({
    patient: req.user._id,
    patientName: req.user.name,
    bloodGroup,
    units,
    hospital,
    note,
    location: {
      type: "Point",
      coordinates: [Number(longitude), Number(latitude)],
    },
    status: "pending",
  });

  const createdRequest = await request.save();
  res.status(201).json(createdRequest);
});

// @desc    Get nearby blood requests
// @route   GET /api/requests/nearby
// @access  Private
const getNearbyRequests = asyncHandler(async (req, res) => {
  const { longitude, latitude, maxDistance = 50000 } = req.query; // maxDistance in meters (50km)

  if (!longitude || !latitude) {
    res.status(400);
    throw new Error("Please provide longitude and latitude");
  }

  const requests = await BloodRequest.find({
    status: "pending",
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
        $maxDistance: Number(maxDistance),
      },
    },
  }).populate("patient", "name phone");

  res.json(requests);
});

// @desc    Get blood request by ID
// @route   GET /api/requests/:id
// @access  Private
const getRequestById = asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.id).populate(
    "patient",
    "name phone email"
  ).populate("acceptedBy", "name phone email");

  if (request) {
    res.json(request);
  } else {
    res.status(404);
    throw new Error("Request not found");
  }
});

// @desc    Accept a blood request
// @route   POST /api/requests/:id/accept
// @access  Private
const acceptRequest = asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.id);

  if (request) {
    if (request.status !== "pending") {
      res.status(400);
      throw new Error("Request is already accepted or completed");
    }

    if (request.patient.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error("You cannot accept your own request");
    }

    request.status = "accepted";
    request.acceptedBy = req.user._id;

    const updatedRequest = await request.save();
    res.json(updatedRequest);
  } else {
    res.status(404);
    throw new Error("Request not found");
  }
});

// @desc    Complete a blood request
// @route   POST /api/requests/:id/complete
// @access  Private
const completeRequest = asyncHandler(async (req, res) => {
  const request = await BloodRequest.findById(req.params.id);

  if (request) {
    if (request.patient.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error("Not authorized. Only the patient can complete the request");
    }

    request.status = "completed";

    const updatedRequest = await request.save();
    res.json(updatedRequest);
  } else {
    res.status(404);
    throw new Error("Request not found");
  }
});

export {
  createRequest,
  getNearbyRequests,
  getRequestById,
  acceptRequest,
  completeRequest,
};

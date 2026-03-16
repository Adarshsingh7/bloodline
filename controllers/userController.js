import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// @desc    Get user profile
// @route   GET /api/users/me
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bloodGroup: user.bloodGroup,
      location: user.location,
      lastDonationDate: user.lastDonationDate,
      isAvailable: user.isAvailable,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Update user location
// @route   PATCH /api/users/location
// @access  Private
const updateUserLocation = asyncHandler(async (req, res) => {
  const { longitude, latitude } = req.body;

  const user = await User.findById(req.user._id);

  if (user) {
    user.location = {
      type: "Point",
      coordinates: [Number(longitude), Number(latitude)],
    };

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      location: updatedUser.location,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export { getUserProfile, updateUserLocation };

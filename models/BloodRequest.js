import mongoose from "mongoose";

const requestSchema = mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    patientName: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    units: { type: Number, required: true },
    hospital: { type: String, required: true },
    note: { type: String },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed"],
      default: "pending",
    },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

requestSchema.index({ location: "2dsphere" });

const BloodRequest = mongoose.model("BloodRequest", requestSchema);

export default BloodRequest;

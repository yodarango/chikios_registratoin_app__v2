import mongoose from "mongoose";
const { Schema } = mongoose;

const KidSchema = new Schema({
  first_name: {
    type: String,
    required: true,
    maxLength: 140,
    lowercase: true,
  },
  last_name: {
    type: String,
    required: true,
    maxLength: 140,
    lowercase: true,
  },
  age: {
    type: Number,
    requird: true,
  },
  gender: {
    type: String,
    required: true,
    maxLength: 8,
    lowercase: true,
  },
  guardian_first_name: {
    type: String,
    required: true,
    maxLength: 140,
    lowercase: true,
  },
  guardian_last_name: {
    type: String,
    required: true,
    maxLength: 140,
    lowercase: true,
  },
  guardian_phone_number: {
    type: String,
    required: true,
    maxLength: 14,
    lowercase: true,
  },
  profile_picture: {
    type: String,
    required: true,
  },
  created: {
    type: Date,
    default: new Date(),
    required: true,
  },
  changed_at: {
    type: Date,
    default: new Date(),
    required: true,
  },
  checked_in: {
    type: Boolean,
    required: true,
  },
});

export const Kid = mongoose.model("Kid", KidSchema);

import mongoose from "mongoose";
const { Schema } = mongoose;

const organizationSchema = new Schema({
  username: {
    type: String,
    required: true,
    lowercase: true,
  },
  admin_email: {
    type: String,
    required: true,
    lowercase: true,
  },
  admin_password: {
    type: String,
    required: true,
  },
  admin_first_name: {
    type: String,
    required: true,
    lowercase: true,
  },
  admin_last_name: {
    type: String,
    required: true,
    lowercase: true,
  },
  other_users: {
    type: [String],
    required: false,
    default: [],
  },
});

export const Organization = mongoose.model("Organization", organizationSchema);

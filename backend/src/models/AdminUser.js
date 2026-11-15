import mongoose from "mongoose";

// Ordered from most to least privileged.
export const ROLES = ["owner", "admin", "editor", "sales", "viewer"];

const adminUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 60 },
    name: { type: String, default: "", maxlength: 120 },
    email: { type: String, default: "", lowercase: true, maxlength: 200 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "viewer" },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    // Incremented to revoke every session issued for this user.
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.AdminUser || mongoose.model("AdminUser", adminUserSchema);

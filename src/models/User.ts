import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import type { Role } from "@/types";

export interface IUserDocument extends Document {
  email: string;
  password: string;
  name: string;
  role: Role;
  organizationId: mongoose.Types.ObjectId;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(jwtTimestamp: number): boolean;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries by default
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "manager", "staff"],
      default: "staff",
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ organizationId: 1, role: 1 });
UserSchema.index({ organizationId: 1, isActive: 1 });

// ─── Password Hashing Middleware ──────────────────────────────────────────────
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date(Date.now() - 1000); // Ensure JWT issued after
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.changedPasswordAfter = function (
  jwtTimestamp: number
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

const User: Model<IUserDocument> =
  mongoose.models.User ||
  mongoose.model<IUserDocument>("User", UserSchema);

export default User;

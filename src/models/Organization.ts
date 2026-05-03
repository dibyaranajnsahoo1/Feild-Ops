import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrganizationDocument extends Document {
  name: string;
  slug: string;
  logo?: string;
  plan: "free" | "pro" | "enterprise";
  settings: {
    allowSelfRegistration: boolean;
    maxUsers: number;
    maxSites: number;
    maxForms: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganizationDocument>(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"],
    },
    logo: { type: String },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    settings: {
      allowSelfRegistration: { type: Boolean, default: false },
      maxUsers: { type: Number, default: 10 },
      maxSites: { type: Number, default: 5 },
      maxForms: { type: Number, default: 20 },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ isActive: 1 });

// Generate slug from name before save
OrganizationSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 50);
  }
  next();
});

const Organization: Model<IOrganizationDocument> =
  mongoose.models.Organization ||
  mongoose.model<IOrganizationDocument>("Organization", OrganizationSchema);

export default Organization;

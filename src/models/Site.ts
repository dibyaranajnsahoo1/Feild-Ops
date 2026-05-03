import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISiteDocument extends Document {
  name: string;
  description?: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
  organizationId: mongoose.Types.ObjectId;
  managerId?: mongoose.Types.ObjectId;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSchema = new Schema<ISiteDocument>(
  {
    name: {
      type: String,
      required: [true, "Site name is required"],
      trim: true,
      maxlength: [150, "Name cannot exceed 150 characters"],
    },
    description: { type: String, maxlength: 500 },
    location: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

SiteSchema.index({ organizationId: 1, isActive: 1 });
SiteSchema.index({ organizationId: 1, name: 1 }, { unique: true });

const Site: Model<ISiteDocument> =
  mongoose.models.Site ||
  mongoose.model<ISiteDocument>("Site", SiteSchema);

export default Site;

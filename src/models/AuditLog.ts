import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAuditLogDocument extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    action: { type: String, required: true, maxlength: 100 },
    resource: { type: String, required: true, maxlength: 100 },
    resourceId: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "unknown" },
    userAgent: { type: String, default: "unknown" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    capped: { size: 104857600, max: 50000 }, // 100MB capped collection
  }
);

AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });

const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);

export default AuditLog;

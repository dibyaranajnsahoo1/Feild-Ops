import mongoose, { Document, Model, Schema } from "mongoose";
import type { SubmissionStatus } from "@/types";

export interface ISubmissionDocument extends Document {
  formId: mongoose.Types.ObjectId;
  siteId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  data: Record<string, unknown>;
  status: SubmissionStatus;
  aiSummary?: string;
  aiAnomalies?: string[];
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  notes?: string;
  attachments: string[];
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmissionDocument>(
  {
    formId: {
      type: Schema.Types.ObjectId,
      ref: "Form",
      required: [true, "Form reference is required"],
    },
    siteId: {
      type: Schema.Types.ObjectId,
      ref: "Site",
      required: [true, "Site reference is required"],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Flexible JSON data - stores the actual form responses
    data: {
      type: Schema.Types.Mixed,
      required: [true, "Submission data is required"],
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "reviewed", "flagged"],
      default: "submitted",
    },
    aiSummary: { type: String },
    aiAnomalies: [{ type: String }],
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    notes: { type: String, maxlength: 2000 },
    attachments: [{ type: String }],
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Compound Indexes for Performance ────────────────────────────────────────
SubmissionSchema.index({ organizationId: 1, createdAt: -1 });
SubmissionSchema.index({ formId: 1, createdAt: -1 });
SubmissionSchema.index({ siteId: 1, createdAt: -1 });
SubmissionSchema.index({ submittedBy: 1, createdAt: -1 });
SubmissionSchema.index({ organizationId: 1, status: 1 });
SubmissionSchema.index({ organizationId: 1, siteId: 1, createdAt: -1 });

// Text index for full-text search on submission data
SubmissionSchema.index({ aiSummary: "text", notes: "text" });

// Increment form submission count on insert
SubmissionSchema.post("save", async function () {
  if (this.isNew) {
    await mongoose.model("Form").findByIdAndUpdate(
      this.formId,
      { $inc: { submissionCount: 1 } }
    );
  }
});

const Submission: Model<ISubmissionDocument> =
  mongoose.models.Submission ||
  mongoose.model<ISubmissionDocument>("Submission", SubmissionSchema);

export default Submission;

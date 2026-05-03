import mongoose, { Document, Model, Schema } from "mongoose";
import type { IFormField } from "@/types";

export interface IFormDocument extends Document {
  title: string;
  description?: string;
  fields: IFormField[];
  siteId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  version: number;
  submissionCount: number;
  settings: {
    allowMultipleSubmissions: boolean;
    requiresApproval: boolean;
    notifyOnSubmission: boolean;
    successMessage: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema = new Schema<IFormField>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["text", "number", "dropdown", "checkbox", "date", "file", "textarea", "email", "phone"],
    },
    label: { type: String, required: true, maxlength: 200 },
    placeholder: { type: String },
    required: { type: Boolean, default: false },
    order: { type: Number, required: true },
    options: [{ type: String }],
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      message: String,
    },
    defaultValue: Schema.Types.Mixed,
    helpText: { type: String },
  },
  { _id: false }
);

const FormSchema = new Schema<IFormDocument>(
  {
    title: {
      type: String,
      required: [true, "Form title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: { type: String, maxlength: 1000 },
    fields: {
      type: [FormFieldSchema],
      validate: {
        validator: (fields: IFormField[]) => fields.length >= 1,
        message: "Form must have at least one field",
      },
    },
    siteId: {
      type: Schema.Types.ObjectId,
      ref: "Site",
      required: [true, "Site is required"],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
    submissionCount: { type: Number, default: 0 },
    settings: {
      allowMultipleSubmissions: { type: Boolean, default: true },
      requiresApproval: { type: Boolean, default: false },
      notifyOnSubmission: { type: Boolean, default: false },
      successMessage: {
        type: String,
        default: "Thank you! Your submission has been recorded.",
      },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

FormSchema.index({ organizationId: 1, isActive: 1 });
FormSchema.index({ siteId: 1, isActive: 1 });
FormSchema.index({ organizationId: 1, createdBy: 1 });

// Increment version on fields update
FormSchema.pre("save", function (next) {
  if (this.isModified("fields") && !this.isNew) {
    this.version += 1;
  }
  next();
});

const Form: Model<IFormDocument> =
  mongoose.models.Form ||
  mongoose.model<IFormDocument>("Form", FormSchema);

export default Form;

import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IPosProductVisibility extends Document {
  externalSku: string;
  showInPos: boolean;
  posLabel?: string | null;
}

const PosProductVisibilitySchema = new Schema<IPosProductVisibility>(
  {
    externalSku: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    showInPos: {
      type: Boolean,
      default: false,
    },
    posLabel: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const PosProductVisibilityModel: Model<IPosProductVisibility> =
  mongoose.models.PosProductVisibility ||
  mongoose.model<IPosProductVisibility>(
    "PosProductVisibility",
    PosProductVisibilitySchema,
  );

export default PosProductVisibilityModel;

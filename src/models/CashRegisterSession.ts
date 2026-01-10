import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICashRegisterSession extends Document {
  sessionId: string;
  posName: string;
  openedAt: Date;
  closedAt?: Date;
  openingBalance: number;
  closingBalance?: number;
  calculatedSales: number;
  difference: number;
  status: "OPEN" | "CLOSED";
  createdAt?: Date;
  updatedAt?: Date;
}

const CashRegisterSessionSchema = new Schema<ICashRegisterSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    posName: { type: String, required: true, index: true },
    openedAt: { type: Date, required: true },
    closedAt: { type: Date },
    openingBalance: { type: Number, required: true },
    closingBalance: { type: Number },
    calculatedSales: { type: Number, required: true, default: 0 },
    difference: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      required: true,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const CashRegisterSessionModel: Model<ICashRegisterSession> =
  mongoose.models.CashRegisterSession ||
  mongoose.model<ICashRegisterSession>(
    "CashRegisterSession",
    CashRegisterSessionSchema
  );

export default CashRegisterSessionModel;

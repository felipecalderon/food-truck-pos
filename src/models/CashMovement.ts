import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface ICashMovement extends Document {
  movementId: string;
  sessionId: string;
  posName: string;
  type: "WITHDRAWAL" | "DEPOSIT";
  reason: "Retiro para comprar" | "Ingreso manual";
  amount: number;
  receiptAmount?: number | null;
  reintegratedAmount?: number | null;
  netImpact: number;
  createdAt: Date;
  updatedAt?: Date;
}

const CashMovementSchema = new Schema<ICashMovement>(
  {
    movementId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
    posName: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["WITHDRAWAL", "DEPOSIT"],
    },
    reason: {
      type: String,
      required: true,
      enum: ["Retiro para comprar", "Ingreso manual"],
    },
    amount: { type: Number, required: true, min: 0 },
    receiptAmount: { type: Number, default: null, min: 0 },
    reintegratedAmount: { type: Number, default: null, min: 0 },
    netImpact: { type: Number, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const CashMovementModel: Model<ICashMovement> =
  mongoose.models.CashMovement ||
  mongoose.model<ICashMovement>("CashMovement", CashMovementSchema);

export default CashMovementModel;

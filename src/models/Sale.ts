import mongoose, { type Document, type Model, Schema } from "mongoose";

const CartItemSchema = new Schema(
  {
    sku: { type: String, required: true },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    quantity: { type: Number, required: true },
    // Include other optional fields if necessary, or set strict: false if strictly dynamic
    categoria: { type: String },
    precioNeto: { type: String },
    precioIva: { type: String },
    precioOferta: { type: String },
    stock: { type: Number },
    references: { type: [Schema.Types.Mixed] },
  },
  { _id: false, strict: false },
);

export interface ISale extends Document {
  saleId: string;
  sessionId: string;
  posName: string;
  items: any[]; // Using schema definition above
  total: number;
  date: Date;
  paymentMethod:
    | "Gastos del Jefe"
    | "Efectivo"
    | "Débito"
    | "Crédito"
    | "Transferencia";
  amountPaid: number;
  change: number;
  comment?: string;
  externalSyncStatus: "PENDING" | "SYNCED" | "FAILED";
  externalSyncError?: string | null;
  externalSyncedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const SaleSchema = new Schema<ISale>(
  {
    saleId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
    posName: { type: String, required: true, index: true },
    items: [CartItemSchema],
    total: { type: Number, required: true },
    date: { type: Date, required: true, index: true },
    paymentMethod: {
      type: String,
      required: true,
      enum: [
        "Gastos del Jefe",
        "Efectivo",
        "Crédito",
        "Débito",
        "Transferencia",
      ],
    },
    amountPaid: { type: Number, required: true },
    change: { type: Number, required: true },
    comment: { type: String },
    externalSyncStatus: {
      type: String,
      required: true,
      enum: ["PENDING", "SYNCED", "FAILED"],
      default: "PENDING",
    },
    externalSyncError: { type: String, default: null },
    externalSyncedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const SaleModel: Model<ISale> =
  mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);

export default SaleModel;

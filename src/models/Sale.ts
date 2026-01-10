import mongoose, { Schema, Document, Model } from "mongoose";

const CartItemSchema = new Schema(
  {
    sku: { type: Number, required: true },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    quantity: { type: Number, required: true },
    // Include other optional fields if necessary, or set strict: false if strictly dynamic
    categoria: { type: String },
    precioNeto: { type: String },
    precioIva: { type: String },
    precioOferta: { type: String },
    stock: { type: Number },
    activo: { type: String },
  },
  { _id: false }
);

export interface ISale extends Document {
  saleId: string;
  sessionId: string;
  posName: string;
  items: any[]; // Using schema definition above
  total: number;
  date: Date;
  paymentMethod:
    | "Efectivo"
    | "Debito"
    | "Credito"
    | "Transferencia"
    | "Credito JEFE";
  amountPaid: number;
  change: number;
  comment?: string;
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
      enum: ["Efectivo", "Debito", "Credito", "Transferencia", "Credito JEFE"],
    },
    amountPaid: { type: Number, required: true },
    change: { type: Number, required: true },
    comment: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const SaleModel: Model<ISale> =
  mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);

export default SaleModel;

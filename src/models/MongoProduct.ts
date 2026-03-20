import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IMongoProduct extends Document {
  sku: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  associatedInsumos: Array<{
    sku: string;
    quantity: number;
  }>;
  associatedSkus: string[];
}

const MongoProductSchema = new Schema<IMongoProduct>(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    categoria: {
      type: String,
      default: "Final",
      trim: true,
    },
    precio: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    associatedInsumos: [
      {
        sku: {
          type: String,
          required: true,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    associatedSkus: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const MongoProductModel: Model<IMongoProduct> =
  mongoose.models.MongoProduct ||
  mongoose.model<IMongoProduct>("MongoProduct", MongoProductSchema);

export default MongoProductModel;

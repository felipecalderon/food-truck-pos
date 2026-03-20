import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Interfaz para el documento de Relación de Productos en MongoDB.
 * Almacena qué productos (por SKU) están asociados a un producto padre.
 */
export interface IProductRelation extends Document {
  parentSku: string;
  associatedSkus: string[];
}

const ProductRelationSchema = new Schema<IProductRelation>(
  {
    parentSku: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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

const ProductRelationModel: Model<IProductRelation> =
  mongoose.models.ProductRelation ||
  mongoose.model<IProductRelation>("ProductRelation", ProductRelationSchema);

export default ProductRelationModel;

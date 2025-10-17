import mongoose from "mongoose";

const SaleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
});

const SaleSchema = new mongoose.Schema(
  {
    items: {
      type: [SaleItemSchema],
      required: true,
      validate: [(v) => v.length > 0, "La venta debe tener al menos un item"],
    },
    total: { type: Number, required: true, min: 0 },
    cashier: { type: String }, // opcional: quien registró la venta
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.model("Sale", SaleSchema);

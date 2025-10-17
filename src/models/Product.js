import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    stock:{ type: Number, required: true, default: 0},
    price: { type: Number, required: true},
    alertLevel: { type: Number, required: true, default: 5} // Nivel de alerta para stock bajo
})

export default mongoose.model("Product", productSchema);
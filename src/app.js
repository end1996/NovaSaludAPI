import express from "express";
import cors from "cors";
import productRoutes from "./routes/product.routes.js";
import saleRoutes from "./routes/sale.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);

export default app;

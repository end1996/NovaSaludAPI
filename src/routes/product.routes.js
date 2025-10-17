import express from "express";
import {
  createProduct,
  deleteProduct,
  getProducts,
  getLowStockProducts,
  updateProduct,
} from "../controllers/productController.js";

const router = express.Router();

// Endpoints CRUD para productos
router.get("/", getProducts);
router.get("/low-stock", getLowStockProducts);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;

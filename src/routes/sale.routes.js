import { Router } from "express";
import { createSale, getSales, getSaleById } from "../controllers/saleController.js";

const router = Router();

router.post("/", createSale);       // registrar venta
router.get("/", getSales);          // listar ventas (paginado)
router.get("/:id", getSaleById);    // obtener venta por id

export default router;

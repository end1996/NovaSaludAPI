import Sale from "../models/Sale.js";
import Product from "../models/Product.js";

/**
 * createSale
 * - recibe body: { items: [{ product, quantity, price }], cashier? }
 * - valida existencia y stock usando updateOne con filtro stock >= qty (operación atómica)
 * - si alguna línea falla, revierte las decrementos ya aplicados
 */
export const createSale = async (req, res) => {
  const { items, cashier } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items es requerido y debe ser un arreglo" });
  }

  // calcula total por seguridad (no confiar en cliente)
  const total = items.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 0), 0);

  // Track de productos cuyo stock fue decrementado para poder revertir en caso de error
  const decremented = [];

  try {
    // Para cada item tratamos de decrementar stock de forma atómica:
    for (const it of items) {
      if (!it.product || !it.quantity || it.quantity <= 0) {
        throw { status: 400, message: "Cada item necesita product y quantity > 0" };
      }

      const updateResult = await Product.updateOne(
        { _id: it.product, stock: { $gte: it.quantity } }, // filtro atómico
        { $inc: { stock: -it.quantity } }
      );

      if (updateResult.modifiedCount === 0) {
        // No se pudo decrementar (producto no existe o stock insuficiente)
        throw {
          status: 400,
          message: `Stock insuficiente o producto inexistente para productId=${it.product}`,
          failedProduct: it.product,
        };
      }

      // marcar para revertir si falla más adelante
      decremented.push({ productId: it.product, qty: it.quantity });
    }

    // Si llegamos acá, todos los decrementos fueron OK => crear la venta
    const sale = new Sale({ items, total, cashier });
    await sale.save();

    // Opcional: obtener productos por debajo de alertLevel y devolver alertas
    const lowStockProducts = await Product.find({
      _id: { $in: items.map((i) => i.product) },
      $expr: { $lt: ["$stock", "$alertLevel"] },
    }).select("name stock alertLevel");

    return res.status(201).json({ sale, lowStock: lowStockProducts });
  } catch (err) {
    // Revertir decrementos parciales en caso de error
    if (decremented.length > 0) {
      const promises = decremented.map((d) =>
        Product.updateOne({ _id: d.productId }, { $inc: { stock: d.qty } })
      );
      await Promise.all(promises).catch((revertErr) => {
        console.error("Error al revertir stocks:", revertErr);
      });
    }

    const status = err.status || 500;
    const message = err.message || "Error al procesar la venta";
    return res.status(status).json({ message, detail: err });
  }
};

// Listar ventas (paginado simple opcional)
export const getSales = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const sales = await Sale.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("items.product", "name price"); // popular nombre del producto

    const total = await Sale.countDocuments();

    res.json({ data: sales, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate("items.product", "name price");
    if (!sale) return res.status(404).json({ message: "Venta no encontrada" });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

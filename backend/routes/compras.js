import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// POST: Emitir una orden de compra (Llamar al proveedor)
router.post('/', async (req, res) => {
  try {
    const { proveedor_id } = req.body;
    const orden = await prisma.compraProveedor.create({
      data: { proveedor_id, estado: "PENDIENTE" }
    });
    res.status(201).json(orden);
  } catch (error) {
    res.status(500).json({ error: "Error al generar la orden de compra" });
  }
});

// PUT: El camión llega a la farmacia (Ingresa el stock)
router.put('/:id/recibir', async (req, res) => {
  try {
    const compraId = parseInt(req.params.id);
    const { productos_recibidos } = req.body; 
    // Esto será una lista con los códigos, precios y cantidades que llegaron

    const transaccion = await prisma.$transaction(async (tx) => {
      // 1. Cambiamos la orden a ENTREGADA
      const compra = await tx.compraProveedor.update({
        where: { id: compraId },
        data: { estado: "ENTREGADA" }
      });

      // 2. Por cada producto que llegó en el camión, creamos un nuevo Lote en la Bodega
      for (const item of productos_recibidos) {
        await tx.lote.create({
          data: {
            producto_codigo: item.producto_codigo,
            numero_lote: item.numero_lote,
            fecha_caducidad: item.fecha_caducidad ? new Date(item.fecha_caducidad) : null,
            precio_venta: item.precio_venta,
            stock_bodega: item.cantidad, // ¡Entran directo a bodega!
            stock_almacen: 0
          }
        });
      }
      return compra;
    });

    res.json({ mensaje: "Mercadería ingresada a bodega exitosamente", compra: transaccion });
  } catch (error) {
    res.status(500).json({ error: "Error al recibir la mercadería" });
  }
});

export default router;
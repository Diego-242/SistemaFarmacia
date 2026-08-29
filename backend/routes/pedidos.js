import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// POST: Registrar que un cliente necesita un producto agotado
router.post('/', async (req, res) => {
  try {
    const { cliente_cedula, producto_codigo, cantidad } = req.body;
    
    const pedido = await prisma.pedidoCliente.create({
      data: {
        cliente_cedula,
        producto_codigo,
        cantidad,
        estado: "PENDIENTE" // Queda pendiente hasta que se lo llame cuando llegue el stock
      }
    });
    
    res.status(201).json(pedido);
  } catch (error) {
    res.status(500).json({ error: "Error al registrar el pedido del cliente" });
  }
});

export default router;
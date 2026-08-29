import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// Endpoint GET: Ver todo el inventario físico
router.get('/', async (req, res) => {
  try {
    const lotes = await prisma.lote.findMany({
      include: {
        producto: true // Mágicamente trae los datos del producto (ej. Paracetamol)
      }
    });
    res.json(lotes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los lotes" });
  }
});

// Endpoint POST: Ingresar un nuevo lote (cargamento) a la farmacia
router.post('/', async (req, res) => {
  try {
    const { producto_codigo, numero_lote, fecha_caducidad, precio_venta, cantidad_ingreso } = req.body;
    
    const nuevoLote = await prisma.lote.create({
      data: {
        producto_codigo,
        numero_lote,
        // Convertimos el texto de la fecha al formato especial que usa la base de datos
        fecha_caducidad: fecha_caducidad ? new Date(fecha_caducidad) : null,
        precio_venta,
        stock_bodega: cantidad_ingreso, // Por regla del proyecto, todo entra a bodega[cite: 1]
        stock_almacen: 0
      }
    });
    
    res.status(201).json(nuevoLote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar el lote" });
  }
});

// Endpoint PUT: Mover mercadería de Bodega a Almacén
router.put('/:id/mover', async (req, res) => {
  try {
    // El ID del lote viene en la URL, la cantidad a mover viene en el body
    const loteId = parseInt(req.params.id);
    const { cantidad_a_mover } = req.body;

    // 1. Buscamos el lote en la base de datos
    const loteActual = await prisma.lote.findUnique({
      where: { id: loteId }
    });

    if (!loteActual) {
      return res.status(404).json({ error: "Lote no encontrado" });
    }

    // 2. Validamos que haya suficiente stock en bodega
    if (cantidad_a_mover > loteActual.stock_bodega) {
      return res.status(400).json({ error: "No hay suficiente stock en bodega para mover" });
    }

    // 3. Hacemos la actualización matemática
    const loteActualizado = await prisma.lote.update({
      where: { id: loteId },
      data: {
        stock_bodega: loteActual.stock_bodega - cantidad_a_mover, // Restamos de bodega
        stock_almacen: loteActual.stock_almacen + cantidad_a_mover // Sumamos al almacén
      }
    });

    res.json({ mensaje: "Movimiento exitoso", lote: loteActualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al mover el stock" });
  }
});

export default router;
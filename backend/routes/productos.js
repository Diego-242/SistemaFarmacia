import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// GET: Listar productos activos (excluir eliminados)
router.get('/', async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      where: { deletedAt: null },
      include: {
        tipo: true
      }
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los productos" });
  }
});

// GET: Productos en papelera (eliminados)
router.get('/papelera/todos', async (req, res) => {
  try {
    const eliminados = await prisma.producto.findMany({
      where: { deletedAt: { not: null } },
      include: { tipo: true }
    });
    res.json(eliminados);
  } catch (error) {
    res.status(500).json({ error: "Error al cargar la papelera" });
  }
});

// GET: Alertas de stock bajo
router.get('/alertas', async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      where: { deletedAt: null },
      include: { lotes: true }
    });

    const productosEnEscasez = [];

    for (const producto of productos) {
      let stockTotal = 0;
      for (const lote of producto.lotes) {
        stockTotal += lote.stock_bodega + lote.stock_almacen;
      }
      if (stockTotal <= producto.umbral_minimo) {
        productosEnEscasez.push({
          codigo: producto.codigo,
          nombre: producto.nombre,
          stock_actual: stockTotal,
          umbral_minimo: producto.umbral_minimo
        });
      }
    }

    res.json(productosEnEscasez);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al generar alertas" });
  }
});

// GET: Buscar producto por codigo
router.get('/:codigo', async (req, res) => {
  try {
    const producto = await prisma.producto.findUnique({
      where: { codigo: req.params.codigo, deletedAt: null },
      include: { tipo: true, lotes: true }
    });
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar el producto" });
  }
});

// POST: Crear producto
router.post('/', async (req, res) => {
  try {
    const { codigo, nombre, tipo_id, umbral_minimo } = req.body;
    const nuevoProducto = await prisma.producto.create({
      data: { codigo, nombre, tipo_id, umbral_minimo }
    });
    res.status(201).json(nuevoProducto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el producto" });
  }
});

// PUT: Editar producto
router.put('/:codigo', async (req, res) => {
  try {
    const { nombre, tipo_id, umbral_minimo } = req.body;
    const producto = await prisma.producto.update({
      where: { codigo: req.params.codigo },
      data: { nombre, tipo_id, umbral_minimo }
    });
    res.json({ mensaje: "Producto actualizado", producto });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: "Producto no encontrado" });
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
});

// DELETE: Soft delete
router.delete('/:codigo', async (req, res) => {
  try {
    await prisma.producto.update({
      where: { codigo: req.params.codigo },
      data: { deletedAt: new Date() }
    });
    res.json({ mensaje: "Producto enviado a la papelera" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

// PUT: Restaurar
router.put('/:codigo/restaurar', async (req, res) => {
  try {
    await prisma.producto.update({
      where: { codigo: req.params.codigo },
      data: { deletedAt: null }
    });
    res.json({ mensaje: "Producto restaurado" });
  } catch (error) {
    res.status(500).json({ error: "Error al restaurar" });
  }
});

export default router;

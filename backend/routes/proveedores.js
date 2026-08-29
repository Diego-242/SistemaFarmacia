import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// GET: Ver lista de proveedores activos
router.get('/', async (req, res) => {
  try {
    const proveedores = await prisma.proveedor.findMany({
      where: { deletedAt: null }
    });
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
});

// GET: Proveedores en papelera
router.get('/papelera/todos', async (req, res) => {
  try {
    const eliminados = await prisma.proveedor.findMany({
      where: { deletedAt: { not: null } }
    });
    res.json(eliminados);
  } catch (error) {
    res.status(500).json({ error: "Error al cargar la papelera" });
  }
});

// GET: Buscar proveedor por id
router.get('/:id', async (req, res) => {
  try {
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: parseInt(req.params.id), deletedAt: null }
    });
    if (!proveedor) return res.status(404).json({ error: "Proveedor no encontrado" });
    res.json(proveedor);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar el proveedor" });
  }
});

// POST: Registrar un nuevo proveedor
router.post('/', async (req, res) => {
  try {
    const { nombre, contacto } = req.body;
    const nuevo = await prisma.proveedor.create({ data: { nombre, contacto } });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: "Error al registrar proveedor" });
  }
});

// PUT: Editar proveedor
router.put('/:id', async (req, res) => {
  try {
    const { nombre, contacto } = req.body;
    const proveedor = await prisma.proveedor.update({
      where: { id: parseInt(req.params.id) },
      data: { nombre, contacto }
    });
    res.json({ mensaje: "Proveedor actualizado", proveedor });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: "Proveedor no encontrado" });
    res.status(500).json({ error: "Error al actualizar" });
  }
});

// DELETE: Soft delete
router.delete('/:id', async (req, res) => {
  try {
    await prisma.proveedor.update({
      where: { id: parseInt(req.params.id) },
      data: { deletedAt: new Date() }
    });
    res.json({ mensaje: "Proveedor enviado a la papelera" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

// PUT: Restaurar
router.put('/:id/restaurar', async (req, res) => {
  try {
    await prisma.proveedor.update({
      where: { id: parseInt(req.params.id) },
      data: { deletedAt: null }
    });
    res.json({ mensaje: "Proveedor restaurado" });
  } catch (error) {
    res.status(500).json({ error: "Error al restaurar" });
  }
});

export default router;

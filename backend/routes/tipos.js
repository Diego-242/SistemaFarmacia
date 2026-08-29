import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// Endpoint GET: Listar todos los tipos de productos
router.get('/', async (req, res) => {
  try {
    const tipos = await prisma.tipoProducto.findMany();
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los tipos de producto" });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, es_perecible } = req.body;
    
    const nuevoTipo = await prisma.tipoProducto.create({
      data: { nombre, es_perecible }
    });
    
    res.status(201).json(nuevoTipo);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el tipo de producto" });
  }
});

export default router;
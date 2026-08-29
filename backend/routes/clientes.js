import prisma from '../db.js'
import {Router} from 'express'

const router = Router()

// Endpoint GET: Listar todos los clientes
router.get('/', async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      where: {deletedAt: null}
    });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});


// Endpoint GET: Buscar un cliente específico por su cédula
router.get('/:cedula', async (req, res) => {
  try {
    const { cedula } = req.params; // Capturamos la cédula desde la URL
    
    // Buscamos el cliente exacto en la base de datos
    const cliente = await prisma.cliente.findUnique({
      where: { cedula: cedula ,
        deletedAt: null
      },
      include: {
        facturas: true // De paso, traemos su historial de compras para verlo
      }
    });

    // Si la base de datos devuelve null, significa que no existe
    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado. Debe registrarlo primero." });
    }

    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar el cliente" });
  }
});


// Endpoint POST: Crear un nuevo cliente
router.post('/', async (req, res) => {
  try {
    // Extraemos los datos que nos enviarán
    const datos = req.body;
    
    // Prisma crea el registro en la base de datos SQLite
    const nuevoCliente = await prisma.cliente.create({
      data: {
        cedula: datos.cedula,
        nombre: datos.nombre,
        direccion: datos.direccion,
        telefono: datos.telefono,
      }
    });
    
    res.status(201).json(nuevoCliente); // Respondemos con el cliente creado
  } catch (error) {
    console.error("Error de Prisma:", error);
    res.status(500).json({ error: "Error al crear el cliente" });
  }
});

// Endpoint PUT: Cambiar el plan del cliente (Normal / Premium)
router.put('/:cedula/plan', async (req, res) => {
  try {
    const { cedula } = req.params;
    const { nuevo_plan } = req.body; // "NORMAL" o "PREMIUM"

    const clienteActualizado = await prisma.cliente.update({
      where: { cedula },
      data: { plan: nuevo_plan.toUpperCase() }
    });

    res.json({ mensaje: `Plan actualizado a ${nuevo_plan}`, cliente: clienteActualizado });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el plan del cliente" });
  }
});

// Endpoint PUT: Editar los datos básicos del cliente (Corregir errores)
router.put('/:cedula', async (req, res) => {
  try {
    const { cedula } = req.params;
    
    // Sacamos solo los campos que es seguro modificar
    // (No permitimos cambiar la cédula ni los puntos por aquí por seguridad)
    const { nombre, direccion, telefono } = req.body; 

    const clienteActualizado = await prisma.cliente.update({
      where: { cedula: cedula },
      data: {
        // Prisma es inteligente: si le pasas 'undefined' en algún campo, simplemente no lo actualiza.
        // Así puedes enviarle solo el teléfono, o solo el nombre, y no borrará el resto.
        nombre, 
        direccion, 
        telefono 
      }
    });

    res.json({ mensaje: "Datos del cliente actualizados", cliente: clienteActualizado });
  } catch (error) {
    // Código de error de Prisma cuando no encuentra el registro
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }
    console.error(error);
    res.status(500).json({ error: "Error al actualizar los datos del cliente" });
  }
});

// Endpoint DELETE: Eliminar un cliente sin historial asociado
router.delete('/:cedula', async (req, res) => {
  try {
    const { cedula } = req.params;
    await prisma.cliente.update({
      where: { cedula },
      data: { deletedAt: new Date() } // <-- Guardamos la fecha y hora exacta
    });
    res.json({ mensaje: "Cliente enviado a la papelera de reciclaje" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

router.get('/papelera/todos', async (req, res) => {
  try {
    const eliminados = await prisma.cliente.findMany({
      where: {
        deletedAt: {
          not: null // <-- La magia: Trae todos los que SÍ tengan una fecha de eliminación
        }
      }
    });
    res.json(eliminados);
  } catch (error) {
    res.status(500).json({ error: "Error al cargar la papelera" });
  }
});

// 3. RESTAURAR DEL BASURERO
router.put('/:cedula/restaurar', async (req, res) => {
  try {
    const { cedula } = req.params;
    await prisma.cliente.update({
      where: { cedula },
      data: { deletedAt: null } // <-- Al ponerlo en null, vuelve a la vida
    });
    res.json({ mensaje: "Cliente restaurado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al restaurar" });
  }
});

export default router;

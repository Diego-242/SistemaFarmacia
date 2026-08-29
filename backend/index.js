import express from 'express';
import cors from 'cors';
import clientesRouter from './routes/clientes.js';
import tiposRouter from './routes/tipos.js';
import productosRouter from './routes/productos.js';
import lotesRouter from './routes/lotes.js';
import facturasRouter from './routes/facturas.js';
import proveedoresRoutes from './routes/proveedores.js';
import comprasRoutes from './routes/compras.js';
import pedidosRoutes from './routes/pedidos.js';


const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

app.use('/api/clientes' , clientesRouter);
app.use('/api/tipos' , tiposRouter);
app.use('/api/productos' , productosRouter);
app.use('/api/lotes' , lotesRouter);
app.use('/api/facturas' , facturasRouter);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/pedidos', pedidosRoutes);

// Levantar el servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend activo en http://localhost:${PORT}`);
});
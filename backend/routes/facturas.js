import { Router } from "express";
import prisma from "../db.js";

const router = Router();

// Endpoint POST: Generar una nueva venta
router.post("/", async (req, res) => {
  try {
    // Recibimos la cédula del cliente y una lista de los artículos que va a comprar
    const { cliente_cedula, articulos } = req.body;

    let subtotal = 0;
    const detallesParaGuardar = [];

    // 1. Verificamos que haya stock en el almacén para cada producto
    for (const articulo of articulos) {
      const lote = await prisma.lote.findUnique({
        where: { id: articulo.lote_id },
      });

      if (!lote) {
        return res
          .status(404)
          .json({ error: `El lote ${articulo.lote_id} no existe.` });
      }

      // Si no hay suficiente en el almacén (vitrina)
      if (lote.stock_almacen < articulo.cantidad) {
        // Verificamos si hay en bodega para "salvar" la venta
        if (lote.stock_bodega > 0) {
          return res.status(400).json({
            error: `Falta stock en Almacén. Tienes ${lote.stock_almacen} en vitrina, pero hay ${lote.stock_bodega} guardados en Bodega. ¡Traslada la mercadería primero!`,
          });
        } else {
          // No hay en almacén y la bodega también está vacía
          return res.status(400).json({
            error: `Stock totalmente agotado. No hay en Almacén ni en Bodega para el lote ${articulo.lote_id}.`,
          });
        }
      }

      // Calculamos cuánto cuesta llevar x cantidad de este producto
      const totalLinea = lote.precio_venta * articulo.cantidad;
      subtotal += totalLinea;

      // Preparamos el detalle para la factura
      detallesParaGuardar.push({
        lote_id: lote.id,
        cantidad: articulo.cantidad,
        precio_unitario: lote.precio_venta,
      });
    }

    // 2. Calculamos los impuestos (15% de IVA) y el total inicial
    const tasaIVA = 0.15;
    const impuestos = subtotal * tasaIVA;
    let total = subtotal + impuestos;

    // --- NUEVO: LÓGICA DE CANJE DE PUNTOS ---
    // Si el frontend envía 'puntos_a_usar', los convertimos en dinero (Ej: 10 puntos = $1.00)
    let descuento_puntos = 0;
    const puntosAUsar = req.body.puntos_a_usar || 0;

    if (puntosAUsar > 0) {
      descuento_puntos = puntosAUsar * 0.1; // Cada punto vale 10 centavos
      total = total - descuento_puntos; // Restamos el canje del total a pagar

      if (total < 0) total = 0; // El total no puede ser negativo
    }

    // 3. LA TRANSACCIÓN: Guardamos todo junto
    const nuevaFactura = await prisma.$transaction(async (tx) => {
      // A. Buscar al cliente para saber qué plan tiene
      const cliente = await tx.cliente.findUnique({
        where: { cedula: cliente_cedula },
      });

      // B. Crear la factura (ahora incluimos el descuento por puntos)
      const factura = await tx.factura.create({
        data: {
          cliente_cedula,
          subtotal,
          impuestos,
          descuento_puntos,
          total,
          detalles: { create: detallesParaGuardar },
        },
      });

      // C. Descontar el stock del almacén
      for (const det of detallesParaGuardar) {

        const loteVendido = await tx.lote.findUnique({
          where: { id: det.lote_id },
        });

        await tx.lote.update({
          where: { id: det.lote_id },
          data: { stock_almacen: { decrement: det.cantidad } },
        });

        // Si el lote que se está vendiendo pertenece al producto de Membresía...
        if (loteVendido.producto_codigo === "MEMB-001") {
          await tx.cliente.update({
            where: { cedula: cliente_cedula },
            data: { plan: "PREMIUM" }, // ¡Se afilia automáticamente!
          });
        }
      }

      // D. NUEVO: LÓGICA DE PUNTOS Y PUNTOS DORADOS
      // Si el cliente no tiene plan, no gana nada.
      if (cliente.plan !== "NINGUNO") {
        let puntosGanados = 0;
        let puntosDoradosGanados = 0;

        // REGLA DE NEGOCIO: Solo gana puntos nuevos si NO usó puntos para pagar
        if (puntosAUsar === 0) {
          puntosGanados = Math.floor(total); // 1 punto por cada dólar gastado

          if (cliente.plan === "PREMIUM") {
            puntosDoradosGanados = Math.floor(total / 10); // 1 punto dorado por cada $10
          }
        }

        // Actualizamos el perfil: sumamos los ganados (serán 0 si hubo canje) y restamos los usados
        await tx.cliente.update({
          where: { cedula: cliente_cedula },
          data: {
            puntos: { increment: puntosGanados - puntosAUsar },
            puntos_dorados: { increment: puntosDoradosGanados },
          },
        });
      }

      return factura;
    });

    res.status(201).json(nuevaFactura);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al procesar la factura" });
  }
});

export default router;

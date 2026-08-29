(async () => {
  const nombres = ["Carlos", "María", "Luis", "Ana", "Jorge", "Carmen", "José", "Rosa", "Pedro", "Lucía", "Andrés", "Marta", "Diego", "Sofía", "Juan", "Elena", "Mateo", "Laura", "Daniel", "Valeria"];
  const apellidos = ["Gómez", "Pérez", "López", "García", "Zambrano", "Sánchez", "Vera", "Castro", "Rodríguez", "Fernández", "Mendoza", "Ortiz", "Torres", "Suárez", "Ramírez", "Ruiz", "Vargas", "Rojas", "Moreno", "Díaz"];

  console.log("Iniciando inyección de 50 clientes...");

  for (let i = 1; i <= 50; i++) {
    // Escoger nombre y apellido al azar
    const nombreAleatorio = nombres[Math.floor(Math.random() * nombres.length)];
    const apellidoAleatorio = apellidos[Math.floor(Math.random() * apellidos.length)];
    
    // Armar el objeto del cliente
    const cliente = {
      cedula: "0102" + String(i).padStart(6, '0'), // Crea cédulas tipo: 0102000001, 0102000002...
      nombre: `${nombreAleatorio} ${apellidoAleatorio}`,
      direccion: `Av. Principal ${i * 10}`,
      telefono: "099" + String(1000000 + i) // Teléfonos únicos
    };

    try {
      const res = await fetch('http://localhost:3000/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cliente)
      });
      const data = await res.json();
      console.log(`✅ Creado (${i}/50): ${data.nombre} - ${data.cedula}`);
    } catch (error) {
      console.error(`❌ Error en el cliente ${i}:`, error);
    }
    
    // Pausa de 50ms para proteger la base de datos SQLite
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log("🎉 ¡Listo! 50 clientes inyectados con éxito a la base de datos.");
})();
import { PrismaClient } from './prisma/generated/index.js';

// Iniciamos Prisma una sola vez
const prisma = new PrismaClient();

// Lo exportamos para que otros archivos lo puedan usar
export default prisma;
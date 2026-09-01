import { PrismaClient } from '@prisma/client';

// Hỗ trợ JSON.stringify serialize được kiểu dữ liệu BigInt của PostgreSQL
(BigInt.prototype as any).toJSON = function () {
  return Number(this.toString());
};

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

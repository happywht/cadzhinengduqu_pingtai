import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 优雅关闭数据库连接
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

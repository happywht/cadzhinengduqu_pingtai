import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据...');

  // 创建测试用户
  const hashedPassword = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
    },
  });

  console.log('测试用户创建成功:', user);

  // 创建测试项目
  const project = await prisma.project.create({
    data: {
      name: '示例项目',
      description: '这是一个示例项目',
      userId: user.id,
    },
  });

  console.log('示例项目创建成功:', project);

  console.log('种子数据完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

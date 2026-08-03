const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  const email = process.env.BOOTSTRAP_CEO_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_CEO_PASSWORD;
  if (!email || !password || password.length < 12) throw new Error('Set BOOTSTRAP_CEO_EMAIL and a 12+ character BOOTSTRAP_CEO_PASSWORD in a secure shell.');
  await prisma.user.upsert({ where: { email }, update: { passwordHash: await bcrypt.hash(password, 12), isActive: true, mustChangePassword: true, role: 'CEO' }, create: { name: 'CEO', email, passwordHash: await bcrypt.hash(password, 12), role: 'CEO', isActive: true, mustChangePassword: true } });
  console.log('CEO account updated; password is not displayed.');
}
main().finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting CEO Account Password...');

  const ceoEmail = 'ceo@rynexsecurity.com';
  const newPassword = 'CEOSecurePass2026!';
  
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const existingCeo = await prisma.user.findUnique({
    where: { email: ceoEmail },
  });

  if (existingCeo) {
    const updatedUser = await prisma.user.update({
      where: { email: ceoEmail },
      data: {
        passwordHash,
        isActive: true,
        mustChangePassword: false,
      },
    });
    console.log('Successfully reset CEO password!');
    console.log(`Email: ${updatedUser.email}`);
    console.log(`New Password: ${newPassword}`);
    console.log(`Account Status: ${updatedUser.isActive ? 'ACTIVE' : 'INACTIVE'}`);
  } else {
    const newCeo = await prisma.user.create({
      data: {
        name: 'CEO Admin',
        email: ceoEmail,
        passwordHash,
        role: 'CEO',
        isActive: true,
        mustChangePassword: false,
      },
    });
    console.log('Created new CEO account!');
    console.log(`Email: ${newCeo.email}`);
    console.log(`New Password: ${newPassword}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error resetting CEO password:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

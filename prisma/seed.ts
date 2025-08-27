import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Vérifier si l'admin existe déjà
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@weddni.com' }
  });

  if (!existingAdmin) {
    // Créer l'utilisateur admin
    const hashedPassword = await bcrypt.hash('admin123!', 10);
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@weddni.com',
        password: hashedPassword,
        role: 'ADMIN',
        admin: {
          create: {}
        }
      }
    });
    console.log('Admin user created:', adminUser);
  }

  // Vérifier si le prestataire existe déjà
  const existingProvider = await prisma.user.findUnique({
    where: { email: 'prestataire@weddni.com' }
  });

  if (!existingProvider) {
    // Créer l'utilisateur prestataire
    const hashedPassword = await bcrypt.hash('presta123!', 10);
    const providerUser = await prisma.user.create({
      data: {
        name: 'Prestataire',
        email: 'prestataire@weddni.com',
        password: hashedPassword,
        role: 'PROVIDER',
        provider: {
          create: {
            phone: '+1234567890'
          }
        }
      }
    });
    console.log('Provider user created:', providerUser);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, UserRole, ProviderStatus } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Clean up the database
  await prisma.report.deleteMany()
  await prisma.service.deleteMany()
  await prisma.admin.deleteMany()
  await prisma.provider.deleteMany()
  await prisma.user.deleteMany()

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Weddni',
      email: 'admin@weddni.com',
      password: await hash('Admin123!', 10),
      role: UserRole.ADMIN,
      emailVerified: true,
      admin: {
        create: {
          position: 'Administrateur Principal'
        }
      }
    }
  })

  // Create provider user
  const provider = await prisma.user.create({
    data: {
      name: 'Prestataire Weddni',
      email: 'prestataire@weddni.com',
      password: await hash('Presta123!', 10),
      role: UserRole.PROVIDER,
      emailVerified: true,
      provider: {
        create: {
          phone: '+216 99 999 999',
          companyName: 'Prestations Événementielles',
          address: 'Tunis, Tunisie',
          description: 'Prestataire de services pour événements',
          status: ProviderStatus.ACTIVE
        }
      }
    },
    include: {
      provider: true
    }
  })

  // Create test services
  if (provider.provider) {
    await prisma.service.createMany({
      data: [
        {
          title: 'Salle de Mariage Premium',
          description: 'Grande salle de mariage luxueuse',
          images: ['salle1.jpg'],
          price: 5000,
          category: 'Établissement',
          status: 'APPROVED',
          providerId: provider.provider.id
        },
        {
          title: 'Pack Photo Premium',
          description: 'Service photo professionnel',
          images: ['photo1.jpg'],
          price: 1500,
          category: 'Service',
          status: 'PENDING',
          providerId: provider.provider.id
        }
      ]
    })
  }

  console.log('Database seeded successfully!')
  console.log('Admin credentials:')
  console.log('Email: admin@weddni.com')
  console.log('Password: admin123\n')
  console.log('Provider credentials:')
  console.log('Email: provider@test.com')
  console.log('Password: provider123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

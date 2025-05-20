import { PrismaClient, RoleName } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed AppConfig for Registration Password
  console.log('Creating AppConfig for REGISTRATION_PASSWORD...');
  const registrationPassword = 'test123test123'; // The actual registration code
  await prisma.appConfig.upsert({
    where: { key: 'REGISTRATION_PASSWORD' },
    update: { value: registrationPassword },
    create: {
      key: 'REGISTRATION_PASSWORD',
      value: registrationPassword,
      notes: 'Fixed password required for initial user registration.'
    },
  });
  console.log('AppConfig for REGISTRATION_PASSWORD created/updated successfully');

  // Seed roles
  console.log('Creating roles...');
  const roles = [
    { role_name: RoleName.Admin },
    { role_name: RoleName.Librarian },
    { role_name: RoleName.Member },
    { role_name: RoleName.PotentialMember }
  ];

  for (const role of roles) {
    await prisma.roles.upsert({
      where: { role_name: role.role_name },
      update: {},
      create: role,
    });
  }

  console.log('Roles created successfully');

  // Get Admin role
  const adminRole = await prisma.roles.findUnique({
    where: { role_name: RoleName.Admin },
  });

  if (!adminRole) {
    throw new Error('Admin role not found');
  }

  // Seed admin user
  console.log('Creating admin user...');
  const adminPassword = 'Admin123!'; // This should be changed in production
  const passwordHash = await argon2.hash(adminPassword);

  await prisma.users.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password_hash: passwordHash,
      name: '관리자',
      email: 'admin@springbooks.com',
      phone_number: '01012345678',
      role_id: adminRole.role_id,
      application_status: 'approved',
      requested_librarian_role_on_application: false,
    },
  });

  console.log('Admin user created successfully');
  console.log('Seeding completed');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
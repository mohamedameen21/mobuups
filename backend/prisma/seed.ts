import 'dotenv/config';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { prisma } from '../src/lib/prisma.js';

const USER_COUNT = 20;
const SEED_PASSWORD = 'Password123!';

const DEMO_EMAIL = 'demouser@gmail.com';
const DEMO_PASSWORD = 'password';

async function main() {
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  const demoPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  await prisma.user.create({
    data: { name: 'Demo User', email: DEMO_EMAIL, passwordHash: demoPasswordHash },
  });

  const users = Array.from({ length: USER_COUNT }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    passwordHash,
  }));

  await prisma.user.createMany({ data: users });

  console.log(`Seeded demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Seeded ${USER_COUNT} fake users. Password for all: ${SEED_PASSWORD}`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

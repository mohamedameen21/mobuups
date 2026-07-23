import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { prisma } from '../src/lib/prisma.js';

const USER_COUNT = 20;
const SEED_PASSWORD = 'Password123!';

const DEMO_EMAIL = 'demouser@gmail.com';
const DEMO_PASSWORD = 'password';

const PRODUCT_COUNT = 200;

const PRODUCT_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=600&q=75',
  'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=75',
];

const CATEGORIES = [
  'pizzas',
  'cakes & bakery',
  'burgers',
  'salads & bowls',
  'pasta & Italian',
  'desserts',
  'beverages',
];

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

async function prepareLocalImagePool(): Promise<string[]> {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const localPaths: string[] = [];

  for (let i = 0; i < PRODUCT_IMAGE_POOL.length; i++) {
    const filename = `pool-${i + 1}.jpg`;
    const filePath = path.join(UPLOADS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      try {
        const url = PRODUCT_IMAGE_POOL[i];
        const res = await fetch(url);
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(filePath, buffer);
          console.log(`Downloaded image ${i + 1}/${PRODUCT_IMAGE_POOL.length} -> ${filename}`);
        }
      } catch (err) {
        console.warn(`Failed to download ${PRODUCT_IMAGE_POOL[i]}, will fallback to CDN url`, err);
        localPaths.push(PRODUCT_IMAGE_POOL[i]);
        continue;
      }
    }

    localPaths.push(`/uploads/${filename}`);
  }

  return localPaths;
}

async function main() {
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();

  console.log('Downloading/verifying 16 local image assets...');
  const localImagePool = await prepareLocalImagePool();

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

  const products = Array.from({ length: PRODUCT_COUNT }, (_, index) => {
    const category = CATEGORIES[index % CATEGORIES.length];
    const imagePath = localImagePool[index % localImagePool.length];

    let name = '';
    if (category === 'pizzas') {
      name = `${faker.helpers.arrayElement(['Artisanal', 'Wood-Fired', 'Classic', 'Truffle', 'Spicy'])} ${faker.helpers.arrayElement(['Pepperoni', 'Margherita', 'Four-Cheese', 'BBQ Chicken', 'Hawaiian', 'Veggie Supreme'])} Pizza`;
    } else if (category === 'cakes & bakery') {
      name = `${faker.helpers.arrayElement(['Red Velvet', 'Belgian Chocolate', 'Strawberry Shortcake', 'Lemon Chiffon', 'Caramel Macchiato'])} ${faker.helpers.arrayElement(['Cake', 'Tart', 'Cheesecake', 'Croissant', 'Pastry'])}`;
    } else if (category === 'burgers') {
      name = `${faker.helpers.arrayElement(['Smash', 'Double Bacon', 'Avocado Swiss', 'Truffle Mushroom', 'Crispy Chicken'])} Burger`;
    } else if (category === 'salads & bowls') {
      name = `${faker.helpers.arrayElement(['Mediterranean', 'Caesar', 'Quinoa Power', 'Ahi Tuna Poke', 'Greek Farmhouse'])} Bowl`;
    } else if (category === 'pasta & Italian') {
      name = `${faker.helpers.arrayElement(['Creamy Carbonara', 'Pesto Penne', 'Seafood Linguine', 'Truffle Ravioli', 'Bolognese'])}`;
    } else if (category === 'desserts') {
      name = `${faker.helpers.arrayElement(['Molten Lava', 'Tiramisu', 'Macaron Trio', 'Churros', 'Gelato Sundae'])}`;
    } else {
      name = `${faker.helpers.arrayElement(['Matcha Latte', 'Cold Brew', 'Sparkling Berry Brew', 'Iced Chai', 'Fresh Smoothie'])}`;
    }

    return {
      name,
      description: faker.commerce.productDescription(),
      price: faker.commerce.price({ min: 4.99, max: 89.99 }),
      stock: faker.number.int({ min: 0, max: 150 }),
      category,
      imageUrl: imagePath,
    };
  });

  await prisma.product.createMany({ data: products });

  console.log(`Seeded demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Seeded ${USER_COUNT} fake users. Password for all: ${SEED_PASSWORD}`);
  console.log(`Seeded ${products.length} products with local image paths across ${CATEGORIES.length} categories.`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

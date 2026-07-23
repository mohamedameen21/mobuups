import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function createTempTestImage(): string {
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const filePath = path.join(tmpDir, 'e2e-test-pizza.jpg');
  const minimalJpg = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
    'base64'
  );
  fs.writeFileSync(filePath, minimalJpg);
  return filePath;
}

test('Complete Single End-to-End User Journey (Public Browsing, Negative Auth Checks, Login, Upload & CRUD)', async ({ page }) => {
  // -------------------------------------------------------------
  // STEP 1: Public Catalog Browsing & Laravel-Style Pagination
  // -------------------------------------------------------------
  await page.goto('/products');
  await expect(page.getByRole('heading', { name: 'Products', level: 1 })).toBeVisible();

  // Test pagination buttons
  const page1Btn = page.getByRole('button', { name: 'Page 1', exact: true });
  const page2Btn = page.getByRole('button', { name: 'Page 2', exact: true });

  await expect(page1Btn).toBeVisible();
  await expect(page2Btn).toBeVisible();

  // Click Page 2
  await page2Btn.click();
  await page.waitForTimeout(500);

  // Click Page 1 to return
  await page1Btn.click();
  await page.waitForTimeout(500);

  // -------------------------------------------------------------
  // STEP 2: Category Filtering & Search
  // -------------------------------------------------------------
  await page.getByRole('combobox', { name: 'Filter by category' }).selectOption('pizzas');
  await page.waitForTimeout(400);

  // Reset category filter
  await page.getByRole('combobox', { name: 'Filter by category' }).selectOption('');

  // Search by keyword 'Burger'
  const searchInput = page.getByRole('searchbox', { name: 'Search products' });
  await searchInput.fill('Burger');
  await page.waitForTimeout(500);
  await expect(page.getByRole('heading', { level: 3, name: /Burger/i }).first()).toBeVisible();

  // Clear search
  await searchInput.fill('');
  await page.waitForTimeout(400);

  // -------------------------------------------------------------
  // STEP 3: Negative Authorization Check (Attempt protected route while signed out)
  // -------------------------------------------------------------
  await page.goto('/products/new');
  await expect(page.getByText('Access Restricted')).toBeVisible();
  await expect(page.getByText('You are unauthorized. Please log in to access this page.')).toBeVisible();

  // -------------------------------------------------------------
  // STEP 4: Login Operation
  // -------------------------------------------------------------
  await page.getByRole('link', { name: 'Log in' }).first().click();
  await expect(page).toHaveURL('/login');

  await page.getByLabel('Email').fill('demouser@gmail.com');
  await page.locator('#password').fill('password');
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page.getByText('Signed in as Demo User')).toBeVisible();

  // -------------------------------------------------------------
  // STEP 5: Authenticated File Upload & Product CRUD (Create, Edit, Delete)
  // -------------------------------------------------------------
  await page.getByRole('link', { name: 'Add product' }).click();
  await expect(page).toHaveURL('/products/new');
  await expect(page.locator('[data-slot="card-title"]', { hasText: 'Add product' })).toBeVisible();

  const uniqueName = `E2E Pizza ${Date.now().toString().slice(-4)}`;

  // 5a. Create Product & Upload Image
  await page.getByLabel('Name').fill(uniqueName);
  await page.getByLabel('Description').fill('Freshly baked E2E test pizza with truffle oil.');
  await page.getByLabel('Price (USD)').fill('24.99');
  await page.getByLabel('Stock').fill('35');
  await page.getByLabel('Category').fill('pizzas');

  const testImagePath = createTempTestImage();
  await page.getByLabel('Product Image').setInputFiles(testImagePath);
  await expect(page.getByText(/Uploaded image path: \/uploads\//)).toBeVisible();

  await page.getByRole('button', { name: 'Add product' }).click();

  await expect(page).toHaveURL('/products');
  await searchInput.fill(uniqueName);
  await page.waitForTimeout(500);
  await expect(page.getByRole('heading', { name: uniqueName })).toBeVisible();

  // 5b. Authenticated User Edits Product
  await page.getByRole('link', { name: 'Edit' }).first().click();
  await expect(page.locator('[data-slot="card-title"]', { hasText: 'Edit product' })).toBeVisible();

  await page.getByLabel('Price (USD)').fill('29.99');
  await page.getByLabel('Stock').fill('50');
  await page.getByRole('button', { name: 'Update product' }).click();

  await searchInput.fill(uniqueName);
  await page.waitForTimeout(500);
  await expect(page.getByText('$29.99 · 50 in stock')).toBeVisible();

  // 5c. Authenticated User Deletes Product
  await page.getByRole('button', { name: 'Delete' }).first().click();
  await expect(page.getByText('Delete product?')).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).last().click();

  await expect(page.getByText('No products found.')).toBeVisible();
});

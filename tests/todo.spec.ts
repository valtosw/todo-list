import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const addTodo = async (page: Page, text: string) => {
  await page.getByPlaceholder('Add a new task...').fill(text);
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.locator('.todo-item-container').getByText(text)).toBeVisible();
};

const clearAllTodos = async (page: Page) => {
  while (await page.locator('.delete-button').count() > 0) {
    await page.locator('.delete-button').first().click();
    await page.waitForTimeout(100); 
  }
};

test.describe('To-Do List E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Loading...')).toBeHidden({ timeout: 10000 });
    await clearAllTodos(page);
  });

  test('should allow a user to add a to-do item', async ({ page }) => {
    await addTodo(page, 'New test task');
    await expect(page.locator('.todo-item-container')).toHaveCount(1);
    await expect(page.locator('.todo-text')).toHaveText('New test task');
  });

  test('should allow a user to mark a to-do item as completed', async ({ page }) => {
    await addTodo(page, 'Task to complete');
    
    const todoItem = page.locator('.todo-item-container');
    await todoItem.getByRole('checkbox').check();
    
    await expect(todoItem).toHaveClass(/completed/);
  });

  test('should allow a user to delete a to-do item', async ({ page }) => {
    await addTodo(page, 'Task to delete');
    
    await expect(page.locator('.todo-item-container')).toHaveCount(1);
    await page.locator('.delete-button').click();
    
    await expect(page.locator('.todo-item-container')).toHaveCount(0);
  });
  
  test('should persist todos after a page reload', async ({ page }) => {
    await addTodo(page, 'Persistent task');
    await expect(page.locator('.todo-item-container')).toHaveCount(1);
    
    await page.reload();
    
    await expect(page.getByText('Loading...')).toBeHidden({ timeout: 10000 });
    await expect(page.locator('.todo-item-container')).toHaveCount(1);
    await expect(page.locator('.todo-text')).toHaveText('Persistent task');
  });

  test('should allow a user to reorder items using drag and drop', async ({ page }) => {
    await addTodo(page, 'Item 1');
    await addTodo(page, 'Item 2');
    
    const item1 = page.locator('.todo-item-container').filter({ hasText: 'Item 1' });
    const item2 = page.locator('.todo-item-container').filter({ hasText: 'Item 2' });
    
    await item2.locator('.drag-handle').dragTo(item1);

    await expect(page.locator('.todo-item-container .todo-text').first()).toHaveText('Item 2');
  });
});

test.describe('Real-Time Collaboration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Loading...')).toBeHidden({ timeout: 10000 });
    await clearAllTodos(page);
  });

  test('should reflect additions in a second browser window', async ({ browser }) => {
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();

    await page1.goto('/');
    await page2.goto('/');
    
    await addTodo(page1, 'Real-time task');

    await expect(page2.locator('.todo-text').getByText('Real-time task')).toBeVisible({ timeout: 5000 });

    await page1.close();
    await page2.close();
  });
  
  test('should reflect deletions in a second browser window', async ({ browser }) => {
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();

    await page1.goto('/');
    await page2.goto('/');

    await addTodo(page1, 'Task to delete live');
    
    await expect(page1.locator('.todo-item-container')).toHaveCount(1);
    await expect(page2.locator('.todo-item-container')).toHaveCount(1);

    await page2.locator('.delete-button').click();

    await expect(page1.locator('.todo-item-container')).toHaveCount(0, { timeout: 5000 });
    
    await page1.close();
    await page2.close();
  });

  test('should show a ghost item in second window when dragging in first', async ({ browser }) => {
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();
    
    await page1.goto('/');
    await page2.goto('/');
    
    await addTodo(page1, 'Item A');
    await addTodo(page1, 'Item B');
    
    await expect(page2.locator('.todo-text').first()).toHaveText('Item A');

    const itemB_page1 = page1.locator('.todo-item-container').filter({ hasText: 'Item B' });
    const itemA_page1 = page1.locator('.todo-item-container').filter({ hasText: 'Item A' });
    
    await itemB_page1.locator('.drag-handle').hover();
    await page1.mouse.down();
    
    await itemA_page1.hover();

    await expect(page2.locator('.ghost-item')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('.ghost-item').locator('.todo-text')).toHaveText('Item B');

    await page1.mouse.up();
    await expect(page2.locator('.ghost-item')).toBeHidden();
    
    await page1.close();
    await page2.close();
  });
});

test.afterEach(async ({ page }) => {
  if (process.env.VITE_COVERAGE) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coverage = await page.evaluate(() => (window as any).__coverage__);

    if (coverage) {
      if (!fs.existsSync('.nyc_output')) {
        fs.mkdirSync('.nyc_output');
      }
      
      fs.writeFileSync(
        path.join('.nyc_output', `coverage-${crypto.randomUUID()}.json`),
        JSON.stringify(coverage)
      );
    }
  }
});
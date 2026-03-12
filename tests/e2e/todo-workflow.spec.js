const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

test.describe('Todo App', () => {
  let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('displays the app header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'To Do App' })).toBeVisible();
    await expect(page.getByText('Keep track of your tasks')).toBeVisible();
  });

  test('adds a new task with default priority', async ({ page }) => {
    const title = `New task ${Date.now()}`;
    await todoPage.addTask(title);
    await expect(todoPage.getTaskItem(title)).toBeVisible();
    await expect(todoPage.getTaskItem(title).locator('.priority-badge')).toHaveText('medium');
  });

  test('adds a task with high priority and due date', async ({ page }) => {
    const title = `High priority task ${Date.now()}`;
    await todoPage.addTask(title, 'high', '2026-12-31');
    await expect(todoPage.getTaskItem(title).locator('.priority-badge')).toHaveText('high');
    await expect(todoPage.getTaskItem(title).locator('.due-date')).toBeVisible();
  });

  test('edits an existing task title and priority', async ({ page }) => {
    const original = `Edit me ${Date.now()}`;
    const updated = `Edited ${Date.now()}`;
    await todoPage.addTask(original, 'medium');
    await todoPage.editTask(original, updated, 'low');
    await expect(page.getByText(updated)).toBeVisible();
    await expect(page.getByText(original)).not.toBeVisible();
    await expect(todoPage.getTaskItem(updated).locator('.priority-badge')).toHaveText('low');
  });

  test('marks a task as complete and shows strikethrough', async ({ page }) => {
    const title = `Complete me ${Date.now()}`;
    await todoPage.addTask(title);
    await todoPage.toggleComplete(title);
    await expect(todoPage.getTaskItem(title)).toHaveClass(/task-completed/);
  });

  test('deletes a task', async ({ page }) => {
    const title = `Delete me ${Date.now()}`;
    await todoPage.addTask(title);
    await expect(page.getByText(title)).toBeVisible();
    await todoPage.deleteTask(title);
    await expect(page.getByText(title)).not.toBeVisible();
  });

  test('sorts tasks by priority — high appears before low', async ({ page }) => {
    await todoPage.sortBy('priority');
    const firstBadge = page.locator('.priority-badge').first();
    await expect(firstBadge).toHaveText('high');
  });

  test('sort control is visible and changes value', async ({ page }) => {
    const sortSelect = page.locator('#sort-by');
    await expect(sortSelect).toBeVisible();
    await sortSelect.selectOption('due_date');
    await expect(sortSelect).toHaveValue('due_date');
    await sortSelect.selectOption('date_added');
    await expect(sortSelect).toHaveValue('date_added');
  });
});

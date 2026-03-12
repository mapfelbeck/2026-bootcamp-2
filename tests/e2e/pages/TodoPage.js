class TodoPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
    await this.page.getByRole('list', { name: 'Task list' }).waitFor({ state: 'visible' });
  }

  async addTask(title, priority = 'medium', dueDate = '') {
    await this.page.getByPlaceholder('Task title').fill(title);
    if (priority !== 'medium') {
      await this.page.locator('#new-priority').selectOption(priority);
    }
    if (dueDate) {
      await this.page.locator('#new-due-date').fill(dueDate);
    }
    await this.page.getByRole('button', { name: 'Add Task' }).click();
    await this.page.getByText(title).waitFor({ state: 'visible' });
  }

  getTaskItem(title) {
    return this.page.locator('li').filter({ hasText: title });
  }

  async editTask(title, newTitle, newPriority = null) {
    await this.getTaskItem(title).getByRole('button', { name: 'Edit' }).click();
    const editForm = this.page.locator('.edit-form');
    await editForm.getByRole('textbox', { name: 'Task title' }).fill(newTitle);
    if (newPriority) {
      await editForm.locator('select').selectOption(newPriority);
    }
    await editForm.getByRole('button', { name: 'Save' }).click();
  }

  async deleteTask(title) {
    await this.getTaskItem(title).getByRole('button', { name: 'Delete' }).click();
  }

  async toggleComplete(title) {
    await this.getTaskItem(title).locator('input[type="checkbox"]').click();
  }

  async sortBy(value) {
    await this.page.locator('#sort-by').selectOption(value);
  }
}

module.exports = { TodoPage };

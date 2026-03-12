const request = require('supertest');
const { app, db } = require('../../src/app');

afterAll(() => { if (db) db.close(); });

describe('Tasks API — integration workflows', () => {
  test('complete lifecycle: create → edit → toggle complete → delete', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/tasks')
      .send({ title: 'Lifecycle task', priority: 'medium' });
    expect(createRes.status).toBe(201);
    const { id } = createRes.body;

    // Verify it appears in the list
    const listRes = await request(app).get('/api/tasks');
    expect(listRes.status).toBe(200);
    const found = listRes.body.find(t => t.id === id);
    expect(found).toBeDefined();
    expect(found.completed).toBe(0);

    // Edit
    const editRes = await request(app)
      .put(`/api/tasks/${id}`)
      .send({ title: 'Updated lifecycle task', priority: 'high', due_date: '2026-12-01' });
    expect(editRes.status).toBe(200);
    expect(editRes.body.title).toBe('Updated lifecycle task');
    expect(editRes.body.priority).toBe('high');

    // Toggle complete
    const completeRes = await request(app).patch(`/api/tasks/${id}/complete`);
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.completed).toBe(1);

    // Toggle back
    const uncompleteRes = await request(app).patch(`/api/tasks/${id}/complete`);
    expect(uncompleteRes.status).toBe(200);
    expect(uncompleteRes.body.completed).toBe(0);

    // Delete
    const deleteRes = await request(app).delete(`/api/tasks/${id}`);
    expect(deleteRes.status).toBe(200);

    // Verify gone
    const finalList = await request(app).get('/api/tasks');
    expect(finalList.body.find(t => t.id === id)).toBeUndefined();
  });

  test('sort by priority returns high-priority tasks first', async () => {
    await request(app).post('/api/tasks').send({ title: 'Low sort task', priority: 'low' });
    await request(app).post('/api/tasks').send({ title: 'High sort task', priority: 'high' });

    const res = await request(app).get('/api/tasks?sort=priority');
    expect(res.status).toBe(200);

    const priorities = res.body.map(t => t.priority);
    const firstHighIdx = priorities.indexOf('high');
    const lastLowIdx = priorities.lastIndexOf('low');
    expect(firstHighIdx).toBeLessThan(lastLowIdx);
  });

  test('sort by due_date returns tasks with earliest due dates first', async () => {
    await request(app).post('/api/tasks').send({ title: 'Far future', priority: 'medium', due_date: '2030-12-31' });
    await request(app).post('/api/tasks').send({ title: 'Near future', priority: 'medium', due_date: '2026-06-01' });

    const res = await request(app).get('/api/tasks?sort=due_date');
    expect(res.status).toBe(200);

    const withDates = res.body.filter(t => t.due_date);
    const dates = withDates.map(t => t.due_date);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] >= dates[i - 1]).toBe(true);
    }
  });

  test('editing a task preserves fields not included in the update', async () => {
    const task = await request(app)
      .post('/api/tasks')
      .send({ title: 'Preserve fields', priority: 'high', due_date: '2026-09-01' });
    const { id } = task.body;

    const edited = await request(app).put(`/api/tasks/${id}`).send({ title: 'New title only' });
    expect(edited.body.priority).toBe('high');
    expect(edited.body.due_date).toBe('2026-09-01');
  });
});

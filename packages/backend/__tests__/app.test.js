const request = require('supertest');
const { app, db } = require('../src/app');

afterAll(() => { if (db) db.close(); });

const createTask = async (title = 'Test Task', priority = 'medium', due_date = null) => {
  const res = await request(app).post('/api/tasks').send({ title, priority, due_date });
  expect(res.status).toBe(201);
  return res.body;
};

describe('API Endpoints', () => {
  describe('GET /api/tasks', () => {
    it('returns all tasks with expected fields', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const task = res.body[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('due_date');
      expect(task).toHaveProperty('completed');
      expect(task).toHaveProperty('created_at');
    });

    it('accepts sort=priority query param', async () => {
      const res = await request(app).get('/api/tasks?sort=priority');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('accepts sort=due_date query param', async () => {
      const res = await request(app).get('/api/tasks?sort=due_date');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/tasks', () => {
    it('creates a task with default medium priority', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'New Task' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New Task');
      expect(res.body.priority).toBe('medium');
      expect(res.body.completed).toBe(0);
    });

    it('creates a task with explicit low priority and due date', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Low task', priority: 'low', due_date: '2026-12-31' });
      expect(res.status).toBe(201);
      expect(res.body.priority).toBe('low');
      expect(res.body.due_date).toBe('2026-12-31');
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/api/tasks').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Task title is required');
    });

    it('returns 400 when title is empty', async () => {
      const res = await request(app).post('/api/tasks').send({ title: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Task title is required');
    });

    it('returns 400 for invalid priority', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'Task', priority: 'urgent' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Priority must be low, medium, or high');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('updates title, priority and due_date', async () => {
      const task = await createTask('Original');
      const res = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ title: 'Updated', priority: 'high', due_date: '2026-06-01' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated');
      expect(res.body.priority).toBe('high');
      expect(res.body.due_date).toBe('2026-06-01');
    });

    it('supports partial update (only priority)', async () => {
      const task = await createTask('Partial', 'low');
      const res = await request(app).put(`/api/tasks/${task.id}`).send({ priority: 'high' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Partial');
      expect(res.body.priority).toBe('high');
    });

    it('returns 404 for missing task', async () => {
      const res = await request(app).put('/api/tasks/999999').send({ title: 'Ghost' });
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app).put('/api/tasks/abc').send({ title: 'Task' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when title updated to empty', async () => {
      const task = await createTask('Will break');
      const res = await request(app).put(`/api/tasks/${task.id}`).send({ title: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/tasks/:id/complete', () => {
    it('toggles completed from 0 to 1', async () => {
      const task = await createTask('Toggle me');
      expect(task.completed).toBe(0);
      const res = await request(app).patch(`/api/tasks/${task.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(1);
    });

    it('toggles completed from 1 back to 0', async () => {
      const task = await createTask('Toggle back');
      await request(app).patch(`/api/tasks/${task.id}/complete`);
      const res = await request(app).patch(`/api/tasks/${task.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(0);
    });

    it('returns 404 for missing task', async () => {
      const res = await request(app).patch('/api/tasks/999999/complete');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app).patch('/api/tasks/abc/complete');
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('deletes an existing task', async () => {
      const task = await createTask('Delete me');
      const res = await request(app).delete(`/api/tasks/${task.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Task deleted successfully', id: task.id });
      const again = await request(app).delete(`/api/tasks/${task.id}`);
      expect(again.status).toBe(404);
    });

    it('returns 404 for missing task', async () => {
      const res = await request(app).delete('/api/tasks/999999');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app).delete('/api/tasks/abc');
      expect(res.status).toBe(400);
    });
  });
});
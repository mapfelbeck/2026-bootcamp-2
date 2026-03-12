import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const mockTasks = [
  { id: 1, title: 'Test Task 1', priority: 'high', due_date: '2026-06-01', completed: 0, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 2, title: 'Test Task 2', priority: 'medium', due_date: null, completed: 0, created_at: '2026-01-02T00:00:00.000Z' },
];

const server = setupServer(
  rest.get('/api/tasks', (req, res, ctx) => res(ctx.status(200), ctx.json(mockTasks))),

  rest.post('/api/tasks', (req, res, ctx) => {
    const { title } = req.body;
    if (!title || title.trim() === '') return res(ctx.status(400), ctx.json({ error: 'Task title is required' }));
    return res(ctx.status(201), ctx.json({
      id: 3, title, priority: req.body.priority || 'medium',
      due_date: req.body.due_date || null, completed: 0, created_at: new Date().toISOString(),
    }));
  }),

  rest.put('/api/tasks/:id', (req, res, ctx) => {
    const task = mockTasks.find(t => t.id === parseInt(req.params.id));
    if (!task) return res(ctx.status(404), ctx.json({ error: 'Task not found' }));
    return res(ctx.status(200), ctx.json({ ...task, ...req.body }));
  }),

  rest.patch('/api/tasks/:id/complete', (req, res, ctx) => {
    const task = mockTasks.find(t => t.id === parseInt(req.params.id));
    if (!task) return res(ctx.status(404), ctx.json({ error: 'Task not found' }));
    return res(ctx.status(200), ctx.json({ ...task, completed: task.completed ? 0 : 1 }));
  }),

  rest.delete('/api/tasks/:id', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ message: 'Task deleted successfully', id: parseInt(req.params.id) }))
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the header', async () => {
    await act(async () => { render(<App />); });
    expect(screen.getByRole('heading', { name: 'To Do App' })).toBeInTheDocument();
    expect(screen.getByText('Keep track of your tasks')).toBeInTheDocument();
  });

  test('shows loading state then displays tasks', async () => {
    await act(async () => { render(<App />); });
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });
  });

  test('displays priority badges for tasks', async () => {
    await act(async () => { render(<App />); });
    await waitFor(() => {
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });
  });

  test('adds a new task', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument());

    await act(async () => { await user.type(screen.getByPlaceholderText('Task title'), 'New Test Task'); });
    await act(async () => { await user.click(screen.getByText('Add Task')); });

    await waitFor(() => expect(screen.getByText('New Test Task')).toBeInTheDocument());
  });

  test('enters edit mode when Edit is clicked', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Test Task 1')).toBeInTheDocument());

    await act(async () => { await user.click(screen.getAllByText('Edit')[0]); });

    expect(screen.getByDisplayValue('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('cancels edit mode when Cancel is clicked', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Test Task 1')).toBeInTheDocument());

    await act(async () => { await user.click(screen.getAllByText('Edit')[0]); });
    await act(async () => { await user.click(screen.getByText('Cancel')); });

    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  test('toggles task completion via checkbox', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Test Task 1')).toBeInTheDocument());

    const checkboxes = screen.getAllByRole('checkbox');
    await act(async () => { await user.click(checkboxes[0]); });

    await waitFor(() => expect(checkboxes[0]).toBeInTheDocument());
  });

  test('deletes a task', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Test Task 1')).toBeInTheDocument());

    await act(async () => { await user.click(screen.getAllByText('Delete')[0]); });

    await waitFor(() => expect(screen.queryByText('Test Task 1')).not.toBeInTheDocument());
  });

  test('renders sort control', async () => {
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Sort by:')).toBeInTheDocument();
  });

  test('shows error when fetch fails', async () => {
    server.use(rest.get('/api/tasks', (req, res, ctx) => res(ctx.status(500))));
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText(/Failed to fetch tasks/)).toBeInTheDocument());
  });

  test('shows empty state when no tasks', async () => {
    server.use(rest.get('/api/tasks', (req, res, ctx) => res(ctx.status(200), ctx.json([]))));
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('No tasks found. Add some!')).toBeInTheDocument());
  });
});
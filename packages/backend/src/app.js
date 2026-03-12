const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const db = new Database(':memory:');

const VALID_PRIORITIES = ['low', 'medium', 'high'];

const SORT_COLUMNS = {
  date_added: 'created_at',
  due_date: 'due_date',
  priority: "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END",
};

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    due_date TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

const insertStmt = db.prepare('INSERT INTO tasks (title, priority, due_date) VALUES (?, ?, ?)');

const initialTasks = [
  { title: 'Buy groceries', priority: 'high', due_date: null },
  { title: 'Read a book', priority: 'medium', due_date: null },
  { title: 'Go for a walk', priority: 'low', due_date: null },
];
initialTasks.forEach(t => insertStmt.run(t.title, t.priority, t.due_date));

console.log('In-memory database initialized with sample data');

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

app.get('/api/tasks', (req, res) => {
  try {
    const sortKey = req.query.sort || 'date_added';
    const orderCol = SORT_COLUMNS[sortKey] || SORT_COLUMNS.date_added;
    const tasks = db.prepare(`SELECT * FROM tasks ORDER BY ${orderCol} ASC`).all();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { title, priority = 'medium', due_date = null } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'Priority must be low, medium, or high' });
    }

    const result = insertStmt.run(title.trim(), priority, due_date || null);
    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Valid task ID is required' });

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const title = req.body.title !== undefined ? req.body.title : task.title;
    const priority = req.body.priority !== undefined ? req.body.priority : task.priority;
    const due_date = req.body.due_date !== undefined ? req.body.due_date : task.due_date;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'Priority must be low, medium, or high' });
    }

    db.prepare('UPDATE tasks SET title = ?, priority = ?, due_date = ? WHERE id = ?')
      .run(title.trim(), priority, due_date || null, id);
    res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.patch('/api/tasks/:id/complete', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Valid task ID is required' });

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    db.prepare('UPDATE tasks SET completed = ? WHERE id = ?').run(task.completed ? 0 : 1, id);
    res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
  } catch (error) {
    console.error('Error toggling task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Valid task ID is required' });

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ message: 'Task deleted successfully', id });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = { app, db };
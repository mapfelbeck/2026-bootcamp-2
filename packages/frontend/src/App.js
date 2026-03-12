import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const PRIORITIES = ['low', 'medium', 'high'];

const SORT_OPTIONS = [
  { value: 'date_added', label: 'Date Added' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
];

const apiFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
};

function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const ok = await onAdd({ title: title.trim(), priority, due_date: dueDate || null });
    if (ok) { setTitle(''); setPriority('medium'); setDueDate(''); }
  };

  return (
    <form onSubmit={handleSubmit} className="add-task-form">
      <label htmlFor="new-title" className="sr-only">Task title</label>
      <input
        id="new-title"
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Task title"
        required
      />
      <label htmlFor="new-priority" className="sr-only">Priority</label>
      <select id="new-priority" value={priority} onChange={e => setPriority(e.target.value)}>
        {PRIORITIES.map(p => (
          <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
        ))}
      </select>
      <label htmlFor="new-due-date" className="sr-only">Due date (optional)</label>
      <input id="new-due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
      <button type="submit">Add Task</button>
    </form>
  );
}

function EditTaskForm({ task, editFields, setEditFields, onSave, onCancel }) {
  return (
    <li>
      <div className="edit-form">
        <label htmlFor={`edit-title-${task.id}`} className="sr-only">Task title</label>
        <input
          id={`edit-title-${task.id}`}
          type="text"
          value={editFields.title}
          onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))}
          placeholder="Task title"
        />
        <label htmlFor={`edit-priority-${task.id}`} className="sr-only">Priority</label>
        <select
          id={`edit-priority-${task.id}`}
          value={editFields.priority}
          onChange={e => setEditFields(f => ({ ...f, priority: e.target.value }))}
        >
          {PRIORITIES.map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        <label htmlFor={`edit-due-${task.id}`} className="sr-only">Due date (optional)</label>
        <input
          id={`edit-due-${task.id}`}
          type="date"
          value={editFields.due_date}
          onChange={e => setEditFields(f => ({ ...f, due_date: e.target.value }))}
        />
        <button type="button" onClick={onSave}>Save</button>
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </li>
  );
}

function TaskItem({ task, onEdit, onDelete, onToggle }) {
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState({
    title: task.title, priority: task.priority, due_date: task.due_date || '',
  });

  const handleSave = async () => {
    if (!editFields.title.trim()) return;
    const ok = await onEdit(task.id, { ...editFields, due_date: editFields.due_date || null });
    if (ok) setEditing(false);
  };

  if (editing) {
    return (
      <EditTaskForm
        task={task}
        editFields={editFields}
        setEditFields={setEditFields}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <li className={task.completed ? 'task-completed' : ''}>
      <input
        type="checkbox"
        checked={!!task.completed}
        onChange={() => onToggle(task.id)}
        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <span className="task-title">{task.title}</span>
      <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
      {task.due_date && <span className="due-date">Due: {task.due_date}</span>}
      <div className="task-actions">
        <button type="button" className="edit-btn" onClick={() => setEditing(true)}>Edit</button>
        <button type="button" className="delete-btn" onClick={() => onDelete(task.id)}>Delete</button>
      </div>
    </li>
  );
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('date_added');

  const fetchTasks = useCallback(async (sort) => {
    try {
      setLoading(true);
      const result = await apiFetch(`/api/tasks?sort=${sort}`);
      setTasks(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(sortBy); }, [fetchTasks, sortBy]);

  const handleAdd = async (taskData) => {
    try {
      const task = await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(taskData) });
      setTasks(prev => [task, ...prev]);
      setError(null);
      return true;
    } catch (err) {
      setError('Error adding task: ' + err.message);
      return false;
    }
  };

  const handleEdit = async (taskId, updates) => {
    try {
      const updated = await apiFetch(`/api/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(updates) });
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      setError(null);
      return true;
    } catch (err) {
      setError('Error updating task: ' + err.message);
      return false;
    }
  };

  const handleToggle = async (taskId) => {
    try {
      const updated = await apiFetch(`/api/tasks/${taskId}/complete`, { method: 'PATCH' });
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      setError(null);
    } catch (err) {
      setError('Error updating task: ' + err.message);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setError(null);
    } catch (err) {
      setError('Error deleting task: ' + err.message);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>To Do App</h1>
        <p>Keep track of your tasks</p>
      </header>
      <main>
        <section className="add-task-section">
          <h2>Add New Task</h2>
          <AddTaskForm onAdd={handleAdd} />
        </section>
        <section className="tasks-section">
          <div className="tasks-header">
            <h2>Tasks</h2>
            <div className="sort-control">
              <label htmlFor="sort-by">Sort by:</label>
              <select id="sort-by" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          {loading && <p>Loading tasks...</p>}
          {error && <p className="error" role="alert">{error}</p>}
          {!loading && !error && (
            <ul aria-label="Task list">
              {tasks.length > 0
                ? tasks.map(t => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggle={handleToggle}
                    />
                  ))
                : <li>No tasks found. Add some!</li>}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
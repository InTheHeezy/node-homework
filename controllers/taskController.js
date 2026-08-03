const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

async function create(req, res) {
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ message: error.message });

  const activeUserId = global.user_id;

  const isCompletedValue = value.isCompleted ?? false;

  const task = await pool.query(
    `INSERT INTO tasks (title, is_completed, user_id) 
    VALUES ( $1, $2, $3 ) 
    RETURNING id, title, is_completed`,
    [value.title, isCompletedValue, activeUserId]
  );

  const savedTask = task.rows[0];

  return res.status(201).json(savedTask);
}

async function index(req, res) {
  
  const activeUserId = global.user_id;

  const tasks = await pool.query(
    `SELECT id, title, is_completed 
    FROM tasks 
    WHERE user_id = $1`,
    [activeUserId]
  )

  const savedTask = tasks.rows;

  return res.status(200).json(savedTask);
}

async function show(req, res) {
  const taskId = parseInt(req.params.id);

  if(isNaN(taskId)) return res.status(400).json({ message: "Invalid task ID format" });

  const activeUserId = global.user_id;

  const result = await pool.query(
    `SELECT id, title, is_completed
    FROM TASKS
    WHERE id = $1 AND user_id = $2`,
    [taskId, activeUserId]
  );

  if(result.rows.length === 0) return res.status(404).json({ message: "Task not found" });
  
  const showTask = result.rows[0];

  return res.status(200).json(showTask);

}

async function update(req, res) {
  const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ message: error.message });

  const activeUserId = global.user_id;

  let keys = Object.keys(value);
  keys = keys.map((key) => key === "isCompleted" ? "is_completed" : key);

  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;
  const result = await pool.query(
    `UPDATE tasks SET ${setClauses} 
    WHERE id = ${idParm} AND user_id = ${userParm} 
    RETURNING id, title, is_completed`, 
    [...Object.values(value), req.params.id, activeUserId]
  );

  if(result.rows.length === 0) {
    return res.status(404).json({ message: "Task not found" });
  }

  const updatedTask = result.rows[0];
  return res.status(200).json(updatedTask);
}

async function deleteTask(req, res) {
  const taskId = parseInt(req.params.id);

  if(isNaN(taskId)) return res.status(400).json({ message: "Invalid task ID format" });

  const activeUserId = global.user_id;

  const result = await pool.query(
    `DELETE FROM tasks
    WHERE id = $1 AND user_id = $2
    RETURNING id, title`,
    [taskId, activeUserId]
  );

  if(result.rows.length === 0) return res.status(404).json({ message: "Task not found" });

  const deletedTask = result.rows[0];

  return res.status(200).json(deletedTask);
}

module.exports = {
    create,
    index,
    show,
    update,
    deleteTask,
    taskCounter
}
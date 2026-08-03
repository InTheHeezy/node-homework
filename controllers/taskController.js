const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("./db/pg-pool");

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

  const task = await pool.query(
    `INSERT INTO tasks (title, is_completed, user_id) 
    VALUES ( $1, $2, $3 ) 
    RETURNING id, title, is_completed`,
    [value.title, value.is_completed, global.user_id.id]
  );

  const savedTask = task.rows[0];

  return res.status(201).json(savedTask);
}

async function index(req, res) {
  const tasks = await pool.query(
    `SELECT id, title, is_completed 
    FROM tasks 
    WHERE user_id = $1`,
    [global.user_id.id]
  )

  const savedTask = tasks.rows;

  if(savedTask.length === 0) {
    return res.status(404).json({ message: "No tasks found" });
  }

  return res.status(200).json(savedTask);
}

async function show(req, res) {
  const taskId = parseInt(req.params.id);

  if(isNaN(taskId)) return res.status(400).json({ message: "Invalid task ID format" });

  const task = global.tasks.find((t) => t.id === taskId);

  if(!task) return res.status(404).json({ message: "Task not found" });
  
  if(task.userId !== global.user_id.email) {
    return res.status(404).json({ message: "Unauthorized access" });
  }

  const { userId, ...sanitizedTask } = task;

  return res.status(200).json(sanitizedTask);

}

async function update(req, res) {
  const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ message: error.message });

  let keys = Object.keys(value);
  keys = keys.map((key) => key === "isCompleted" ? "is_completed" : key);
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;
  const updatedTask = await pool.query(
    `UPDATE tasks SET ${setClauses} 
    WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`, 
    [...Object.values(taskChange), req.params.id, global.user_id]
  );

  if(updatedTask.rows.length === 0) {
    return res.status(404).json({ message: "Task not found" });
  }

  const updatedTask = result.rows[0];
  return res.status(200).json(updatedTask);
}

async function deleteTask(req, res) {
  const taskId = parseInt(req.params.id);

  if(isNaN(taskId)) return res.status(400).json({ message: "Invalid task ID format" });

  const taskIndex = global.tasks.findIndex((t) => t.id === taskId && t.userId === global.user_id.email);

  if(taskIndex === -1) return res.status(404).json({ message: "Task not found" });

  const [deletedTask] = global.tasks.splice(taskIndex, 1);

  const { userId, ...sanitizedTask } = deletedTask;
  return res.status(200).json(sanitizedTask);
}

module.exports = {
    create,
    index,
    show,
    update,
    deleteTask,
    taskCounter
}
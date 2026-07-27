const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

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

  const newTask = {
    id: taskCounter(),
    userId: global.user_id.email,
    ...value
  };

  global.tasks.push(newTask);

  const { userId, ...sanitizedTask } = newTask;

  return res.status(201).json(sanitizedTask);
}

async function index(req, res) {
  const userTasks = global.tasks.filter(
    (task) => task.userId === global.user_id.email,
  );

  if(userTasks.length === 0) {
    return res.status(404).json({ message: "No tasks found" });
  }

  const sanitizedTask = userTasks.map(({ userId, ...cleanTask }) => cleanTask);
  
  return res.status(200).json(sanitizedTask);
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

  const taskId = parseInt(req.params.id);

  if(isNaN(taskId)) return res.status(400).json({ message: "Invalid task ID format" });

  const task = global.tasks.find((t) => t.id === taskId && t.userId === global.user_id.email);

  if(!task) return res.status(404).json({ message: "Task not found" });
  
  Object.assign(task, value);

  const { userId, ...sanitizedTask } = task;
  return res.status(200).json(sanitizedTask);
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
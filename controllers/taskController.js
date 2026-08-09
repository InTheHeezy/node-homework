const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");

async function create(req, res) {
  //if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ message: error.message });

  const activeUserId = global.user_id;
  
  const isCompletedValue = value.isCompleted ?? false;

  const newTask = await prisma.task.create({
    data: { 
      title : value.title, 
      is_completed : isCompletedValue, 
      user_id : activeUserId 
    },
    select: {
      id: true,  
      title: true, 
      is_completed: true 
    }
  });
 
  // const task = await pool.query(
  //   `INSERT INTO tasks (title, is_completed, user_id) 
  //   VALUES ( $1, $2, $3 ) 
  //   RETURNING id, title, is_completed`,
  //   [value.title, isCompletedValue, activeUserId]
  // );

  //const savedTask = task.rows[0];

  return res.status(201).json(newTask);
}

async function index(req, res) {
  
  const activeUserId = global.user_id;

  const tasks = await prisma.task.findMany({
  where: {
    user_id: global.user_id, // only the tasks for this user!
  },
  select: { 
    id: true, 
    title: true, 
    is_completed: true
  }
});

  //const savedTask = tasks.rows;

  // if (tasks.length === 0) {
  //   return res.status(404).json({ error: "Not Found" });
  // }

  return res.status(200).json(tasks);
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

  if(result.rows.length === 0) {
    return res.status(404).json({ error: "Not Found" });
  }
  const showTask = result.rows[0];

  return res.status(200).json(showTask);

}

async function update(req, res, next) {

  const taskId = parseInt(req.params.id);
  if (isNaN(taskId)) return res.status(400).json({ message: "Invalid task ID format" });

  const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ message: error.message });

  const activeUserId = global.user_id;

  //lets the user update 0,1,or both parts of data (title, is_completed)
  const updateData = {};
  if (value.title !== undefined) updateData.title = value.title;
  if (value.isCompleted !== undefined) updateData.is_completed = value.isCompleted;

  let updatedTask = null;
  try {
    const updatedTask = await prisma.task.update({
      data: updateData,
      where: {
        id: taskId,
        user_id: global.user_id,
      },
      select: { 
        id: true, 
        title: true, 
        is_completed: true, 
      }
    });
    return res.status(200).json(updatedTask);
  } catch (err) {
    if (err.code === "P2025" ) {
      return res.status(404).json({ message: "The task was not found."})
    } else {
      return next(err); // pass other errors to the global error handler
    }
  }
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

  if(result.rows.length === 0) {
    return res.status(404).json({ error: "Not Found" });
  }
  const deletedTask = result.rows[0];

  return res.status(200).json(deletedTask);
}

module.exports = {
    create,
    index,
    show,
    update,
    deleteTask,
}
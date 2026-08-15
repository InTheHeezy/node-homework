const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

async function create(req, res) {

  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ message: error.message });

  const activeUserId = global.user_id;
  
  const isCompletedValue = value.isCompleted ?? false;

  const newTask = await prisma.task.create({
    data: { 
      title : value.title, 
      is_completed : isCompletedValue, 
      user_id : activeUserId, 
      priority : value.priority
    },
    select: {
      id: true,  
      title: true, 
      is_completed: true, 
      priority: true
    }
  });
  return res.status(201).json({
    id: newTask.id,
    title: newTask.title,
    isCompleted: newTask.is_completed
  });
}

async function index(req, res) {
  
  const activeUserId = global.user_id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const tasks = await prisma.task.findMany({
    where: {
      user_id: activeUserId, 
    },
    select: { 
      id: true, 
      title: true, 
      is_completed: true,
      priority: true,
      created_at: true,
      User: {
        select: {
          name: true,
          email: true
        }
      }
    },
    skip : skip,
    take: limit, 
    orderBy: {
      created_at: 'desc'
    }
  });

  const totalTasks = await prisma.task.count({
    where: {
      user_id: activeUserId
    }
  });

  const pagination = {
    page, 
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1
  };

  return res.status(200).json({
    tasks,
    pagination
  });
}

async function show(req, res, next) {
  
  const taskId = parseInt(req.params.id);
  if(isNaN(taskId)) return res.status(400).json({ message: "Invalid task ID format" });

  const activeUserId = global.user_id;

  try {
    const task = await prisma.task.findUnique({
      where: {
        userTask: {
          id: taskId,
          user_id: activeUserId
        }
      },
      select: {
        id: true,
        title: true,
        is_completed: true
      }
    });
    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025" ) {
      return res.status(404).json({ message: "The task was not found."})
    } else {
      return next(err); // pass other errors to the global error handler
    }
  }
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

  try {
    const updatedTask = await prisma.task.update({
      data: updateData,
      where: {
          userTask: {
            id: taskId,
            user_id: activeUserId
        }
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

async function deleteTask(req, res, next) {
  
  const taskId = parseInt(req.params.id);
  if(isNaN(taskId)) return res.status(400).json({ message: "Invalid task ID format" });

  const activeUserId = global.user_id;

  try {
    const deletedTask = await prisma.task.delete({
      where: {
        userTask: {
          id: taskId,
          user_id: activeUserId
        }
      },
      select: { 
        id: true, 
        title: true, 
        is_completed: true, 
      }
    });
    return res.status(200).json(deletedTask);
  } catch (err) {
    if (err.code === "P2025" ) {
      return res.status(404).json({ message: "The task was not found."})
    } else {
      return next(err); // pass other errors to the global error handler
    }
  }
}

module.exports = {
    create,
    index,
    show,
    update,
    deleteTask,
}
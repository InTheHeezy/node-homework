const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

async function create(req, res) {

  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ message: error.message });

  const activeUserId = req.user.id;
  
  const isCompletedValue = value.isCompleted ?? false;

  const newTask = await prisma.task.create({
    data: { 
      title : value.title, 
      isCompleted : isCompletedValue, 
      userId : activeUserId, 
      priority : value.priority
    },
    select: {
      id: true,  
      title: true, 
      isCompleted: true, 
      priority: true
    }
  });
  return res.status(201).json({
    id: newTask.id,
    title: newTask.title,
    isCompleted: newTask.isCompleted,
    priority: newTask.priority
  });
}

async function bulkCreate(req, res, next) {
  const { tasks } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ 
      error: "Invalid request data. Expected an array of tasks." 
    });
  }

  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || 'medium',
      userId: req.user.id
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false
    });

    res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length
    });
  } catch (err) {
    return next(err);
  }
} 

async function index(req, res) {
  
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized: User ID is required" });
  }

  const activeUserId = req.user.id;
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (page < 1) {
    return res.status(400).json({ error: "Page number must be atleast 1 " });
  }
  
  if (limit < 1 || limit > 100) {
    return res.status(400).json({ error: "Limit must be between 1 and 100" });
  }

  const skip = (page - 1) * limit;

  const whereClause = { userId: req.user.id };

  const getOrderBy = (query) => {
    const validSortFields = ["title", "priority", "createdAt", "id", "isCompleted"];
    const sortBy = query.sortBy || "createdAt";
    const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";
    
    if (validSortFields.includes(sortBy)) {
      return { [sortBy]: sortDirection };
    }
    return { createdAt: "desc" }; 
};

  if (req.query.find) {
    whereClause.title = {
      contains: req.query.find,        
      mode: 'insensitive'              
    };
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: { 
      id: true, 
      title: true, 
      isCompleted: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true
        }
      }
    },
    skip : skip,
    take: limit, 
    orderBy: getOrderBy(req.query)
  });

  if (tasks.length === 0) {
    return res.status(404).json({ error: "Tasks not found" });
  }

  const totalTasks = await prisma.task.count({
    where: whereClause
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

  const activeUserId = req.user.id;

  try {
    const task = await prisma.task.findUnique({
      where: {
          id: taskId,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        userId: true,
        User: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!task || task.userId !== activeUserId) {
      return res.status(404).json({ message: "The task was not found." });
    }

    delete task.userId;

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025" ) {
      return res.status(404).json({ message: "The task was not found."})
    } else {
      return next(err); 
    }
  }
}

async function update(req, res, next) {

  const taskId = parseInt(req.params.id);
  if (isNaN(taskId)) return res.status(400).json({ message: "Invalid task ID format" });

  const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ message: error.message });

  const activeUserId = req.user.id;

  //lets the user update 0,1,2 or all 3 parts of data (title, is_completed, priority)
  const updateData = {};
  if (value.title !== undefined) updateData.title = value.title;
  if (value.isCompleted !== undefined) updateData.isCompleted = value.isCompleted;
  if (value.priority !== undefined) updateData.priority = value.priority;

  try {
    const updatedTask = await prisma.task.update({
      data: updateData,
      where: {
        id: taskId,
        userId: activeUserId
      },
      select: { 
        id: true, 
        title: true, 
        isCompleted: true, 
        priority: true
      }
    });
    return res.status(200).json(updatedTask);
  } catch (err) {
    if (err.code === "P2025" ) {
      return res.status(404).json({ message: "The task was not found."})
    } else {
      return next(err); 
    }
  }
}

async function deleteTask(req, res, next) {
  
  const taskId = parseInt(req.params.id);
  if(isNaN(taskId)) return res.status(400).json({ message: "Invalid task ID format" });

  const activeUserId = req.user.id;

  try {
    const deletedTask = await prisma.task.delete({
      where: {
          id: taskId,
          userId: activeUserId
      },
      select: { 
        id: true, 
        title: true, 
        isCompleted: true, 
      }
    });
    return res.status(200).json(deletedTask);
  } catch (err) {
    if (err.code === "P2025" ) {
      return res.status(404).json({ message: "The task was not found."})
    } else {
      return next(err); 
    }
  }
}

module.exports = {
    create,
    bulkCreate,
    index,
    show,
    update,
    deleteTask,
}
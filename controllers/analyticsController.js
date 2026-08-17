const prisma = require("../db/prisma");

async function getUserAnalytics(req, res) {

    const userId = parseInt(req.params.id);
    if(isNaN(userId)) return res.status(400).json({ message: "Invalid user ID format" });

    const userExists = await prisma.user.findUnique({
        where: { id: userId}
    });

    if(!userExists) { 
        return res.status(404).json({ message: "User not found" });
    }

    // Use groupBy to count tasks by completion status
    const taskStats = await prisma.task.groupBy({
        by: ['isCompleted'],
        where: { userId: userId },
        _count: { id: true }
    });

    // Include recent task activity with eager loading
    const recentTasks = await prisma.task.findMany({
        where: { userId: userId },
        select: {
            id: true,
            title: true,
            isCompleted: true,
            priority: true,
            createdAt: true,
            userId: true,
            User: {
                select: { name: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    // Calculate weekly progress using groupBy
    // First, calculate the date from one week ago
    // Hint: Use new Date() and setDate() to subtract 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Then use groupBy with a where clause filtering by createdAt >= oneWeekAgo
    const weeklyProgress = await prisma.task.groupBy({
        by: ['createdAt'],
        where: {
            userId: userId,
            createdAt: { gte: oneWeekAgo }
        },
        _count: { id: true }
    });

    // Using raw SQL to safely truncate the timestamp to a clean date string
    // Note: Use TO_CHAR(created_at, 'YYYY-MM-DD') if you are using PostgreSQL
    // Note: Use DATE_FORMAT(created_at, '%Y-%m-%d') if you are using MySQL
    // const dbWeeklyProgress = await prisma.$queryRaw`
    //     SELECT 
    //         TO_CHAR(created_at, 'YYYY-MM-DD') AS formatted_date, 
    //         COUNT(id)::int AS task_count
    //     FROM "Task"
    //     WHERE "userId" = ${userId} AND created_at >= ${oneWeekAgo}
    //     GROUP BY formatted_date
    //     ORDER BY formatted_date ASC;
    // `;

    // Map the raw query results to your exact expected schema format
    // const weeklyProgress = dbWeeklyProgress.map(progress => ({
    //     createdAt: progress.formatted_date,
    //     _count: { id: progress.task_count }
    // }));

    // Return response with taskStats, recentTasks, and weeklyProgress
    res.status(200).json({
        taskStats,
        recentTasks,
        weeklyProgress
    });

}

async function getUsersWithStats(req, res) {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    if (page < 1) {
        return res.status(400).json({ error: "Page number must be atleast 1 " });
    }
  
    if (limit < 1 || limit > 100) {
        return res.status(400).json({ error: "Limit must be between 1 and 100" });
    }

    const skip = (page - 1) * limit;

    const usersRaw = await prisma.user.findMany({
    include: {
        Task: {
            where: { isCompleted: false },
            select: { id: true },
            take: 5
        },
        _count: {
            select: {
                Task: true
            }
        }
    },
    skip: skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
    });

    // Transform to only include the fields we want
    const users = usersRaw.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
        _count: user._count,
        Task: user.Task
    }));

    const totalUsers = await prisma.user.count();

    const pagination = {
        page, 
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
        hasNext: page * limit < totalUsers,
        hasPrev: page > 1
    }

    res.status(200).json({
        users,
        pagination
    });

}

async function searchTasks(req, res) {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
        return res.status(400).json({ 
        error: "Search query must be at least 2 characters long" 
        });
    }
    const limit = parseInt(req.query.limit) || 20;

    const searchPattern = `%${q}%`;
    const exactMatch = q;
    const startsWith = `${q}%`;

    // Use raw SQL for complex text search with parameterized queries
    const searchResults = await prisma.$queryRaw`
    SELECT 
        t.id,
        t.title,
        t.is_completed as "isCompleted",
        t.priority,
        t.created_at as "createdAt",
        t.user_id as "userId",
        u.name as "user_name"
    FROM tasks t
    JOIN users u ON t.user_id = u.id
    WHERE t.title ILIKE ${searchPattern} 
        OR u.name ILIKE ${searchPattern}
    ORDER BY 
        CASE 
        WHEN t.title ILIKE ${exactMatch} THEN 1
        WHEN t.title ILIKE ${startsWith} THEN 2
        WHEN t.title ILIKE ${searchPattern} THEN 3
        ELSE 4
        END,
        t.created_at DESC
    LIMIT ${parseInt(limit)}
    `;

    res.status(200).json({
        results: searchResults,
        query: exactMatch,
        count: searchResults.length
    })
}

module.exports = {
    getUserAnalytics,
    getUsersWithStats,
    searchTasks
}
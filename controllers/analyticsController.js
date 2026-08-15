const prisma = require("../db/prisma");

async function taskStats(req, res) {

    const userId = parseInt(req.params.id);
    if(isNaN(userId)) return res.status(400).json({ message: "Invalid user ID format" });

    // Use groupBy to count tasks by completion status
    const taskStats = await prisma.task.groupBy({
        by: ['is_completed'],
        where: { user_id: userId },
        _count: { id: true }
    });

    // Include recent task activity with eager loading
    const recentTasks = await prisma.task.findMany({
        where: { user_id: userId },
        select: {
            id: true,
            title: true,
            is_completed: true,
            priority: true,
            created_at: true,
            user_id: true,
            User: {
                select: { name: true }
            }
        },
        orderBy: { created_at: 'desc' },
        take: 10
    });

    // Calculate weekly progress using groupBy
    // First, calculate the date from one week ago
    // Hint: Use new Date() and setDate() to subtract 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Then use groupBy with a where clause filtering by createdAt >= oneWeekAgo
    const weeklyProgress = await prisma.task.groupBy({
        by: ['created_at'],
        where: {
            user_id: userId,
            created_at: { gte: oneWeekAgo }
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

async function userStats(req, res) {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const usersRaw = await prisma.user.findMany({
    include: {
        Task: {
            where: { is_completed: false },
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
    orderBy: { created_at: 'desc' }
    });

    // Transform to only include the fields we want
    const users = usersRaw.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
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

module.exports = {
    taskStats,
    userStats
}
const prisma = require("../db/prisma");

async function getStats(req, res) {

    const userId = parseInt(req.params.id);
    if(isNaN(userId)) return res.status(400).json({ message: "Invalid user ID format" });

    // Use groupBy to count tasks by completion status
    const taskStats = await prisma.task.groupBy({
        by: ['is_completed'],
        where: { userId },
        _count: { id: true }
    });

    // Include recent task activity with eager loading
    const recentTasks = await prisma.task.findMany({
        where: { userId },
        select: {
            id: true,
            title: true,
            is_completed: true,
            priority: true,
            created_at: true,
            userId: true,
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
            userId,
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

module.exports = {
    getStats
}
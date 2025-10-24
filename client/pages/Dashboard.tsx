import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, Briefcase, Calendar, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface Task {
  _id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'In Progress' | 'Review' | 'Completed';
  dueDate?: string;
  assignee?: {
    name: string;
  };
}

interface Leave {
  _id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for real-time task updates
    socket.on('task:created', (task: any) => {
      setTasks((prev) => [task, ...prev]);
    });

    socket.on('task:updated', (task: any) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? task : t))
      );
    });

    socket.on('task:status-changed', (data: { taskId: string; status: Task['status'] }) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === data.taskId ? { ...t, status: data.status } : t))
      );
    });

    socket.on('task:deleted', (data: { id: string }) => {
      setTasks((prev) => prev.filter((t) => t._id !== data.id));
    });

    // Listen for real-time leave updates
    socket.on('leave:created', (leave: Leave) => {
      setLeaves((prev) => [leave, ...prev]);
    });

    socket.on('leave:approved', (leave: Leave) => {
      setLeaves((prev) =>
        prev.map((l) => (l._id === leave._id ? { ...l, status: 'Approved' as const } : l))
      );
    });

    socket.on('leave:rejected', (leave: Leave) => {
      setLeaves((prev) =>
        prev.map((l) => (l._id === leave._id ? { ...l, status: 'Rejected' as const } : l))
      );
    });

    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:status-changed');
      socket.off('task:deleted');
      socket.off('leave:created');
      socket.off('leave:approved');
      socket.off('leave:rejected');
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      // Fetch tasks
      const tasksRes = await fetch('/api/tasks', { credentials: 'include' });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      // Fetch leaves
      const leavesRes = await fetch('/api/leaves', { credentials: 'include' });
      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        setLeaves(leavesData.leaves || []);
      }

      // Fetch users
      const usersRes = await fetch('/api/users', { credentials: 'include' });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setTotalUsers(usersData.users?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate real-time stats
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed').length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const leavesRequested = leaves.filter((l) => l.status === 'Pending').length;
  const productivity = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const recentTasks = tasks.slice(0, 5);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </DashboardLayout>
    );
  }

  const summaryCards = [
    {
      title: 'Pending Tasks',
      value: pendingTasks,
      icon: CheckSquare,
      color: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
      link: '/dashboard/tasks',
    },
    {
      title: 'Active Projects',
      value: inProgressTasks,
      icon: Briefcase,
      color: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400',
      link: '/dashboard/tasks',
    },
    {
      title: 'Leaves Requested',
      value: leavesRequested,
      icon: Calendar,
      color: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400',
      link: '/dashboard/leaves',
    },
    {
      title: 'Productivity',
      value: `${productivity}%`,
      icon: TrendingUp,
      color: 'bg-orange-100 dark:bg-orange-900',
      iconColor: 'text-orange-600 dark:text-orange-400',
      link: '/dashboard/analytics',
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-gray-900 relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse-subtle"></div>
          <div className="absolute bottom-20 -right-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '3s' }}></div>
        </div>

        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in relative z-10">
          <div className="relative">
            <h1 className="text-5xl font-bold text-gradient mb-3">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Here's your productivity overview for today
            </p>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} to={card.link}>
                <Card className="card-hover hover-lift h-full border-0 shadow-xl animate-slide-in-up overflow-hidden group relative backdrop-blur-sm bg-white/90 dark:bg-gray-800/90"
                  style={{ animationDelay: `${index * 0.1}s` }}>
                  {/* Gradient shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                  
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-primary opacity-5 rounded-bl-full"></div>
                  
                  <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                    <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {card.title}
                    </CardTitle>
                    <div className={`${card.color} p-3 rounded-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg`}>
                      <Icon className={`w-6 h-6 ${card.iconColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-4xl font-bold text-gradient mb-3">
                      {card.value}
                    </div>
                    <div className="flex items-center text-sm text-teal-600 dark:text-teal-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                      <span>View details</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Recent Tasks Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="text-xl font-bold">Recent Tasks</CardTitle>
                <Link to="/dashboard/tasks">
                  <Button variant="outline" size="sm" className="group">
                    View All <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {recentTasks.map((task, index) => (
                    <div
                      key={task._id}
                      className="flex items-start justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-300 bg-gradient-to-r from-transparent to-transparent hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 animate-slide-in-right"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {task.title}
                        </h3>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${
                              task.priority === 'High'
                                ? 'bg-gradient-danger text-white'
                                : task.priority === 'Medium'
                                  ? 'bg-gradient-warning text-white'
                                  : 'bg-gradient-success text-white'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${
                              task.status === 'Completed'
                                ? 'bg-gradient-success text-white'
                                : task.status === 'In Progress'
                                  ? 'bg-gradient-primary text-white'
                                  : task.status === 'Review'
                                    ? 'bg-gradient-warning text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        {task.dueDate && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                        {task.assignee && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            👤 {task.assignee.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {recentTasks.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No tasks yet. Create your first task!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 animate-scale-in">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/dashboard/tasks">
                  <Button className="w-full bg-gradient-primary hover:opacity-90 text-white justify-start group shadow-lg hover:shadow-xl transition-all">
                    <CheckSquare className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-white">New Task</span>
                  </Button>
                </Link>
                <Link to="/dashboard/leaves">
                  <Button
                    variant="outline"
                    className="w-full justify-start group hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                  >
                    <Calendar className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">Request Leave</span>
                  </Button>
                </Link>
                <Link to="/dashboard/chat">
                  <Button
                    variant="outline"
                    className="w-full justify-start group hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <Briefcase className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">Team Chat</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Team Stats */}
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="text-xl font-bold">Team Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Team Members
                  </p>
                  <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                    {totalUsers}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Tasks Completed
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {completedTasks}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Total Tasks
                  </p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {tasks.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

interface Task {
  _id: string;
  status: 'Todo' | 'In Progress' | 'Review' | 'Completed';
  dueDate?: string;
  createdAt: string;
  assignee?: {
    _id: string;
    name: string;
  };
}

interface Leave {
  _id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

const COLORS = ['#16a34a', '#fbbf24', '#ef4444'];
const TASK_COLORS = ['#22c55e', '#f87171'];
const LEAVE_COLORS = ['#10b981', '#fbbf24', '#ef4444'];

export default function DashboardAnalytics() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const { socket } = useSocket();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for real-time updates
    socket.on('task:created', (task: Task) => {
      setTasks((prev) => [task, ...prev]);
    });

    socket.on('task:updated', (task: Task) => {
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
      const tasksRes = await fetch('/api/tasks', { credentials: 'include' });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      const leavesRes = await fetch('/api/leaves', { credentials: 'include' });
      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        setLeaves(leavesData.leaves || []);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate real-time statistics
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed').length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const onTimeCount = tasks.filter((t) => {
    if (!t.dueDate || t.status !== 'Completed') return false;
    return new Date(t.createdAt) <= new Date(t.dueDate);
  }).length;
  const onTimeRate = completedTasks > 0 ? Math.round((onTimeCount / completedTasks) * 100) : 0;

  const approvedLeaves = leaves.filter((l) => l.status === 'Approved').length;
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const rejectedLeaves = leaves.filter((l) => l.status === 'Rejected').length;

  // Group tasks by assignee for productivity
  const userProductivity = tasks.reduce((acc: Record<string, { completed: number; total: number }>, task) => {
    const userName = task.assignee?.name || 'Unassigned';
    if (!acc[userName]) acc[userName] = { completed: 0, total: 0 };
    acc[userName].total++;
    if (task.status === 'Completed') acc[userName].completed++;
    return acc;
  }, {});

  const teamProductivityData = Object.entries(userProductivity)
    .filter(([name]) => name !== 'Unassigned')
    .map(([name, data]) => ({
      name,
      value: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      tasks: data.total,
    }))
    .slice(0, 5);

  const teamPerformanceData = [
    { name: 'On Time', value: onTimeCount },
    { name: 'Late', value: Math.max(0, completedTasks - onTimeCount) },
    { name: 'Overdue', value: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length },
  ];

  const leaveStatisticsData = [
    { name: 'Approved', value: approvedLeaves },
    { name: 'Pending', value: pendingLeaves },
    { name: 'Rejected', value: rejectedLeaves },
  ];

  // Mock monthly data for charts (would need date grouping in real implementation)
  const taskCompletionData = [
    { month: 'Recent', completed: completedTasks, pending: pendingTasks },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-gray-900">
          <div className="text-center animate-scale-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary mb-4 animate-pulse-subtle shadow-2xl">
              <RefreshCw className="w-10 h-10 text-white animate-spin" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-semibold text-lg">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleExport = (format: 'pdf' | 'csv') => {
    const timestamp = new Date().toLocaleDateString();
    const filename = `analytics_report_${timestamp}.${format === 'pdf' ? 'pdf' : 'csv'}`;

    const avgProductivity = teamProductivityData.length > 0
      ? Math.round(teamProductivityData.reduce((sum, user) => sum + user.value, 0) / teamProductivityData.length)
      : 0;

    const data = {
      'Report Date': timestamp,
      'Total Tasks': tasks.length,
      'Completed Tasks': completedTasks,
      'Completion Rate': `${completionRate}%`,
      'On-Time Delivery': `${onTimeRate}%`,
      'Team Members': teamProductivityData.length,
      'Approved Leaves': approvedLeaves,
      'Pending Leaves': pendingLeaves,
      'Average Productivity': `${avgProductivity}%`,
    };

    if (format === 'csv') {
      const csv = Object.entries(data)
        .map(([key, value]) => `${key},${value}`)
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } else {
      // For PDF, we'd normally use a library like jspdf
      alert(`PDF export functionality would be implemented with jsPDF library.\nFilename: ${filename}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-gray-900 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl animate-pulse-subtle"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="flex items-center justify-between mb-8 animate-fade-in relative z-10">
          <div>
            <h1 className="text-5xl font-bold text-gradient mb-2">Analytics & Reports</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Team performance, task completion, and leave statistics
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport('csv')}
              variant="outline"
              className="flex items-center gap-2 hover:ring-2 ring-teal-300/50 hover:bg-white"
            >
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              className="bg-gradient-primary hover:brightness-105 hover:ring-2 ring-teal-300/50 text-white flex items-center gap-2 btn-glow ripple"
            >
              <FileText className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 relative z-10">
          <Card className="border-0 shadow-xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Task Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{completionRate}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {completedTasks} of {tasks.length} tasks
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">On-Time Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{onTimeRate}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {onTimeCount} tasks delivered on time
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Team Productivity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {teamProductivityData.length > 0
                  ? Math.round(teamProductivityData.reduce((sum, user) => sum + user.value, 0) / teamProductivityData.length)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Average across team</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Leaves</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{leaves.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {approvedLeaves} approved, {pendingLeaves} pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Stats block (bars) */}
        <Card className="mb-8 border-0 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover relative z-10">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gradient">Team Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="rounded-2xl p-5 bg-purple-50/40 dark:bg-purple-900/10">
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-3">Team Members</p>
                <div className="w-full h-6 rounded-md bg-purple-100/60 dark:bg-purple-900/30 overflow-hidden">
                  <div className="h-6 bg-gradient-primary" style={{ width: `${Math.min(100, (Object.keys(userProductivity).filter(n=>n!== 'Unassigned').length || 0) * 20)}%` }} />
                </div>
              </div>
              <div className="rounded-2xl p-5 bg-emerald-50/40 dark:bg-emerald-900/10">
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-3">Tasks Completed</p>
                <div className="w-full h-6 rounded-md bg-emerald-100/60 dark:bg-emerald-900/30 overflow-hidden">
                  <div className="h-6 bg-gradient-success" style={{ width: `${completionRate}%` }} />
                </div>
              </div>
              <div className="rounded-2xl p-5 bg-amber-50/40 dark:bg-amber-900/10">
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-3">Total Tasks</p>
                <div className="w-full h-6 rounded-md bg-amber-100/60 dark:bg-amber-900/30 overflow-hidden">
                  <div className="h-6 bg-gradient-warning" style={{ width: `${Math.min(100, tasks.length)}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 relative z-10">
          {/* Task Completion Trend */}
          <Card className="border-0 shadow-xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover">
            <CardHeader>
              <CardTitle className="text-xl">Task Completion Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={taskCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#16a34a"
                    strokeWidth={2}
                  />
                  <Line type="monotone" dataKey="pending" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Leave Statistics */}
          <Card className="border-0 shadow-xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover">
            <CardHeader>
              <CardTitle className="text-xl">Leave Statistics by Month</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leaveStatisticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="approved" stackId="a" fill="#10b981" />
                  <Bar dataKey="pending" stackId="a" fill="#fbbf24" />
                  <Bar dataKey="rejected" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Task Delivery Status */}
          <Card className="border-0 shadow-xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover">
            <CardHeader>
              <CardTitle className="text-xl">Task Delivery Status</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={teamPerformanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {teamPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Team Productivity Ranking */}
          <Card className="border-0 shadow-xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover">
            <CardHeader>
              <CardTitle className="text-xl">Team Member Productivity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamProductivityData.map((member, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {member.value}% • {member.tasks} tasks
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${member.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Table */}
        <Card className="border-0 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover relative z-10">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gradient">Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium">Month</th>
                    <th className="text-left py-3 px-4 font-medium">Tasks Completed</th>
                    <th className="text-left py-3 px-4 font-medium">Leaves Approved</th>
                    <th className="text-left py-3 px-4 font-medium">Avg. Productivity</th>
                    <th className="text-left py-3 px-4 font-medium">On-Time %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-3 px-4">January</td>
                    <td className="py-3 px-4">45</td>
                    <td className="py-3 px-4">5</td>
                    <td className="py-3 px-4">85%</td>
                    <td className="py-3 px-4">75%</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-3 px-4">February</td>
                    <td className="py-3 px-4">48</td>
                    <td className="py-3 px-4">4</td>
                    <td className="py-3 px-4">86%</td>
                    <td className="py-3 px-4">76%</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-3 px-4">March</td>
                    <td className="py-3 px-4">52</td>
                    <td className="py-3 px-4">6</td>
                    <td className="py-3 px-4">87%</td>
                    <td className="py-3 px-4">78%</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-3 px-4">April</td>
                    <td className="py-3 px-4">55</td>
                    <td className="py-3 px-4">3</td>
                    <td className="py-3 px-4">88%</td>
                    <td className="py-3 px-4">80%</td>
                  </tr>
                  <tr className="border-b dark:border-gray-700">
                    <td className="py-3 px-4">May</td>
                    <td className="py-3 px-4">58</td>
                    <td className="py-3 px-4">7</td>
                    <td className="py-3 px-4">89%</td>
                    <td className="py-3 px-4">82%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">June</td>
                    <td className="py-3 px-4">60</td>
                    <td className="py-3 px-4">5</td>
                    <td className="py-3 px-4">90%</td>
                    <td className="py-3 px-4">84%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import KanbanBoard, { KanbanTask, TaskStatus } from '@/components/Kanban/KanbanBoard';
import CreateTaskModal from '@/components/Tasks/CreateTaskModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardTasks() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for real-time task events
    socket.on('task:created', (task: any) => {
      setTasks((prev) => [transformTask(task), ...prev]);
    });

    socket.on('task:updated', (task: any) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === task._id ? transformTask(task) : t))
      );
    });

    socket.on('task:status-changed', (data: { taskId: string; status: TaskStatus }) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === data.taskId ? { ...t, status: data.status } : t))
      );
    });

    socket.on('task:deleted', (data: { id: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== data.id));
    });

    socket.on('task:comment-added', (task: any) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === task._id ? transformTask(task) : t))
      );
    });

    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:status-changed');
      socket.off('task:deleted');
      socket.off('task:comment-added');
    };
  }, [socket]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTasks((data.tasks || []).map(transformTask));
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(
          (data.users || []).map((u: any) => ({ id: u._id, name: u.name }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const transformTask = (task: any): KanbanTask => ({
    id: task._id,
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined,
    assignee: task.assignee?.name || 'Unassigned',
    assigneeId: task.assignee?._id,
    createdBy: task.createdBy?._id,
    comments: task.comments?.map((c: any) => c.text) || [],
  });

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update - update UI immediately
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          alert('You do not have permission to move this task. Only the assignee, creator, or managers can modify it.');
        } else {
          alert(errorData.error || 'Failed to move task');
        }
        // Revert on failure
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to move task:', error);
      alert('Failed to move task. Please try again.');
      // Revert on error
      fetchTasks();
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    // Optimistic update - remove from UI immediately
    const previousTasks = [...tasks];
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          alert('You do not have permission to delete tasks. Only managers and admins can delete tasks.');
        } else {
          alert(errorData.error || 'Failed to delete task');
        }
        // Revert on failure
        setTasks(previousTasks);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task. Please try again.');
      // Revert on error
      setTasks(previousTasks);
    }
  };

  const handleTaskUpdate = async (updatedTask: KanbanTask) => {
    // Optimistic update - update UI immediately
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );

    try {
      const response = await fetch(`/api/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: updatedTask.title,
          description: updatedTask.description,
          priority: updatedTask.priority,
          status: updatedTask.status,
          dueDate: updatedTask.dueDate,
          assignee: teamMembers.find((m) => m.name === updatedTask.assignee)?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          alert('You do not have permission to update this task. Only the assignee, creator, or managers can modify it.');
        } else {
          alert(errorData.error || 'Failed to update task');
        }
        // Revert on failure
        setTasks(previousTasks);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
      // Revert on error
      setTasks(previousTasks);
    }
  };

  const handleTaskCreate = async (newTask: Omit<KanbanTask, 'id'>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          status: newTask.status,
          dueDate: newTask.dueDate,
          assignee: teamMembers.find((m) => m.name === newTask.assignee)?.id,
        }),
      });

      if (!response.ok) {
        alert('Failed to create task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-gray-900">
          <div className="text-center animate-scale-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary mb-4 animate-pulse-subtle shadow-2xl">
              <RefreshCw className="w-10 h-10 text-white animate-spin" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-semibold text-lg">Loading tasks...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
            <h1 className="text-5xl font-bold text-gradient mb-3">
              Task Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {user?.role === 'employee' 
                ? 'You can only modify tasks assigned to you or created by you'
                : 'Drag and drop tasks between columns to update their status'}
            </p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-gradient-primary hover:opacity-90 text-white font-semibold shadow-xl hover:shadow-2xl transition-all group px-8 py-6 btn-glow ripple"
          >
            <Plus className="w-6 h-6 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            New Task
          </Button>
        </div>

        <div className="animate-fade-in relative z-10" style={{ animationDelay: '0.1s' }}>
          <Card className="border-0 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 card-hover">
            <CardContent className="pt-6">
              <KanbanBoard
                tasks={tasks}
                onTaskMove={handleTaskMove}
                onTaskDelete={handleTaskDelete}
                onTaskUpdate={handleTaskUpdate}
                currentUserId={user?.id}
                currentUserRole={user?.role}
              />
            </CardContent>
          </Card>
        </div>

        <CreateTaskModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onTaskCreate={handleTaskCreate}
          teamMembers={teamMembers}
        />
      </div>
    </DashboardLayout>
  );
}

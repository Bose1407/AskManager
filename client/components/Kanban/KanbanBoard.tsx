import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';

export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  assignee?: string;
  assigneeId?: string;
  createdBy?: string;
  comments?: string[];
}

interface KanbanBoardProps {
  tasks: KanbanTask[];
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskUpdate?: (task: KanbanTask) => void;
  currentUserId?: string;
  currentUserRole?: string;
}

const columns: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Completed'];

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'High':
      return 'bg-gradient-danger text-white shadow-md';
    case 'Medium':
      return 'bg-gradient-warning text-white shadow-md';
    case 'Low':
      return 'bg-gradient-success text-white shadow-md';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
};

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'Completed':
      return 'bg-gradient-success';
    case 'In Progress':
      return 'bg-gradient-primary';
    case 'Review':
      return 'bg-gradient-warning';
    default:
      return 'bg-gray-200 dark:bg-gray-700';
  }
};

export default function KanbanBoard({
  tasks,
  onTaskMove,
  onTaskDelete,
  onTaskUpdate,
  currentUserId,
  currentUserRole,
}: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null);

  // Check if user can modify a task
  const canModifyTask = (task: KanbanTask) => {
    if (!currentUserId) return false;
    const isAssignee = task.assigneeId === currentUserId;
    const isCreator = task.createdBy === currentUserId;
    const isManagerOrAdmin = currentUserRole === 'manager' || currentUserRole === 'admin';
    return isAssignee || isCreator || isManagerOrAdmin;
  };

  // Check if user can delete tasks
  const canDeleteTasks = currentUserRole === 'manager' || currentUserRole === 'admin';

  const handleDragStart = (task: KanbanTask) => {
    // Only allow drag if user can modify the task
    if (canModifyTask(task)) {
      setDraggedTask(task);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (newStatus: TaskStatus) => {
    if (draggedTask && onTaskMove && canModifyTask(draggedTask)) {
      onTaskMove(draggedTask.id, newStatus);
      setDraggedTask(null);
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column, columnIndex) => {
          const columnTasks = getTasksByStatus(column);
          return (
            <div key={column} className="space-y-4 animate-fade-in" style={{ animationDelay: `${columnIndex * 0.1}s` }}>
              {/* Column Header */}
              <div className="group flex items-center justify-between p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 hover:border-teal-200">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(column)}`}></div>
                  {column}
                </h3>
                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 group-hover:bg-teal-50 group-hover:text-teal-700 dark:group-hover:bg-teal-900/30 dark:group-hover:text-teal-300 transition-colors">
                  {columnTasks.length}
                </span>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column)}
                className={`space-y-3 p-4 rounded-xl min-h-96 transition-all duration-300 backdrop-blur-sm ${
                  draggedTask
                    ? 'bg-gradient-to-br from-teal-50/70 to-cyan-50/70 dark:from-teal-900/25 dark:to-cyan-900/25 border-2 border-dashed border-teal-400 dark:border-teal-600 scale-105 shadow-inner'
                    : 'bg-gray-50/60 dark:bg-gray-800/50 border-2 border-dashed border-transparent hover:border-teal-300 hover:shadow-inner hover:bg-teal-50/60 dark:hover:bg-teal-900/25'
                }`}
              >
                {columnTasks.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 mb-3">
                      <Plus className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No tasks yet</p>
                  </div>
                ) : (
                  columnTasks.map((task, taskIndex) => {
                    const canModify = canModifyTask(task);
                    return (
                    <div
                      key={task.id}
                      draggable={canModify}
                      onDragStart={() => handleDragStart(task)}
                      onClick={() => setSelectedTask(task)}
                      className={`group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-5 shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 animate-slide-in-up card-hover hover-lift hover:ring-2 ring-teal-400/70 hover:shadow-teal-200/50 ${
                        canModify ? 'cursor-move' : 'cursor-pointer'
                      } ${!canModify ? 'opacity-80' : ''}`}
                      style={{ animationDelay: `${taskIndex * 0.05}s` }}
                    >
                      {/* Priority indicator bar */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-xl ${getPriorityColor(task.priority)} pointer-events-none`}></div>
                      
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 pr-2 transition-all">
                        {task.title}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={`${getPriorityColor(task.priority)} px-3 py-1 text-xs font-semibold shadow-sm group-hover:shadow-md transition-shadow`}>
                            {task.priority}
                          </Badge>
                        </div>
                        {task.dueDate && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                        {task.assignee && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
                            <span className="text-sm">👤</span>
                            {task.assignee}
                          </p>
                        )}
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
              <DialogDescription>
                View and manage task details, comments, and status
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Description
                </label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {selectedTask.description || 'No description'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Priority
                  </label>
                  <Badge className={`${getPriorityColor(selectedTask.priority)} mt-2`}>
                    {selectedTask.priority}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </label>
                  <Badge className="mt-2">{selectedTask.status}</Badge>
                </div>
              </div>

              {selectedTask.dueDate && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Due Date
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {new Date(selectedTask.dueDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {selectedTask.assignee && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Assigned To
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {selectedTask.assignee}
                  </p>
                </div>
              )}

              {selectedTask.comments && selectedTask.comments.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Comments
                  </label>
                  <div className="space-y-2 mt-2">
                    {selectedTask.comments.map((comment, index) => (
                      <p
                        key={index}
                        className="text-gray-700 dark:text-gray-300 text-sm"
                      >
                        {comment}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {onTaskDelete && canDeleteTasks && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onTaskDelete(selectedTask.id);
                      setSelectedTask(null);
                    }}
                  >
                    Delete Task
                  </Button>
                )}
                {!canModifyTask(selectedTask) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    You can only view this task. Only the assignee, creator, or managers can modify it.
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

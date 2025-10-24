import mongoose, { Schema, Document } from 'mongoose';

export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface ITask extends Document {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  assignee?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  comments: Array<{
    userId: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Todo', 'In Progress', 'Review', 'Completed'],
      default: 'Todo',
    },
    dueDate: {
      type: Date,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comments: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

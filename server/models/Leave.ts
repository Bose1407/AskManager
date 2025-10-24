import mongoose, { Schema, Document } from 'mongoose';

export type LeaveType = 'Sick' | 'Casual' | 'Annual' | 'Maternity' | 'Paternity';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ILeave extends Document {
  employee: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  type: LeaveType;
  status: LeaveStatus;
  reason: string;
  daysRequested: number;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['Sick', 'Casual', 'Annual', 'Maternity', 'Paternity'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    reason: {
      type: String,
      required: true,
    },
    daysRequested: {
      type: Number,
      required: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  googleId?: string; // optional for local accounts
  email: string;
  name: string;
  profilePhoto?: string;
  role: 'manager' | 'employee' | 'admin';
  passwordHash?: string; // present for local accounts
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // allow multiple docs without googleId
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['manager', 'employee', 'admin'],
      default: 'employee',
    },
    passwordHash: {
      type: String,
      select: false, // don't include by default in queries
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

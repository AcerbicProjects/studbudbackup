import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

export const DEFAULT_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Programming', 'AI'];
// Catch-all folder that always exists and cannot be removed
export const GENERAL_SUBJECT = 'General';

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    university: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: '',
    },
    semester: {
      type: String,
      default: '',
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
    },
    // Subject folders shown on Home; documents are filed under one of these (or "General")
    subjects: {
      type: [String],
      default: () => [...DEFAULT_SUBJECTS],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export const User = model('User', userSchema);
export default User;

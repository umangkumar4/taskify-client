import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
    email: string;
    password: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    status: 'online' | 'offline' | 'away';
    lastSeen: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        firstName: String,
        lastName: String,
        avatar: {
            type: String,
            default: 'https://ui-avatars.com/api/?background=random'
        },
        bio: String,
        status: {
            type: String,
            enum: ['online', 'offline', 'away'],
            default: 'offline'
        },
        lastSeen: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);

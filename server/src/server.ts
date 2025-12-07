import dotenv from 'dotenv';
import http from 'http';
import app from './app';
import { connectDatabase } from './config/database';
import { initializeSocket } from './socket/socket';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);
app.set('io', io);

// Connect to database and start server
connectDatabase().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const socket_1 = require("./socket/socket");
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
// Create HTTP server
const server = http_1.default.createServer(app_1.default);
// Initialize Socket.io
const io = (0, socket_1.initializeSocket)(server);
app_1.default.set('io', io);
// Connect to database and start server
(0, database_1.connectDatabase)().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
    });
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});

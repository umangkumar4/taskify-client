"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const chatroom_routes_1 = __importDefault(require("./routes/chatroom.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});
// Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/users', auth_middleware_1.authMiddleware, user_routes_1.default);
app.use('/api/v1/chatrooms', auth_middleware_1.authMiddleware, chatroom_routes_1.default);
app.use('/api/v1/messages', auth_middleware_1.authMiddleware, message_routes_1.default);
// Error handling
app.use(error_middleware_1.errorHandler);
exports.default = app;

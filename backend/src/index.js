import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import fileUpload from "express-fileupload";
import path from "path";
import cors from "cors";
import fs from "fs";
import { createServer } from "http";
import cron from "node-cron";

import { initializeSocket } from "./lib/socket.js";

import { connectDB } from "./lib/db.js";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import songRoutes from "./routes/song.route.js";
import albumRoutes from "./routes/album.route.js";
import statRoutes from "./routes/stat.route.js";
import playerRoutes from "./routes/player.route.js";
import greetingRoutes from "./routes/greeting.route.js";
import deviceRoutes from "./routes/device.route.js"; // Add device routes

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
}

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

// Initialize socket and store references for device communication
const io = initializeSocket(httpServer);
app.set('socketio', io); // Store io instance for access in controllers
app.set('userSockets', new Map()); // Store user socket mappings

app.use(
    cors({
        origin: process.env.FRONTEND_URL || ["http://localhost:3000", "http://localhost:5173"],
        credentials: true,
    })
);

app.use(express.json()); // to parse req.body
app.use(clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
})); // this will add auth to req obj => req.auth
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: path.join(__dirname, "tmp"),
        createParentPath: true,
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB  max file size
        },
    })
);

// Middleware to add device-id header support
app.use((req, res, next) => {
    // Add device ID to request if provided
    if (req.headers['device-id']) {
        req.deviceId = req.headers['device-id'];
    }
    next();
});

// cron jobs
const tempDir = path.join(process.cwd(), "tmp");
cron.schedule("0 * * * *", () => {
    if (fs.existsSync(tempDir)) {
        fs.readdir(tempDir, (err, files) => {
            if (err) {
                console.error("Error reading temp directory:", err);
                return;
            }
            for (const file of files) {
                fs.unlink(path.join(tempDir, file), (unlinkErr) => {
                    if (unlinkErr) {
                        console.error("Error deleting temp file:", unlinkErr);
                    }
                });
            }
        });
    }
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/player", playerRoutes);
app.use("/api/greeting", greetingRoutes);
app.use("/api/devices", deviceRoutes); // Add device routes

// Health check endpoint for device connectivity
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        connectedSockets: io.engine.clientsCount
    });
});

// WebSocket connection info endpoint
app.get("/api/ws-info", (req, res) => {
    const userSockets = app.get('userSockets');
    res.json({
        totalConnections: io.engine.clientsCount,
        userConnections: userSockets.size,
        uptime: process.uptime()
    });
});

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
    
    // Catch-all route for SPA - must NOT catch /api routes
    app.get("*", (req, res, next) => {
        // Skip API routes - let them 404 properly if not found
        if (req.path.startsWith('/api/')) {
            return next();
        }
        res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
    });
}

// Enhanced error handler with device context
app.use((err, req, res, next) => {
    // Log error with device context if available
    const errorContext = {
        message: err.message,
        deviceId: req.deviceId,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
    };

    console.error("API Error:", errorContext);

    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

httpServer.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
    console.log("Music streaming service initialized");
    console.log("WebSocket server ready for device connections");
    console.log("Cross-device playback control enabled");
    connectDB();
});

// Export app for testing purposes
export default app;

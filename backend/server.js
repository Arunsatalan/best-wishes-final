const app = require("./app");
const http = require('http');
const socketIo = require('socket.io');
const PORT = process.env.PORT || 5000; 

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000', 
      'http://localhost:3001', 
      'https://best-wishes-final.vercel.app',
      /\.vercel\.app$/,
      /\.railway\.app$/
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store socket connections by user ID
const userSockets = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user authentication and store socket
  socket.on('authenticate', (userId) => {
    if (userId) {
      userSockets.set(userId.toString(), socket.id);
      socket.userId = userId.toString();
      console.log(`User ${userId} authenticated with socket ${socket.id}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.userId) {
      userSockets.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

// Make io accessible throughout the app
app.set('io', io);
app.set('userSockets', userSockets);

// Add health check endpoint
app.get('/health', (req, res) => {
  res.send('ok');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Start the reminder scheduler
require('./controllers/reminderScheduler');

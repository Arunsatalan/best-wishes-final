const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
require("dotenv").config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const eventRoutes = require('./routes/eventRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const sendEmailRoutes = require('./routes/sendMailRotes');
const giftContributionRoutes = require('./routes/giftContributionRoutes');
const surpriseGiftRoutes = require('./routes/surpriseGiftRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const heroSectionRoutes = require('./routes/heroSectionRoutes');
const eventManagementRoutes = require('./routes/eventManagementRoutes');
const userRoutes = require('./routes/userRoutes');
const adminCreateUserRoutes = require('./routes/adminCreateUserRoutes');
const collaborativePurchaseRoutes = require('./routes/collaborativePurchaseRoutes');
const diagnosticRoutes = require('./routes/diagnosticRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const customizationRoutes = require('./routes/customizationRoutes');
const testRoutes = require('./routes/testRoutes');

const orderSummaryRoutes = require('./routes/orderSummaryRoutes');

const reportRoutes = require('./routes/reportRoutes');
const aiChatbotRoutes = require('./routes/aiChatbotRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');



const app = express();

connectDB();

const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:3001',
  'https://best-wishes-final.vercel.app'
];

// Add additional origins from environment variables
if (process.env.FRONT_URL) {
  allowedOrigins.push(process.env.FRONT_URL);
}
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(...process.env.CORS_ORIGIN.split(','));
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in allowedOrigins or matches patterns
    if (allowedOrigins.includes(origin) || 
        /\.vercel\.app$/.test(origin) || 
        /\.railway\.app$/.test(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

//  Routes
app.use('/api', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/payments', paymentRoutes);

app.use('/api', eventRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/Email', sendEmailRoutes);
app.use('/api/gift', giftContributionRoutes);
app.use('/api/surprise', surpriseGiftRoutes);
app.use('/api', heroSectionRoutes);
app.use('/api/events', eventManagementRoutes);
app.use('/api/collaborative-purchases', collaborativePurchaseRoutes);
app.use('/api', userRoutes);
app.use('/api', adminCreateUserRoutes);
app.use('/api/diagnostic', diagnosticRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/customizations', customizationRoutes);
app.use('/api/test', testRoutes);

app.use('/api/order-summary', orderSummaryRoutes);

app.use('/api', reportRoutes);
app.use('/api/chatbot', aiChatbotRoutes);
app.use('/api/feedback', feedbackRoutes);



module.exports = app;

const dotenv = require('dotenv');
dotenv.config();

// Validate environment BEFORE anything else — fail fast on missing secrets
const { validateEnv } = require('./config/env');
validateEnv();

const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start Server after connecting to Database
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` AXI Collection Backend API Running `);
    console.log(` Port    : ${PORT}`);
    console.log(` Mode    : ${process.env.NODE_ENV || 'development'}`);
    console.log(` Health  : http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });

  // Handle Unhandled Rejections
  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection Error] ${err.message}`);
  });
};

startServer();

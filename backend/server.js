const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import Middlewares
const rateLimiter = require('./middlewares/rateLimiter');

// Import Routes
const infoRoutes = require('./routes/infoRoutes');
const downloadRoutes = require('./routes/downloadRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// Routes
app.use('/api/info', infoRoutes);
app.use('/api/download', downloadRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

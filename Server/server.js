require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();
app.use(cors({
  origin: (origin, cb) => cb(null, true), // allow web + mobile (Expo, emulator, physical device)
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/inventory',      require('./routes/inventory'));
app.use('/api/suppliers',      require('./routes/suppliers'));
app.use('/api/purchase-orders',require('./routes/purchaseOrders'));
app.use('/api/wastage',        require('./routes/wastage'));
app.use('/api/projects',       require('./routes/projects'));
app.use('/api/stock-received', require('./routes/stockReceived'));
app.use('/api/stock-used',     require('./routes/stockUsed'));
app.use('/api/stock-returned', require('./routes/stockReturned'));
app.use('/api/stock-history',  require('./routes/stockHistory'));
app.use('/api/users',          require('./routes/users'));
app.use('/api/chat',           require('./routes/chat'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
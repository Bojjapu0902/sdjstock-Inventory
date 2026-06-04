require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User          = require('../models/User');
const InventoryItem = require('../models/InventoryItem');
const Supplier      = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const WastageLog    = require('../models/WastageLog');
const Project       = require('../models/Project');
const StockReceived = require('../models/StockReceived');
const StockUsed     = require('../models/StockUsed');

// ── Seed data (copied from Clients/src/data/) ─────────────────────────

const USERS = [
  { id: 'USR-000', username: 'sdj',        password: 'sdj123@',     role: 'Admin', name: 'System Admin',         projectId: null,    createdAt: '2026-01-01' },
  { id: 'USR-001', username: 'kitchen_a',  password: 'kitchen@123', role: 'User',  name: 'Main Kitchen — Block A',projectId: 'PRJ-001', createdAt: '2026-01-15' },
  { id: 'USR-002', username: 'canteen_b',  password: 'canteen@123', role: 'User',  name: 'Staff Canteen — Block B',projectId: 'PRJ-002', createdAt: '2026-02-10' },
  { id: 'USR-003', username: 'vessel_mv1', password: 'vessel@123',  role: 'User',  name: 'Offshore Vessel — MV Adjmarine', projectId: 'PRJ-003', createdAt: '2026-03-01' },
];

const INVENTORY_ITEMS = [
  { id:'INV-001',name:'Rice Lalitha',         category:'Grains & Pulses',  unit:'kg', currentStock:150, minStock:50,  maxStock:300, unitCost:48.00,  location:'Warehouse A',expiryDate:'2027-06-01',supplier:'Lalitha Stores' },
  { id:'INV-002',name:'Basmathi Rice',         category:'Grains & Pulses',  unit:'kg', currentStock:80,  minStock:30,  maxStock:200, unitCost:65.00,  location:'Warehouse A',expiryDate:'2027-06-01',supplier:'Lalitha Stores' },
  { id:'INV-003',name:'Chanadal',              category:'Grains & Pulses',  unit:'kg', currentStock:25,  minStock:10,  maxStock:60,  unitCost:95.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Maha Grains Co.' },
  { id:'INV-004',name:'Moong Dal',             category:'Grains & Pulses',  unit:'kg', currentStock:20,  minStock:10,  maxStock:50,  unitCost:110.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Maha Grains Co.' },
  { id:'INV-005',name:'Urid Dal',              category:'Grains & Pulses',  unit:'kg', currentStock:18,  minStock:8,   maxStock:45,  unitCost:105.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Maha Grains Co.' },
  { id:'INV-006',name:'Black Whole Urid Dal',  category:'Grains & Pulses',  unit:'kg', currentStock:15,  minStock:8,   maxStock:40,  unitCost:115.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Maha Grains Co.' },
  { id:'INV-007',name:'Green Moong Whole',     category:'Grains & Pulses',  unit:'kg', currentStock:20,  minStock:8,   maxStock:50,  unitCost:108.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Maha Grains Co.' },
  { id:'INV-008',name:'Masoor Dal',            category:'Grains & Pulses',  unit:'kg', currentStock:22,  minStock:10,  maxStock:55,  unitCost:90.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Maha Grains Co.' },
  { id:'INV-009',name:'Black Chana Whole',     category:'Grains & Pulses',  unit:'kg', currentStock:20,  minStock:8,   maxStock:50,  unitCost:85.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Maha Grains Co.' },
  { id:'INV-010',name:'Brown Rice',            category:'Grains & Pulses',  unit:'kg', currentStock:15,  minStock:6,   maxStock:35,  unitCost:75.00,  location:'Warehouse A',expiryDate:'2027-06-01',supplier:'Lalitha Stores' },
  { id:'INV-011',name:'Kabuli Chana',          category:'Grains & Pulses',  unit:'kg', currentStock:15,  minStock:6,   maxStock:35,  unitCost:120.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Maha Grains Co.' },
  { id:'INV-012',name:'Rajma',                 category:'Grains & Pulses',  unit:'kg', currentStock:18,  minStock:8,   maxStock:45,  unitCost:130.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Maha Grains Co.' },
  { id:'INV-013',name:'Sagowhole',             category:'Grains & Pulses',  unit:'kg', currentStock:8,   minStock:3,   maxStock:20,  unitCost:80.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Krishna Traders' },
  { id:'INV-014',name:'Fried Chana Dal',       category:'Grains & Pulses',  unit:'kg', currentStock:10,  minStock:4,   maxStock:25,  unitCost:90.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Maha Grains Co.' },
  { id:'INV-015',name:'Groundnut',             category:'Dry Fruits & Nuts',unit:'kg', currentStock:18,  minStock:8,   maxStock:40,  unitCost:70.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Maha Grains Co.' },
  { id:'INV-016',name:'Maida',                 category:'Flours & Cereals', unit:'kg', currentStock:30,  minStock:15,  maxStock:80,  unitCost:40.00,  location:'Dry Store',  expiryDate:'2027-03-01',supplier:'Maha Grains Co.' },
  { id:'INV-017',name:'Besan',                 category:'Flours & Cereals', unit:'kg', currentStock:18,  minStock:8,   maxStock:45,  unitCost:75.00,  location:'Dry Store',  expiryDate:'2027-03-01',supplier:'Maha Grains Co.' },
  { id:'INV-018',name:'Ragi Flour',            category:'Flours & Cereals', unit:'kg', currentStock:12,  minStock:5,   maxStock:30,  unitCost:65.00,  location:'Dry Store',  expiryDate:'2027-03-01',supplier:'Maha Grains Co.' },
  { id:'INV-019',name:'Corn Flour',            category:'Flours & Cereals', unit:'kg', currentStock:8,   minStock:3,   maxStock:20,  unitCost:55.00,  location:'Dry Store',  expiryDate:'2027-03-01',supplier:'Maha Grains Co.' },
  { id:'INV-020',name:'Rice Flour',            category:'Flours & Cereals', unit:'kg', currentStock:12,  minStock:5,   maxStock:30,  unitCost:45.00,  location:'Dry Store',  expiryDate:'2027-03-01',supplier:'Maha Grains Co.' },
  { id:'INV-021',name:'Idli Ravva',            category:'Flours & Cereals', unit:'kg', currentStock:15,  minStock:6,   maxStock:35,  unitCost:50.00,  location:'Dry Store',  expiryDate:'2027-03-01',supplier:'Maha Grains Co.' },
  { id:'INV-022',name:'Suji Ravva',            category:'Flours & Cereals', unit:'kg', currentStock:20,  minStock:8,   maxStock:50,  unitCost:48.00,  location:'Dry Store',  expiryDate:'2027-03-01',supplier:'Maha Grains Co.' },
  { id:'INV-023',name:'Bans Iravva',           category:'Flours & Cereals', unit:'kg', currentStock:8,   minStock:3,   maxStock:20,  unitCost:52.00,  location:'Dry Store',  expiryDate:'2027-03-01',supplier:'Maha Grains Co.' },
  { id:'INV-024',name:'Meal Maker',            category:'Flours & Cereals', unit:'kg', currentStock:6,   minStock:2,   maxStock:15,  unitCost:180.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'National Foods Ltd.' },
  { id:'INV-025',name:'Poha',                  category:'Flours & Cereals', unit:'kg', currentStock:12,  minStock:5,   maxStock:30,  unitCost:55.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Maha Grains Co.' },
  { id:'INV-026',name:'Semiya',                category:'Flours & Cereals', unit:'kg', currentStock:8,   minStock:3,   maxStock:20,  unitCost:60.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Maha Grains Co.' },
  { id:'INV-027',name:'Corn Flakes',           category:'Flours & Cereals', unit:'kg', currentStock:4,   minStock:1.5, maxStock:10,  unitCost:180.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'National Foods Ltd.' },
  { id:'INV-028',name:'Pop Corn',              category:'Packaged Foods',   unit:'kg', currentStock:4,   minStock:1.5, maxStock:10,  unitCost:85.00,  location:'Dry Store',  expiryDate:'2026-12-01',supplier:'National Foods Ltd.' },
  { id:'INV-029',name:'Coriander Powder',      category:'Spices & Masalas', unit:'kg', currentStock:4,   minStock:1.5, maxStock:10,  unitCost:120.00, location:'Spice Rack', expiryDate:'2027-01-01',supplier:'SpiceHub India' },
  { id:'INV-030',name:'Chilli Powder',         category:'Spices & Masalas', unit:'kg', currentStock:3,   minStock:1,   maxStock:8,   unitCost:180.00, location:'Spice Rack', expiryDate:'2027-01-01',supplier:'SpiceHub India' },
  { id:'INV-031',name:'Turmeric Powder',       category:'Spices & Masalas', unit:'kg', currentStock:2.5, minStock:0.8, maxStock:6,   unitCost:140.00, location:'Spice Rack', expiryDate:'2027-01-01',supplier:'SpiceHub India' },
  { id:'INV-032',name:'Red Chilli Whole',      category:'Spices & Masalas', unit:'kg', currentStock:3,   minStock:1,   maxStock:8,   unitCost:200.00, location:'Spice Rack', expiryDate:'2027-01-01',supplier:'SpiceHub India' },
  { id:'INV-033',name:'Hing (Asafoetida)',     category:'Spices & Masalas', unit:'g',  currentStock:200, minStock:50,  maxStock:500, unitCost:0.50,   location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-034',name:'Chicken Masala 100gm',  category:'Spices & Masalas', unit:'pcs',currentStock:20,  minStock:6,   maxStock:50,  unitCost:35.00,  location:'Spice Rack', expiryDate:'2027-06-01',supplier:'MTR Foods Pvt Ltd' },
  { id:'INV-035',name:'Meat Masala 100gm',     category:'Spices & Masalas', unit:'pcs',currentStock:15,  minStock:5,   maxStock:40,  unitCost:35.00,  location:'Spice Rack', expiryDate:'2027-06-01',supplier:'MTR Foods Pvt Ltd' },
  { id:'INV-036',name:'Biryani Masala 100gm',  category:'Spices & Masalas', unit:'pcs',currentStock:18,  minStock:6,   maxStock:45,  unitCost:38.00,  location:'Spice Rack', expiryDate:'2027-06-01',supplier:'MTR Foods Pvt Ltd' },
  { id:'INV-037',name:'Chat Masala 100gm',     category:'Spices & Masalas', unit:'pcs',currentStock:12,  minStock:4,   maxStock:30,  unitCost:32.00,  location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-038',name:'Kitchen King Masala 100gm',category:'Spices & Masalas',unit:'pcs',currentStock:10,minStock:4,  maxStock:25,  unitCost:40.00,  location:'Spice Rack', expiryDate:'2027-06-01',supplier:'MTR Foods Pvt Ltd' },
  { id:'INV-039',name:'Panipuri Masala 100gm', category:'Spices & Masalas', unit:'pcs',currentStock:12,  minStock:4,   maxStock:30,  unitCost:30.00,  location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-040',name:'Sambar Powder 100gm',   category:'Spices & Masalas', unit:'pcs',currentStock:15,  minStock:5,   maxStock:35,  unitCost:35.00,  location:'Spice Rack', expiryDate:'2027-06-01',supplier:'MTR Foods Pvt Ltd' },
  { id:'INV-041',name:'Rasam Powder 100gm',    category:'Spices & Masalas', unit:'pcs',currentStock:12,  minStock:4,   maxStock:30,  unitCost:32.00,  location:'Spice Rack', expiryDate:'2027-06-01',supplier:'MTR Foods Pvt Ltd' },
  { id:'INV-042',name:'Garam Masala Powder 100gm',category:'Spices & Masalas',unit:'pcs',currentStock:15,minStock:5,  maxStock:35,  unitCost:42.00,  location:'Spice Rack', expiryDate:'2027-06-01',supplier:'MTR Foods Pvt Ltd' },
  { id:'INV-043',name:'Chhole Masala 100gm',   category:'Spices & Masalas', unit:'pcs',currentStock:10,  minStock:4,   maxStock:25,  unitCost:35.00,  location:'Spice Rack', expiryDate:'2027-06-01',supplier:'MTR Foods Pvt Ltd' },
  { id:'INV-044',name:'Mustard Seeds',         category:'Spices & Masalas', unit:'kg', currentStock:3,   minStock:1,   maxStock:8,   unitCost:80.00,  location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-045',name:'Biryani Leaves',        category:'Spices & Masalas', unit:'g',  currentStock:100, minStock:20,  maxStock:250, unitCost:0.80,   location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-046',name:'Sweet Anni Seed',       category:'Spices & Masalas', unit:'kg', currentStock:1.5, minStock:0.5, maxStock:4,   unitCost:200.00, location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-047',name:'Anni Seed (Ajwain)',    category:'Spices & Masalas', unit:'kg', currentStock:1.5, minStock:0.5, maxStock:4,   unitCost:180.00, location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-048',name:'Jeera (Cumin Seeds)',   category:'Spices & Masalas', unit:'kg', currentStock:2,   minStock:0.5, maxStock:5,   unitCost:220.00, location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-049',name:'Kasthuri Methi 100gm',  category:'Spices & Masalas', unit:'pcs',currentStock:15,  minStock:5,   maxStock:35,  unitCost:28.00,  location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-050',name:'Lavang (Cloves)',        category:'Spices & Masalas', unit:'g',  currentStock:200, minStock:50,  maxStock:500, unitCost:1.20,   location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-051',name:'Star Flower (Star Anise)',category:'Spices & Masalas',unit:'g',  currentStock:150, minStock:30,  maxStock:350, unitCost:1.50,   location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-052',name:'Japathri (Mace)',        category:'Spices & Masalas', unit:'g',  currentStock:100, minStock:20,  maxStock:200, unitCost:2.00,   location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-053',name:'Black Pepper Whole',    category:'Spices & Masalas', unit:'kg', currentStock:1.5, minStock:0.5, maxStock:4,   unitCost:650.00, location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-054',name:'Dalchini (Cinnamon)',   category:'Spices & Masalas', unit:'g',  currentStock:200, minStock:50,  maxStock:400, unitCost:0.80,   location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-055',name:'Marathi Mogga',         category:'Spices & Masalas', unit:'g',  currentStock:100, minStock:20,  maxStock:200, unitCost:1.00,   location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-056',name:'Jayphal (Nutmeg)',      category:'Spices & Masalas', unit:'g',  currentStock:100, minStock:20,  maxStock:200, unitCost:1.80,   location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-057',name:'Sajeera',               category:'Spices & Masalas', unit:'kg', currentStock:1,   minStock:0.3, maxStock:3,   unitCost:280.00, location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-058',name:'Green Soump (Fennel)',  category:'Spices & Masalas', unit:'kg', currentStock:1.5, minStock:0.5, maxStock:4,   unitCost:180.00, location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-059',name:'White Soump',           category:'Spices & Masalas', unit:'kg', currentStock:1,   minStock:0.3, maxStock:3,   unitCost:200.00, location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-060',name:'Coriander Seeds',       category:'Spices & Masalas', unit:'kg', currentStock:2,   minStock:0.8, maxStock:5,   unitCost:100.00, location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-061',name:'Poppy Seeds',           category:'Spices & Masalas', unit:'kg', currentStock:0.5, minStock:0.1, maxStock:1.5, unitCost:850.00, location:'Spice Rack', expiryDate:'2027-06-01',supplier:'SpiceHub India' },
  { id:'INV-062',name:'Burugpudi Bellam',      category:'Condiments',       unit:'kg', currentStock:4,   minStock:1.5, maxStock:10,  unitCost:250.00, location:'Dry Store',  expiryDate:'2027-01-01',supplier:'Krishna Traders' },
  { id:'INV-063',name:'Cooking Oil',           category:'Oils & Fats',      unit:'L',  currentStock:20,  minStock:8,   maxStock:50,  unitCost:155.00, location:'Warehouse A',expiryDate:'2027-06-01',supplier:'Ruchi Oils & Fats' },
  { id:'INV-064',name:'Ghee Amul',             category:'Oils & Fats',      unit:'kg', currentStock:5,   minStock:2,   maxStock:15,  unitCost:540.00, location:'Cold Room 1',expiryDate:'2026-12-01',supplier:'Amul Distributors' },
  { id:'INV-065',name:'White Vinegar',         category:'Oils & Fats',      unit:'L',  currentStock:3,   minStock:1,   maxStock:8,   unitCost:45.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Krishna Traders' },
  { id:'INV-066',name:'Dalda (Vanaspati)',      category:'Oils & Fats',      unit:'kg', currentStock:5,   minStock:2,   maxStock:12,  unitCost:115.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Ruchi Oils & Fats' },
  { id:'INV-067',name:'Maggi Tomato Sauce',    category:'Condiments',       unit:'pcs',currentStock:10,  minStock:3,   maxStock:25,  unitCost:85.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'National Foods Ltd.' },
  { id:'INV-068',name:'Soya Sauce',            category:'Condiments',       unit:'L',  currentStock:3,   minStock:1,   maxStock:8,   unitCost:120.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'National Foods Ltd.' },
  { id:'INV-069',name:'Green Chilli Sauce',    category:'Condiments',       unit:'L',  currentStock:2,   minStock:0.5, maxStock:6,   unitCost:95.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'National Foods Ltd.' },
  { id:'INV-070',name:'Red Chilli Sauce',      category:'Condiments',       unit:'L',  currentStock:2,   minStock:0.5, maxStock:6,   unitCost:95.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'National Foods Ltd.' },
  { id:'INV-071',name:'Mix Fruit Jam',         category:'Condiments',       unit:'pcs',currentStock:8,   minStock:2,   maxStock:20,  unitCost:145.00, location:'Dry Store',  expiryDate:'2027-12-01',supplier:'National Foods Ltd.' },
  { id:'INV-072',name:'Honey',                 category:'Condiments',       unit:'kg', currentStock:3,   minStock:1,   maxStock:8,   unitCost:420.00, location:'Dry Store',  expiryDate:'2027-12-01',supplier:'Krishna Traders' },
  { id:'INV-073',name:'Snack Panipuri',        category:'Packaged Foods',   unit:'pcs',currentStock:5,   minStock:2,   maxStock:15,  unitCost:40.00,  location:'Dry Store',  expiryDate:'2026-12-01',supplier:'National Foods Ltd.' },
  { id:'INV-074',name:'MTR Gulab Jamun Mix 175gm',category:'Packaged Foods',unit:'pcs',currentStock:8,   minStock:2,   maxStock:20,  unitCost:80.00,  location:'Dry Store',  expiryDate:'2027-12-01',supplier:'MTR Foods Pvt Ltd' },
  { id:'INV-075',name:'Tamarind',              category:'Condiments',       unit:'kg', currentStock:5,   minStock:2,   maxStock:12,  unitCost:95.00,  location:'Dry Store',  expiryDate:'2026-12-01',supplier:'Krishna Traders' },
  { id:'INV-076',name:'Garlic Pickle',         category:'Pickles',          unit:'kg', currentStock:3,   minStock:1,   maxStock:8,   unitCost:220.00, location:'Cold Room 1',expiryDate:'2026-12-01',supplier:'Pickle Palace' },
  { id:'INV-077',name:'Ginger Pickle',         category:'Pickles',          unit:'kg', currentStock:2,   minStock:0.8, maxStock:6,   unitCost:200.00, location:'Cold Room 1',expiryDate:'2026-12-01',supplier:'Pickle Palace' },
  { id:'INV-078',name:'Lemon Pickle',          category:'Pickles',          unit:'kg', currentStock:2,   minStock:0.8, maxStock:6,   unitCost:180.00, location:'Cold Room 1',expiryDate:'2026-12-01',supplier:'Pickle Palace' },
  { id:'INV-079',name:'Mango Pickle',          category:'Pickles',          unit:'kg', currentStock:3,   minStock:1,   maxStock:8,   unitCost:200.00, location:'Cold Room 1',expiryDate:'2026-12-01',supplier:'Pickle Palace' },
  { id:'INV-080',name:'Green Chilli Pickle',   category:'Pickles',          unit:'kg', currentStock:2,   minStock:0.8, maxStock:6,   unitCost:170.00, location:'Cold Room 1',expiryDate:'2026-12-01',supplier:'Pickle Palace' },
  { id:'INV-081',name:'Gongura Pickle',        category:'Pickles',          unit:'kg', currentStock:2,   minStock:0.5, maxStock:6,   unitCost:210.00, location:'Cold Room 1',expiryDate:'2026-12-01',supplier:'Pickle Palace' },
  { id:'INV-082',name:'Amla Pickle',           category:'Pickles',          unit:'kg', currentStock:2,   minStock:0.5, maxStock:6,   unitCost:190.00, location:'Cold Room 1',expiryDate:'2026-12-01',supplier:'Pickle Palace' },
  { id:'INV-083',name:'Kaju Broken',           category:'Dry Fruits & Nuts',unit:'kg', currentStock:2,   minStock:0.5, maxStock:5,   unitCost:700.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Krishna Traders' },
  { id:'INV-084',name:'Kaju Palla Half',       category:'Dry Fruits & Nuts',unit:'kg', currentStock:1,   minStock:0.3, maxStock:3,   unitCost:750.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Krishna Traders' },
  { id:'INV-085',name:'White Til (Sesame)',    category:'Dry Fruits & Nuts',unit:'kg', currentStock:3,   minStock:1,   maxStock:8,   unitCost:160.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'Maha Grains Co.' },
  { id:'INV-086',name:'Tea Powder Agni',       category:'Beverages',        unit:'kg', currentStock:3,   minStock:1,   maxStock:8,   unitCost:380.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'National Foods Ltd.' },
  { id:'INV-087',name:'Coffee Powder 200gm',   category:'Beverages',        unit:'pcs',currentStock:10,  minStock:3,   maxStock:25,  unitCost:120.00, location:'Dry Store',  expiryDate:'2027-06-01',supplier:'National Foods Ltd.' },
  { id:'INV-088',name:'Rice Papad',            category:'Packaged Foods',   unit:'pcs',currentStock:20,  minStock:5,   maxStock:50,  unitCost:25.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'National Foods Ltd.' },
  { id:'INV-089',name:'Lizzat Papad',          category:'Packaged Foods',   unit:'pcs',currentStock:15,  minStock:4,   maxStock:40,  unitCost:28.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'National Foods Ltd.' },
  { id:'INV-090',name:'Mushrooms',             category:'Packaged Foods',   unit:'kg', currentStock:3,   minStock:1,   maxStock:8,   unitCost:180.00, location:'Cold Room 2',expiryDate:'2026-06-15',supplier:'Fresh Farms India' },
  { id:'INV-091',name:'Maggi Pkts Big',        category:'Packaged Foods',   unit:'pcs',currentStock:20,  minStock:6,   maxStock:50,  unitCost:14.00,  location:'Dry Store',  expiryDate:'2027-06-01',supplier:'National Foods Ltd.' },
  { id:'INV-092',name:'Salt',                  category:'Packaged Foods',   unit:'kg', currentStock:10,  minStock:4,   maxStock:25,  unitCost:18.00,  location:'Dry Store',  expiryDate:'2027-12-01',supplier:'Krishna Traders' },
  { id:'INV-093',name:'Sugar',                 category:'Packaged Foods',   unit:'kg', currentStock:15,  minStock:5,   maxStock:40,  unitCost:42.00,  location:'Dry Store',  expiryDate:'2027-12-01',supplier:'Krishna Traders' },
];

const SUPPLIERS = [
  { id:'SUP-001',name:'Lalitha Stores',      category:'Grains & Rice',       contact:'Lalitha Devi',   email:'lalitha@lalithastores.com',  phone:'+91-98490-11001',city:'Hyderabad',     country:'India',rating:4.8,totalOrders:52, totalSpend:94000, status:'Active',since:'2021-01-10',paymentTerms:'Net 15' },
  { id:'SUP-002',name:'Maha Grains Co.',     category:'Pulses & Flours',     contact:'Mahesh Rao',     email:'mahesh@mahagrains.com',      phone:'+91-98490-22002',city:'Hyderabad',     country:'India',rating:4.6,totalOrders:88, totalSpend:72000, status:'Active',since:'2020-06-15',paymentTerms:'Net 30' },
  { id:'SUP-003',name:'SpiceHub India',      category:'Spices & Masalas',    contact:'Suresh Nair',    email:'suresh@spicehub.in',         phone:'+91-98490-33003',city:'Guntur',        country:'India',rating:4.7,totalOrders:65, totalSpend:48000, status:'Active',since:'2021-03-20',paymentTerms:'Net 15' },
  { id:'SUP-004',name:'Krishna Traders',     category:'General Groceries',   contact:'Krishna Murthy', email:'krishna@krishnatraders.com', phone:'+91-98490-44004',city:'Vijayawada',    country:'India',rating:4.3,totalOrders:110,totalSpend:58000, status:'Active',since:'2020-09-01',paymentTerms:'Net 7'  },
  { id:'SUP-005',name:'National Foods Ltd.', category:'Packaged Foods',      contact:'Ravi Shankar',   email:'ravi@nationalfoods.com',     phone:'+91-98490-55005',city:'Hyderabad',     country:'India',rating:4.5,totalOrders:74, totalSpend:62000, status:'Active',since:'2021-07-12',paymentTerms:'Net 30' },
  { id:'SUP-006',name:'Amul Distributors',   category:'Dairy & Ghee',        contact:'Anand Patel',    email:'anand@amuldist.com',         phone:'+91-98490-66006',city:'Hyderabad',     country:'India',rating:4.9,totalOrders:96, totalSpend:115000,status:'Active',since:'2020-03-05',paymentTerms:'Net 21' },
  { id:'SUP-007',name:'Ruchi Oils & Fats',   category:'Oils & Fats',         contact:'Priya Reddy',    email:'priya@ruchioils.com',        phone:'+91-98490-77007',city:'Hyderabad',     country:'India',rating:4.4,totalOrders:38, totalSpend:89000, status:'Active',since:'2021-11-20',paymentTerms:'Net 15' },
  { id:'SUP-008',name:'MTR Foods Pvt Ltd',   category:'Masalas & Packaged',  contact:'Ramesh Kumar',   email:'ramesh@mtrfoods.com',        phone:'+91-98490-88008',city:'Bangalore',     country:'India',rating:4.8,totalOrders:42, totalSpend:38000, status:'Active',since:'2022-02-14',paymentTerms:'Net 30' },
  { id:'SUP-009',name:'Pickle Palace',       category:'Pickles & Condiments',contact:'Savitha Rani',   email:'savitha@picklepalace.com',   phone:'+91-98490-99009',city:'Visakhapatnam', country:'India',rating:4.2,totalOrders:29, totalSpend:22000, status:'Active',since:'2022-05-08',paymentTerms:'Net 14' },
  { id:'SUP-010',name:'Fresh Farms India',   category:'Fresh Produce',       contact:'Nagaraju B.',    email:'nagaraju@freshfarms.in',     phone:'+91-98490-10010',city:'Hyderabad',     country:'India',rating:4.1,totalOrders:18, totalSpend:14000, status:'Active',since:'2023-01-18',paymentTerms:'Net 7'  },
];

const PURCHASE_ORDERS = [
  { id:'PO-2026-001',supplier:'Lalitha Stores',      date:'2026-05-20',deliveryDate:'2026-05-28',items:2, totalValue:12350,status:'Delivered', paymentStatus:'Paid',   notes:'Monthly rice restock' },
  { id:'PO-2026-002',supplier:'Maha Grains Co.',     date:'2026-05-22',deliveryDate:'2026-05-26',items:8, totalValue:8640, status:'Delivered', paymentStatus:'Paid',   notes:'Dal & flour restock' },
  { id:'PO-2026-003',supplier:'SpiceHub India',      date:'2026-05-24',deliveryDate:'2026-05-27',items:12,totalValue:4800, status:'In Transit',paymentStatus:'Pending',notes:'Spice & masala monthly order' },
  { id:'PO-2026-004',supplier:'National Foods Ltd.', date:'2026-05-25',deliveryDate:'2026-05-29',items:6, totalValue:3120, status:'Processing',paymentStatus:'Pending',notes:'Packaged foods reorder' },
  { id:'PO-2026-005',supplier:'Pickle Palace',       date:'2026-05-26',deliveryDate:'2026-06-02',items:7, totalValue:2800, status:'Approved',  paymentStatus:'Pending',notes:'Pickle assortment' },
  { id:'PO-2026-006',supplier:'Ruchi Oils & Fats',   date:'2026-05-26',deliveryDate:'2026-06-05',items:2, totalValue:7200, status:'Draft',     paymentStatus:'Unpaid', notes:'Cooking oil restock' },
  { id:'PO-2026-007',supplier:'MTR Foods Pvt Ltd',   date:'2026-05-15',deliveryDate:'2026-05-20',items:8, totalValue:3600, status:'Delivered', paymentStatus:'Paid',   notes:'MTR masala packs' },
  { id:'PO-2026-008',supplier:'Krishna Traders',     date:'2026-05-18',deliveryDate:'2026-05-23',items:5, totalValue:2100, status:'Delivered', paymentStatus:'Paid',   notes:'Salt, sugar, tamarind' },
  { id:'PO-2026-009',supplier:'Amul Distributors',   date:'2026-05-27',deliveryDate:'2026-06-04',items:1, totalValue:5400, status:'Approved',  paymentStatus:'Pending',notes:'Ghee bulk order' },
  { id:'PO-2026-010',supplier:'Krishna Traders',     date:'2026-05-23',deliveryDate:'2026-05-30',items:4, totalValue:1800, status:'In Transit',paymentStatus:'Pending',notes:'Honey, vinegar, condiments' },
];

const WASTAGE_LOGS = [
  { id:'WST-001',date:'2026-05-27',item:'Mushrooms',            category:'Packaged Foods',  qty:1.5,unit:'kg', reason:'Spoilage',        costImpact:270,  loggedBy:'Chef Ravi', notes:'Temperature issue in Cold Room 2' },
  { id:'WST-002',date:'2026-05-27',item:'Poha',                 category:'Flours & Cereals',qty:3.0,unit:'kg', reason:'Expired',         costImpact:165,  loggedBy:'Maria S.',  notes:'Past use-by date' },
  { id:'WST-003',date:'2026-05-26',item:'Maida',                category:'Flours & Cereals',qty:4.0,unit:'kg', reason:'Contamination',   costImpact:160,  loggedBy:'Chef Ravi', notes:'Insect found in bag' },
  { id:'WST-004',date:'2026-05-26',item:'Ghee Amul',            category:'Oils & Fats',     qty:0.5,unit:'kg', reason:'Expired',         costImpact:270,  loggedBy:'Sunita K.', notes:'Past use-by date' },
  { id:'WST-005',date:'2026-05-25',item:'Rice Lalitha',         category:'Grains & Pulses', qty:5.0,unit:'kg', reason:'Spillage',        costImpact:240,  loggedBy:'Maria S.',  notes:'Storage bin overflow' },
  { id:'WST-006',date:'2026-05-25',item:'Tamarind',             category:'Condiments',      qty:0.8,unit:'kg', reason:'Spoilage',        costImpact:76,   loggedBy:'Chef Ravi', notes:'Excessive moisture' },
  { id:'WST-007',date:'2026-05-24',item:'Chanadal',             category:'Grains & Pulses', qty:2.0,unit:'kg', reason:'Over-preparation',costImpact:190,  loggedBy:'Sunita K.', notes:'Excess dal prepared' },
  { id:'WST-008',date:'2026-05-24',item:'Chicken Masala 100gm',category:'Spices & Masalas',qty:3,  unit:'pcs',reason:'Expired',         costImpact:105,  loggedBy:'Maria S.',  notes:'Found expired during stock check' },
  { id:'WST-009',date:'2026-05-23',item:'Semiya',               category:'Flours & Cereals',qty:2.0,unit:'kg', reason:'Spoilage',        costImpact:120,  loggedBy:'Chef Ravi', notes:'Moisture absorption' },
  { id:'WST-010',date:'2026-05-22',item:'Kaju Broken',          category:'Dry Fruits & Nuts',qty:0.2,unit:'kg',reason:'Contamination',   costImpact:140,  loggedBy:'Sunita K.', notes:'Discolouration noticed' },
  { id:'WST-011',date:'2026-05-21',item:'Meal Maker',           category:'Flours & Cereals',qty:1.0,unit:'kg', reason:'Over-preparation',costImpact:180,  loggedBy:'Chef Ravi', notes:'Excess cooked for event' },
  { id:'WST-012',date:'2026-05-20',item:'Cooking Oil',          category:'Oils & Fats',     qty:1.5,unit:'L',  reason:'Spillage',        costImpact:232.5,loggedBy:'Maria S.',  notes:'Bottle dropped in kitchen' },
];

const PROJECTS = [
  { id:'PRJ-001',name:'Main Kitchen — Block A',        location:'Hyderabad, Telangana',       address:'Plot 12, KPHB Industrial Area, Kukatpally, Hyderabad – 500072',         status:'Active',           manager:'Rajesh Kumar',   phone:'+91 98765 43210',email:'rajesh@adjmarine.com', description:'Primary kitchen facility for daily meal preparation',username:'kitchen_a', password:'kitchen@123',capacity:'500',createdAt:'2026-01-15' },
  { id:'PRJ-002',name:'Staff Canteen — Block B',       location:'Hyderabad, Telangana',       address:'Block B, Corporate Campus, Gachibowli, Hyderabad – 500032',              status:'Under Maintenance',manager:'Sunita Rao',     phone:'+91 91234 56789',email:'sunita@adjmarine.com', description:'Staff canteen serving 200+ employees',              username:'canteen_b', password:'canteen@123',capacity:'200',createdAt:'2026-02-10' },
  { id:'PRJ-003',name:'Offshore Vessel — MV Adjmarine',location:'Visakhapatnam, Andhra Pradesh',address:'Berth 14, Outer Harbour, Visakhapatnam Port – 530035',               status:'Active',           manager:'Capt. Arjun Nair',phone:'+91 94455 66778',email:'arjun@adjmarine.com',  description:'Galley stock for offshore crew (30 persons)',       username:'vessel_mv1',password:'vessel@123', capacity:'30', createdAt:'2026-03-01' },
];

const STOCK_RECEIVED = [
  { submissionId:'SR-1736935200000',projectId:'PRJ-001',adminName:'sdj',date:'15 Jan 2026',time:'11:00:00 AM',submittedAt:'2026-01-15T11:00:00.000Z',totalItems:3,totalValue:'5980.00',approvalStatus:'pending',items:[{itemId:'INV-001',itemName:'Rice Lalitha',category:'Grains & Pulses',quantity:'50',unit:'kg',rate:'48.00',supplier:'Lalitha Stores',notes:'Monthly stock — Jan batch',total:'2400.00'},{itemId:'INV-063',itemName:'Cooking Oil',category:'Oils & Fats',quantity:'20',unit:'L',rate:'155.00',supplier:'Ruchi Oils & Fats',notes:'',total:'3100.00'},{itemId:'INV-029',itemName:'Coriander Powder',category:'Spices & Masalas',quantity:'4',unit:'kg',rate:'120.00',supplier:'SpiceHub India',notes:'',total:'480.00'}]},
  { submissionId:'SR-1737021600000',projectId:'PRJ-001',adminName:'sdj',date:'16 Jan 2026',time:'09:30:00 AM',submittedAt:'2026-01-16T09:30:00.000Z',totalItems:3,totalValue:'3520.00',approvalStatus:'pending',items:[{itemId:'INV-004',itemName:'Moong Dal',category:'Grains & Pulses',quantity:'20',unit:'kg',rate:'110.00',supplier:'Maha Grains Co.',notes:'Restock after weekly usage',total:'2200.00'},{itemId:'INV-086',itemName:'Tea Powder Agni',category:'Beverages',quantity:'3',unit:'kg',rate:'380.00',supplier:'National Foods Ltd.',notes:'',total:'1140.00'},{itemId:'INV-092',itemName:'Salt',category:'Packaged Foods',quantity:'10',unit:'kg',rate:'18.00',supplier:'Krishna Traders',notes:'',total:'180.00'}]},
  { submissionId:'SR-1740826800000',projectId:'PRJ-003',adminName:'sdj',date:'01 Mar 2026',time:'08:00:00 AM',submittedAt:'2026-03-01T08:00:00.000Z',totalItems:4,totalValue:'9070.00',approvalStatus:'pending',items:[{itemId:'INV-002',itemName:'Basmathi Rice',category:'Grains & Pulses',quantity:'80',unit:'kg',rate:'65.00',supplier:'Lalitha Stores',notes:'Vessel departure stock — 30-day voyage',total:'5200.00'},{itemId:'INV-064',itemName:'Ghee Amul',category:'Oils & Fats',quantity:'5',unit:'kg',rate:'540.00',supplier:'Amul Distributors',notes:'',total:'2700.00'},{itemId:'INV-030',itemName:'Chilli Powder',category:'Spices & Masalas',quantity:'3',unit:'kg',rate:'180.00',supplier:'SpiceHub India',notes:'',total:'540.00'},{itemId:'INV-093',itemName:'Sugar',category:'Packaged Foods',quantity:'15',unit:'kg',rate:'42.00',supplier:'Krishna Traders',notes:'',total:'630.00'}]},
];

// ── Seed function ─────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    // Upsert all data (safe for re-runs and avoids needing delete permission)
    async function upsertMany(Model, docs, keyField = 'id') {
      let count = 0;
      for (const doc of docs) {
        await Model.updateOne({ [keyField]: doc[keyField] }, { $set: doc }, { upsert: true });
        count++;
      }
      return count;
    }

    // Hash all user passwords before upsert
    const hashedUsers = await Promise.all(
      USERS.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 10),
      }))
    );

    let n;
    n = await upsertMany(User, hashedUsers);
    console.log(`Upserted ${n} users`);

    n = await upsertMany(InventoryItem, INVENTORY_ITEMS);
    console.log(`Upserted ${n} inventory items`);

    n = await upsertMany(Supplier, SUPPLIERS);
    console.log(`Upserted ${n} suppliers`);

    n = await upsertMany(PurchaseOrder, PURCHASE_ORDERS);
    console.log(`Upserted ${n} purchase orders`);

    n = await upsertMany(WastageLog, WASTAGE_LOGS);
    console.log(`Upserted ${n} wastage logs`);

    n = await upsertMany(Project, PROJECTS);
    console.log(`Upserted ${n} projects`);

    n = await upsertMany(StockReceived, STOCK_RECEIVED, 'submissionId');
    console.log(`Upserted ${n} stock-received records`);

    console.log('\nDatabase seeded successfully!');
    console.log('Admin login: username=sdj  password=sdj123@');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
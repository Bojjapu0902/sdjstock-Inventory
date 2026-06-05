// =====================================================
//  SDJ MARINE PVT. LTD — Mock Data Layer (93 items)
// =====================================================

// ── Inventory Items ──────────────────────────────────
export const inventoryItems = [
  // ── Grains & Pulses ─────────────────────────────
  { id: 'INV-001', name: 'Rice Lalitha',          category: 'Grains & Pulses',  unit: 'kg',  currentStock: 150,  minStock: 50,  maxStock: 300,  unitCost: 48.00,  location: 'Warehouse A',  expiryDate: '2027-06-01', supplier: 'Lalitha Stores'      },
  { id: 'INV-002', name: 'Basmathi Rice',          category: 'Grains & Pulses',  unit: 'kg',  currentStock: 80,   minStock: 30,  maxStock: 200,  unitCost: 65.00,  location: 'Warehouse A',  expiryDate: '2027-06-01', supplier: 'Lalitha Stores'      },
  { id: 'INV-003', name: 'Chanadal',               category: 'Grains & Pulses',  unit: 'kg',  currentStock: 25,   minStock: 10,  maxStock: 60,   unitCost: 95.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-004', name: 'Moong Dal',              category: 'Grains & Pulses',  unit: 'kg',  currentStock: 20,   minStock: 10,  maxStock: 50,   unitCost: 110.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-005', name: 'Urid Dal',               category: 'Grains & Pulses',  unit: 'kg',  currentStock: 18,   minStock: 8,   maxStock: 45,   unitCost: 105.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-006', name: 'Black Whole Urid Dal',   category: 'Grains & Pulses',  unit: 'kg',  currentStock: 15,   minStock: 8,   maxStock: 40,   unitCost: 115.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-007', name: 'Green Moong Whole',      category: 'Grains & Pulses',  unit: 'kg',  currentStock: 20,   minStock: 8,   maxStock: 50,   unitCost: 108.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-008', name: 'Masoor Dal',             category: 'Grains & Pulses',  unit: 'kg',  currentStock: 22,   minStock: 10,  maxStock: 55,   unitCost: 90.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-009', name: 'Black Chana Whole',      category: 'Grains & Pulses',  unit: 'kg',  currentStock: 20,   minStock: 8,   maxStock: 50,   unitCost: 85.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-010', name: 'Brown Rice',             category: 'Grains & Pulses',  unit: 'kg',  currentStock: 15,   minStock: 6,   maxStock: 35,   unitCost: 75.00,  location: 'Warehouse A',  expiryDate: '2027-06-01', supplier: 'Lalitha Stores'      },
  { id: 'INV-011', name: 'Kabuli Chana',           category: 'Grains & Pulses',  unit: 'kg',  currentStock: 15,   minStock: 6,   maxStock: 35,   unitCost: 120.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-012', name: 'Rajma',                  category: 'Grains & Pulses',  unit: 'kg',  currentStock: 18,   minStock: 8,   maxStock: 45,   unitCost: 130.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-013', name: 'Sagowhole',              category: 'Grains & Pulses',  unit: 'kg',  currentStock: 8,    minStock: 3,   maxStock: 20,   unitCost: 80.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Krishna Traders'     },
  { id: 'INV-014', name: 'Fried Chana Dal',        category: 'Grains & Pulses',  unit: 'kg',  currentStock: 10,   minStock: 4,   maxStock: 25,   unitCost: 90.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-015', name: 'Groundnut',              category: 'Dry Fruits & Nuts',unit: 'kg',  currentStock: 18,   minStock: 8,   maxStock: 40,   unitCost: 70.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Maha Grains Co.'     },

  // ── Flours & Cereals ────────────────────────────
  { id: 'INV-016', name: 'Maida',                  category: 'Flours & Cereals', unit: 'kg',  currentStock: 30,   minStock: 15,  maxStock: 80,   unitCost: 40.00,  location: 'Dry Store',    expiryDate: '2027-03-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-017', name: 'Besan',                  category: 'Flours & Cereals', unit: 'kg',  currentStock: 18,   minStock: 8,   maxStock: 45,   unitCost: 75.00,  location: 'Dry Store',    expiryDate: '2027-03-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-018', name: 'Ragi Flour',             category: 'Flours & Cereals', unit: 'kg',  currentStock: 12,   minStock: 5,   maxStock: 30,   unitCost: 65.00,  location: 'Dry Store',    expiryDate: '2027-03-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-019', name: 'Corn Flour',             category: 'Flours & Cereals', unit: 'kg',  currentStock: 8,    minStock: 3,   maxStock: 20,   unitCost: 55.00,  location: 'Dry Store',    expiryDate: '2027-03-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-020', name: 'Rice Flour',             category: 'Flours & Cereals', unit: 'kg',  currentStock: 12,   minStock: 5,   maxStock: 30,   unitCost: 45.00,  location: 'Dry Store',    expiryDate: '2027-03-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-021', name: 'Idli Ravva',             category: 'Flours & Cereals', unit: 'kg',  currentStock: 15,   minStock: 6,   maxStock: 35,   unitCost: 50.00,  location: 'Dry Store',    expiryDate: '2027-03-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-022', name: 'Suji Ravva',             category: 'Flours & Cereals', unit: 'kg',  currentStock: 20,   minStock: 8,   maxStock: 50,   unitCost: 48.00,  location: 'Dry Store',    expiryDate: '2027-03-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-023', name: 'Bans Iravva',            category: 'Flours & Cereals', unit: 'kg',  currentStock: 8,    minStock: 3,   maxStock: 20,   unitCost: 52.00,  location: 'Dry Store',    expiryDate: '2027-03-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-024', name: 'Meal Maker',             category: 'Flours & Cereals', unit: 'kg',  currentStock: 6,    minStock: 2,   maxStock: 15,   unitCost: 180.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'National Foods Ltd.' },
  { id: 'INV-025', name: 'Poha',                   category: 'Flours & Cereals', unit: 'kg',  currentStock: 12,   minStock: 5,   maxStock: 30,   unitCost: 55.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-026', name: 'Semiya',                 category: 'Flours & Cereals', unit: 'kg',  currentStock: 8,    minStock: 3,   maxStock: 20,   unitCost: 60.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Maha Grains Co.'     },
  { id: 'INV-027', name: 'Corn Flakes',            category: 'Flours & Cereals', unit: 'kg',  currentStock: 4,    minStock: 1.5, maxStock: 10,   unitCost: 180.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'National Foods Ltd.' },
  { id: 'INV-028', name: 'Pop Corn',               category: 'Packaged Foods',   unit: 'kg',  currentStock: 4,    minStock: 1.5, maxStock: 10,   unitCost: 85.00,  location: 'Dry Store',    expiryDate: '2026-12-01', supplier: 'National Foods Ltd.' },

  // ── Spices & Masalas ────────────────────────────
  { id: 'INV-029', name: 'Coriander Powder',       category: 'Spices & Masalas', unit: 'kg',  currentStock: 4,    minStock: 1.5, maxStock: 10,   unitCost: 120.00, location: 'Spice Rack',   expiryDate: '2027-01-01', supplier: 'SpiceHub India'      },
  { id: 'INV-030', name: 'Chilli Powder',          category: 'Spices & Masalas', unit: 'kg',  currentStock: 3,    minStock: 1,   maxStock: 8,    unitCost: 180.00, location: 'Spice Rack',   expiryDate: '2027-01-01', supplier: 'SpiceHub India'      },
  { id: 'INV-031', name: 'Turmeric Powder',        category: 'Spices & Masalas', unit: 'kg',  currentStock: 2.5,  minStock: 0.8, maxStock: 6,    unitCost: 140.00, location: 'Spice Rack',   expiryDate: '2027-01-01', supplier: 'SpiceHub India'      },
  { id: 'INV-032', name: 'Red Chilli Whole',       category: 'Spices & Masalas', unit: 'kg',  currentStock: 3,    minStock: 1,   maxStock: 8,    unitCost: 200.00, location: 'Spice Rack',   expiryDate: '2027-01-01', supplier: 'SpiceHub India'      },
  { id: 'INV-033', name: 'Hing (Asafoetida)',      category: 'Spices & Masalas', unit: 'g',   currentStock: 200,  minStock: 50,  maxStock: 500,  unitCost: 0.50,   location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-034', name: 'Chicken Masala 100gm',   category: 'Spices & Masalas', unit: 'pcs', currentStock: 20,   minStock: 6,   maxStock: 50,   unitCost: 35.00,  location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'MTR Foods Pvt Ltd'   },
  { id: 'INV-035', name: 'Meat Masala 100gm',      category: 'Spices & Masalas', unit: 'pcs', currentStock: 15,   minStock: 5,   maxStock: 40,   unitCost: 35.00,  location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'MTR Foods Pvt Ltd'   },
  { id: 'INV-036', name: 'Biryani Masala 100gm',   category: 'Spices & Masalas', unit: 'pcs', currentStock: 18,   minStock: 6,   maxStock: 45,   unitCost: 38.00,  location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'MTR Foods Pvt Ltd'   },
  { id: 'INV-037', name: 'Chat Masala 100gm',      category: 'Spices & Masalas', unit: 'pcs', currentStock: 12,   minStock: 4,   maxStock: 30,   unitCost: 32.00,  location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-038', name: 'Kitchen King Masala 100gm', category: 'Spices & Masalas', unit: 'pcs', currentStock: 10, minStock: 4, maxStock: 25,   unitCost: 40.00,  location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'MTR Foods Pvt Ltd'   },
  { id: 'INV-039', name: 'Panipuri Masala 100gm',  category: 'Spices & Masalas', unit: 'pcs', currentStock: 12,   minStock: 4,   maxStock: 30,   unitCost: 30.00,  location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-040', name: 'Sambar Powder 100gm',    category: 'Spices & Masalas', unit: 'pcs', currentStock: 15,   minStock: 5,   maxStock: 35,   unitCost: 35.00,  location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'MTR Foods Pvt Ltd'   },
  { id: 'INV-041', name: 'Rasam Powder 100gm',     category: 'Spices & Masalas', unit: 'pcs', currentStock: 12,   minStock: 4,   maxStock: 30,   unitCost: 32.00,  location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'MTR Foods Pvt Ltd'   },
  { id: 'INV-042', name: 'Garam Masala Powder 100gm', category: 'Spices & Masalas', unit: 'pcs', currentStock: 15, minStock: 5, maxStock: 35,   unitCost: 42.00,  location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'MTR Foods Pvt Ltd'   },
  { id: 'INV-043', name: 'Chhole Masala 100gm',    category: 'Spices & Masalas', unit: 'pcs', currentStock: 10,   minStock: 4,   maxStock: 25,   unitCost: 35.00,  location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'MTR Foods Pvt Ltd'   },
  { id: 'INV-044', name: 'Mustard Seeds',          category: 'Spices & Masalas', unit: 'kg',  currentStock: 3,    minStock: 1,   maxStock: 8,    unitCost: 80.00,  location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-045', name: 'Biryani Leaves',         category: 'Spices & Masalas', unit: 'g',   currentStock: 100,  minStock: 20,  maxStock: 250,  unitCost: 0.80,   location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-046', name: 'Sweet Anni Seed',        category: 'Spices & Masalas', unit: 'kg',  currentStock: 1.5,  minStock: 0.5, maxStock: 4,    unitCost: 200.00, location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-047', name: 'Anni Seed (Ajwain)',     category: 'Spices & Masalas', unit: 'kg',  currentStock: 1.5,  minStock: 0.5, maxStock: 4,    unitCost: 180.00, location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-048', name: 'Jeera (Cumin Seeds)',    category: 'Spices & Masalas', unit: 'kg',  currentStock: 2,    minStock: 0.5, maxStock: 5,    unitCost: 220.00, location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-049', name: 'Kasthuri Methi 100gm',  category: 'Spices & Masalas', unit: 'pcs', currentStock: 15,   minStock: 5,   maxStock: 35,   unitCost: 28.00,  location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-050', name: 'Lavang (Cloves)',        category: 'Spices & Masalas', unit: 'g',   currentStock: 200,  minStock: 50,  maxStock: 500,  unitCost: 1.20,   location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-051', name: 'Star Flower (Star Anise)',category: 'Spices & Masalas', unit: 'g',  currentStock: 150,  minStock: 30,  maxStock: 350,  unitCost: 1.50,   location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-052', name: 'Japathri (Mace)',        category: 'Spices & Masalas', unit: 'g',   currentStock: 100,  minStock: 20,  maxStock: 200,  unitCost: 2.00,   location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-053', name: 'Black Pepper Whole',     category: 'Spices & Masalas', unit: 'kg',  currentStock: 1.5,  minStock: 0.5, maxStock: 4,    unitCost: 650.00, location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-054', name: 'Dalchini (Cinnamon)',    category: 'Spices & Masalas', unit: 'g',   currentStock: 200,  minStock: 50,  maxStock: 400,  unitCost: 0.80,   location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-055', name: 'Marathi Mogga',          category: 'Spices & Masalas', unit: 'g',   currentStock: 100,  minStock: 20,  maxStock: 200,  unitCost: 1.00,   location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-056', name: 'Jayphal (Nutmeg)',       category: 'Spices & Masalas', unit: 'g',   currentStock: 100,  minStock: 20,  maxStock: 200,  unitCost: 1.80,   location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-057', name: 'Sajeera',               category: 'Spices & Masalas', unit: 'kg',  currentStock: 1,    minStock: 0.3, maxStock: 3,    unitCost: 280.00, location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-058', name: 'Green Soump (Fennel)',   category: 'Spices & Masalas', unit: 'kg',  currentStock: 1.5,  minStock: 0.5, maxStock: 4,    unitCost: 180.00, location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-059', name: 'White Soump',            category: 'Spices & Masalas', unit: 'kg',  currentStock: 1,    minStock: 0.3, maxStock: 3,    unitCost: 200.00, location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-060', name: 'Coriander Seeds',        category: 'Spices & Masalas', unit: 'kg',  currentStock: 2,    minStock: 0.8, maxStock: 5,    unitCost: 100.00, location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-061', name: 'Poppy Seeds',            category: 'Spices & Masalas', unit: 'kg',  currentStock: 0.5,  minStock: 0.1, maxStock: 1.5,  unitCost: 850.00, location: 'Spice Rack',   expiryDate: '2027-06-01', supplier: 'SpiceHub India'      },
  { id: 'INV-062', name: 'Burugpudi Bellam',       category: 'Condiments',       unit: 'kg',  currentStock: 4,    minStock: 1.5, maxStock: 10,   unitCost: 250.00, location: 'Dry Store',    expiryDate: '2027-01-01', supplier: 'Krishna Traders'     },

  // ── Oils & Fats ─────────────────────────────────
  { id: 'INV-063', name: 'Cooking Oil',            category: 'Oils & Fats',      unit: 'L',   currentStock: 20,   minStock: 8,   maxStock: 50,   unitCost: 155.00, location: 'Warehouse A',  expiryDate: '2027-06-01', supplier: 'Ruchi Oils & Fats'   },
  { id: 'INV-064', name: 'Ghee Amul',              category: 'Oils & Fats',      unit: 'kg',  currentStock: 5,    minStock: 2,   maxStock: 15,   unitCost: 540.00, location: 'Cold Room 1',  expiryDate: '2026-12-01', supplier: 'Amul Distributors'   },
  { id: 'INV-065', name: 'White Vinegar',          category: 'Oils & Fats',      unit: 'L',   currentStock: 3,    minStock: 1,   maxStock: 8,    unitCost: 45.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Krishna Traders'     },
  { id: 'INV-066', name: 'Dalda (Vanaspati)',      category: 'Oils & Fats',      unit: 'kg',  currentStock: 5,    minStock: 2,   maxStock: 12,   unitCost: 115.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Ruchi Oils & Fats'   },

  // ── Condiments ──────────────────────────────────
  { id: 'INV-067', name: 'Maggi Tomato Sauce',     category: 'Condiments',       unit: 'pcs', currentStock: 10,   minStock: 3,   maxStock: 25,   unitCost: 85.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'National Foods Ltd.' },
  { id: 'INV-068', name: 'Soya Sauce',             category: 'Condiments',       unit: 'L',   currentStock: 3,    minStock: 1,   maxStock: 8,    unitCost: 120.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'National Foods Ltd.' },
  { id: 'INV-069', name: 'Green Chilli Sauce',     category: 'Condiments',       unit: 'L',   currentStock: 2,    minStock: 0.5, maxStock: 6,    unitCost: 95.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'National Foods Ltd.' },
  { id: 'INV-070', name: 'Red Chilli Sauce',       category: 'Condiments',       unit: 'L',   currentStock: 2,    minStock: 0.5, maxStock: 6,    unitCost: 95.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'National Foods Ltd.' },
  { id: 'INV-071', name: 'Mix Fruit Jam',          category: 'Condiments',       unit: 'pcs', currentStock: 8,    minStock: 2,   maxStock: 20,   unitCost: 145.00, location: 'Dry Store',    expiryDate: '2027-12-01', supplier: 'National Foods Ltd.' },
  { id: 'INV-072', name: 'Honey',                  category: 'Condiments',       unit: 'kg',  currentStock: 3,    minStock: 1,   maxStock: 8,    unitCost: 420.00, location: 'Dry Store',    expiryDate: '2027-12-01', supplier: 'Krishna Traders'     },
  { id: 'INV-073', name: 'Snack Panipuri',         category: 'Packaged Foods',   unit: 'pcs', currentStock: 5,    minStock: 2,   maxStock: 15,   unitCost: 40.00,  location: 'Dry Store',    expiryDate: '2026-12-01', supplier: 'National Foods Ltd.' },
  { id: 'INV-074', name: 'MTR Gulab Jamun Mix 175gm', category: 'Packaged Foods', unit: 'pcs', currentStock: 8,  minStock: 2,   maxStock: 20,   unitCost: 80.00,  location: 'Dry Store',    expiryDate: '2027-12-01', supplier: 'MTR Foods Pvt Ltd'   },
  { id: 'INV-075', name: 'Tamarind',               category: 'Condiments',       unit: 'kg',  currentStock: 5,    minStock: 2,   maxStock: 12,   unitCost: 95.00,  location: 'Dry Store',    expiryDate: '2026-12-01', supplier: 'Krishna Traders'     },

  // ── Pickles ─────────────────────────────────────
  { id: 'INV-076', name: 'Garlic Pickle',          category: 'Pickles',          unit: 'kg',  currentStock: 3,    minStock: 1,   maxStock: 8,    unitCost: 220.00, location: 'Cold Room 1',  expiryDate: '2026-12-01', supplier: 'Pickle Palace'       },
  { id: 'INV-077', name: 'Ginger Pickle',          category: 'Pickles',          unit: 'kg',  currentStock: 2,    minStock: 0.8, maxStock: 6,    unitCost: 200.00, location: 'Cold Room 1',  expiryDate: '2026-12-01', supplier: 'Pickle Palace'       },
  { id: 'INV-078', name: 'Lemon Pickle',           category: 'Pickles',          unit: 'kg',  currentStock: 2,    minStock: 0.8, maxStock: 6,    unitCost: 180.00, location: 'Cold Room 1',  expiryDate: '2026-12-01', supplier: 'Pickle Palace'       },
  { id: 'INV-079', name: 'Mango Pickle',           category: 'Pickles',          unit: 'kg',  currentStock: 3,    minStock: 1,   maxStock: 8,    unitCost: 200.00, location: 'Cold Room 1',  expiryDate: '2026-12-01', supplier: 'Pickle Palace'       },
  { id: 'INV-080', name: 'Green Chilli Pickle',    category: 'Pickles',          unit: 'kg',  currentStock: 2,    minStock: 0.8, maxStock: 6,    unitCost: 170.00, location: 'Cold Room 1',  expiryDate: '2026-12-01', supplier: 'Pickle Palace'       },
  { id: 'INV-081', name: 'Gongura Pickle',         category: 'Pickles',          unit: 'kg',  currentStock: 2,    minStock: 0.5, maxStock: 6,    unitCost: 210.00, location: 'Cold Room 1',  expiryDate: '2026-12-01', supplier: 'Pickle Palace'       },
  { id: 'INV-082', name: 'Amla Pickle',            category: 'Pickles',          unit: 'kg',  currentStock: 2,    minStock: 0.5, maxStock: 6,    unitCost: 190.00, location: 'Cold Room 1',  expiryDate: '2026-12-01', supplier: 'Pickle Palace'       },

  // ── Dry Fruits & Nuts ───────────────────────────
  { id: 'INV-083', name: 'Kaju Broken',            category: 'Dry Fruits & Nuts',unit: 'kg',  currentStock: 2,    minStock: 0.5, maxStock: 5,    unitCost: 700.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Krishna Traders'     },
  { id: 'INV-084', name: 'Kaju Palla Half',        category: 'Dry Fruits & Nuts',unit: 'kg',  currentStock: 1,    minStock: 0.3, maxStock: 3,    unitCost: 750.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Krishna Traders'     },
  { id: 'INV-085', name: 'White Til (Sesame)',     category: 'Dry Fruits & Nuts',unit: 'kg',  currentStock: 3,    minStock: 1,   maxStock: 8,    unitCost: 160.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'Maha Grains Co.'     },

  // ── Beverages ───────────────────────────────────
  { id: 'INV-086', name: 'Tea Powder Agni',        category: 'Beverages',        unit: 'kg',  currentStock: 3,    minStock: 1,   maxStock: 8,    unitCost: 380.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'National Foods Ltd.' },
  { id: 'INV-087', name: 'Coffee Powder 200gm',    category: 'Beverages',        unit: 'pcs', currentStock: 10,   minStock: 3,   maxStock: 25,   unitCost: 120.00, location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'National Foods Ltd.' },

  // ── Packaged Foods / Others ─────────────────────
  { id: 'INV-088', name: 'Rice Papad',             category: 'Packaged Foods',   unit: 'pcs', currentStock: 20,   minStock: 5,   maxStock: 50,   unitCost: 25.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'National Foods Ltd.' },
  { id: 'INV-089', name: 'Lizzat Papad',           category: 'Packaged Foods',   unit: 'pcs', currentStock: 15,   minStock: 4,   maxStock: 40,   unitCost: 28.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'National Foods Ltd.' },
  { id: 'INV-090', name: 'Mushrooms',              category: 'Packaged Foods',   unit: 'kg',  currentStock: 3,    minStock: 1,   maxStock: 8,    unitCost: 180.00, location: 'Cold Room 2',  expiryDate: '2026-06-15', supplier: 'Fresh Farms India'   },
  { id: 'INV-091', name: 'Maggi Pkts Big',         category: 'Packaged Foods',   unit: 'pcs', currentStock: 20,   minStock: 6,   maxStock: 50,   unitCost: 14.00,  location: 'Dry Store',    expiryDate: '2027-06-01', supplier: 'National Foods Ltd.' },
  { id: 'INV-092', name: 'Salt',                   category: 'Packaged Foods',   unit: 'kg',  currentStock: 10,   minStock: 4,   maxStock: 25,   unitCost: 18.00,  location: 'Dry Store',    expiryDate: '2027-12-01', supplier: 'Krishna Traders'     },
  { id: 'INV-093', name: 'Sugar',                  category: 'Packaged Foods',   unit: 'kg',  currentStock: 15,   minStock: 5,   maxStock: 40,   unitCost: 42.00,  location: 'Dry Store',    expiryDate: '2027-12-01', supplier: 'Krishna Traders'     },
];

// ── Categories ───────────────────────────────────────
export const categories = [
  'All Categories', 'Grains & Pulses', 'Flours & Cereals', 'Spices & Masalas',
  'Oils & Fats', 'Condiments', 'Pickles', 'Dry Fruits & Nuts', 'Beverages', 'Packaged Foods',
];

// ── Suppliers ────────────────────────────────────────
export const suppliers = [
  { id: 'SUP-001', name: 'Lalitha Stores',      category: 'Grains & Rice',       contact: 'Lalitha Devi',   email: 'lalitha@lalithastores.com',  phone: '+91-98490-11001', city: 'Hyderabad',  country: 'India', rating: 4.8, totalOrders: 52, totalSpend: 94000,  status: 'Active',   since: '2021-01-10', paymentTerms: 'Net 15' },
  { id: 'SUP-002', name: 'Maha Grains Co.',     category: 'Pulses & Flours',     contact: 'Mahesh Rao',     email: 'mahesh@mahagrains.com',      phone: '+91-98490-22002', city: 'Hyderabad',  country: 'India', rating: 4.6, totalOrders: 88, totalSpend: 72000,  status: 'Active',   since: '2020-06-15', paymentTerms: 'Net 30' },
  { id: 'SUP-003', name: 'SpiceHub India',      category: 'Spices & Masalas',    contact: 'Suresh Nair',    email: 'suresh@spicehub.in',         phone: '+91-98490-33003', city: 'Guntur',     country: 'India', rating: 4.7, totalOrders: 65, totalSpend: 48000,  status: 'Active',   since: '2021-03-20', paymentTerms: 'Net 15' },
  { id: 'SUP-004', name: 'Krishna Traders',     category: 'General Groceries',   contact: 'Krishna Murthy', email: 'krishna@krishnatraders.com', phone: '+91-98490-44004', city: 'Vijayawada', country: 'India', rating: 4.3, totalOrders: 110,totalSpend: 58000,  status: 'Active',   since: '2020-09-01', paymentTerms: 'Net 7'  },
  { id: 'SUP-005', name: 'National Foods Ltd.', category: 'Packaged Foods',      contact: 'Ravi Shankar',   email: 'ravi@nationalfoods.com',     phone: '+91-98490-55005', city: 'Hyderabad',  country: 'India', rating: 4.5, totalOrders: 74, totalSpend: 62000,  status: 'Active',   since: '2021-07-12', paymentTerms: 'Net 30' },
  { id: 'SUP-006', name: 'Amul Distributors',   category: 'Dairy & Ghee',        contact: 'Anand Patel',    email: 'anand@amuldist.com',         phone: '+91-98490-66006', city: 'Hyderabad',  country: 'India', rating: 4.9, totalOrders: 96, totalSpend: 115000, status: 'Active',   since: '2020-03-05', paymentTerms: 'Net 21' },
  { id: 'SUP-007', name: 'Ruchi Oils & Fats',   category: 'Oils & Fats',         contact: 'Priya Reddy',    email: 'priya@ruchioils.com',        phone: '+91-98490-77007', city: 'Hyderabad',  country: 'India', rating: 4.4, totalOrders: 38, totalSpend: 89000,  status: 'Active',   since: '2021-11-20', paymentTerms: 'Net 15' },
  { id: 'SUP-008', name: 'MTR Foods Pvt Ltd',   category: 'Masalas & Packaged',  contact: 'Ramesh Kumar',   email: 'ramesh@mtrfoods.com',        phone: '+91-98490-88008', city: 'Bangalore',  country: 'India', rating: 4.8, totalOrders: 42, totalSpend: 38000,  status: 'Active',   since: '2022-02-14', paymentTerms: 'Net 30' },
  { id: 'SUP-009', name: 'Pickle Palace',       category: 'Pickles & Condiments',contact: 'Savitha Rani',   email: 'savitha@picklepalace.com',   phone: '+91-98490-99009', city: 'Visakhapatnam', country: 'India', rating: 4.2, totalOrders: 29, totalSpend: 22000, status: 'Active', since: '2022-05-08', paymentTerms: 'Net 14' },
  { id: 'SUP-010', name: 'Fresh Farms India',   category: 'Fresh Produce',       contact: 'Nagaraju B.',    email: 'nagaraju@freshfarms.in',     phone: '+91-98490-10010', city: 'Hyderabad',  country: 'India', rating: 4.1, totalOrders: 18, totalSpend: 14000,  status: 'Active',   since: '2023-01-18', paymentTerms: 'Net 7'  },
];

// ── Purchase Orders ──────────────────────────────────
export const purchaseOrders = [
  { id: 'PO-2026-001', supplier: 'Lalitha Stores',      date: '2026-05-20', deliveryDate: '2026-05-28', items: 2, totalValue: 12350.00, status: 'Delivered',  paymentStatus: 'Paid',    notes: 'Monthly rice restock' },
  { id: 'PO-2026-002', supplier: 'Maha Grains Co.',     date: '2026-05-22', deliveryDate: '2026-05-26', items: 8, totalValue: 8640.00,  status: 'Delivered',  paymentStatus: 'Paid',    notes: 'Dal & flour restock' },
  { id: 'PO-2026-003', supplier: 'SpiceHub India',      date: '2026-05-24', deliveryDate: '2026-05-27', items: 12,totalValue: 4800.00,  status: 'In Transit', paymentStatus: 'Pending', notes: 'Spice & masala monthly order' },
  { id: 'PO-2026-004', supplier: 'National Foods Ltd.', date: '2026-05-25', deliveryDate: '2026-05-29', items: 6, totalValue: 3120.00,  status: 'Processing', paymentStatus: 'Pending', notes: 'Packaged foods reorder' },
  { id: 'PO-2026-005', supplier: 'Pickle Palace',       date: '2026-05-26', deliveryDate: '2026-06-02', items: 7, totalValue: 2800.00,  status: 'Approved',   paymentStatus: 'Pending', supplier: 'Pickle Palace', notes: 'Pickle assortment' },
  { id: 'PO-2026-006', supplier: 'Ruchi Oils & Fats',   date: '2026-05-26', deliveryDate: '2026-06-05', items: 2, totalValue: 7200.00,  status: 'Draft',      paymentStatus: 'Unpaid',  notes: 'Cooking oil restock' },
  { id: 'PO-2026-007', supplier: 'MTR Foods Pvt Ltd',   date: '2026-05-15', deliveryDate: '2026-05-20', items: 8, totalValue: 3600.00,  status: 'Delivered',  paymentStatus: 'Paid',    notes: 'MTR masala packs' },
  { id: 'PO-2026-008', supplier: 'Krishna Traders',     date: '2026-05-18', deliveryDate: '2026-05-23', items: 5, totalValue: 2100.00,  status: 'Delivered',  paymentStatus: 'Paid',    notes: 'Salt, sugar, tamarind' },
  { id: 'PO-2026-009', supplier: 'Amul Distributors',   date: '2026-05-27', deliveryDate: '2026-06-04', items: 1, totalValue: 5400.00,  status: 'Approved',   paymentStatus: 'Pending', notes: 'Ghee bulk order' },
  { id: 'PO-2026-010', supplier: 'Krishna Traders',     date: '2026-05-23', deliveryDate: '2026-05-30', items: 4, totalValue: 1800.00,  status: 'In Transit', paymentStatus: 'Pending', notes: 'Honey, vinegar, condiments' },
];

// ── Wastage Log ──────────────────────────────────────
export const wastageLog = [
  { id: 'WST-001', date: '2026-05-27', item: 'Mushrooms',         category: 'Packaged Foods',   qty: 1.5,  unit: 'kg',  reason: 'Spoilage',         costImpact: 270.00, loggedBy: 'Chef Ravi',     notes: 'Temperature issue in Cold Room 2' },
  { id: 'WST-002', date: '2026-05-27', item: 'Poha',              category: 'Flours & Cereals', qty: 3.0,  unit: 'kg',  reason: 'Expired',          costImpact: 165.00, loggedBy: 'Maria S.',      notes: 'Past use-by date' },
  { id: 'WST-003', date: '2026-05-26', item: 'Maida',             category: 'Flours & Cereals', qty: 4.0,  unit: 'kg',  reason: 'Contamination',    costImpact: 160.00, loggedBy: 'Chef Ravi',     notes: 'Insect found in bag' },
  { id: 'WST-004', date: '2026-05-26', item: 'Ghee Amul',         category: 'Oils & Fats',      qty: 0.5,  unit: 'kg',  reason: 'Expired',          costImpact: 270.00, loggedBy: 'Sunita K.',     notes: 'Past use-by date' },
  { id: 'WST-005', date: '2026-05-25', item: 'Rice Lalitha',      category: 'Grains & Pulses',  qty: 5.0,  unit: 'kg',  reason: 'Spillage',         costImpact: 240.00, loggedBy: 'Maria S.',      notes: 'Storage bin overflow' },
  { id: 'WST-006', date: '2026-05-25', item: 'Tamarind',          category: 'Condiments',       qty: 0.8,  unit: 'kg',  reason: 'Spoilage',         costImpact: 76.00,  loggedBy: 'Chef Ravi',     notes: 'Excessive moisture' },
  { id: 'WST-007', date: '2026-05-24', item: 'Chanadal',          category: 'Grains & Pulses',  qty: 2.0,  unit: 'kg',  reason: 'Over-preparation', costImpact: 190.00, loggedBy: 'Sunita K.',     notes: 'Excess dal prepared' },
  { id: 'WST-008', date: '2026-05-24', item: 'Chicken Masala 100gm', category: 'Spices & Masalas', qty: 3, unit: 'pcs', reason: 'Expired',          costImpact: 105.00, loggedBy: 'Maria S.',      notes: 'Found expired during stock check' },
  { id: 'WST-009', date: '2026-05-23', item: 'Semiya',            category: 'Flours & Cereals', qty: 2.0,  unit: 'kg',  reason: 'Spoilage',         costImpact: 120.00, loggedBy: 'Chef Ravi',     notes: 'Moisture absorption' },
  { id: 'WST-010', date: '2026-05-22', item: 'Kaju Broken',       category: 'Dry Fruits & Nuts',qty: 0.2,  unit: 'kg',  reason: 'Contamination',    costImpact: 140.00, loggedBy: 'Sunita K.',     notes: 'Discolouration noticed' },
  { id: 'WST-011', date: '2026-05-21', item: 'Meal Maker',        category: 'Flours & Cereals', qty: 1.0,  unit: 'kg',  reason: 'Over-preparation', costImpact: 180.00, loggedBy: 'Chef Ravi',     notes: 'Excess cooked for event' },
  { id: 'WST-012', date: '2026-05-20', item: 'Cooking Oil',       category: 'Oils & Fats',      qty: 1.5,  unit: 'L',   reason: 'Spillage',         costImpact: 232.50, loggedBy: 'Maria S.',      notes: 'Bottle dropped in kitchen' },
];

// ── Dashboard KPI Data ───────────────────────────────
export const kpiData = {
  totalItems:          { value: 93,      trend: +12,  trendType: 'up',      label: 'Total Stock Items',      sub: 'vs last month' },
  lowStockAlerts:      { value: 8,       trend: -3,   trendType: 'down',    label: 'Low Stock Alerts',       sub: 'vs last week' },
  purchaseOrders:      { value: 10,      trend: +4,   trendType: 'up',      label: 'Purchase Orders (MTD)',  sub: 'vs last month' },
  wastageThisMonth:    { value: '₹1,949',trend: -18,  trendType: 'down',    label: 'Wastage This Month',     sub: 'vs last month' },
  totalInventoryValue: { value: '₹1,24,380', trend: +6, trendType: 'up',   label: 'Total Inventory Value',  sub: 'vs last month' },
  activeSuppliers:     { value: 10,      trend: 0,    trendType: 'neutral', label: 'Active Suppliers',       sub: 'no change' },
};

// ── Stock Level Trend (Last 7 days) ──────────────────
export const stockTrendData = [
  { day: 'Mon', inStock: 72, lowStock: 14, outOfStock: 7 },
  { day: 'Tue', inStock: 74, lowStock: 13, outOfStock: 6 },
  { day: 'Wed', inStock: 70, lowStock: 16, outOfStock: 7 },
  { day: 'Thu', inStock: 76, lowStock: 12, outOfStock: 5 },
  { day: 'Fri', inStock: 73, lowStock: 14, outOfStock: 6 },
  { day: 'Sat', inStock: 69, lowStock: 18, outOfStock: 6 },
  { day: 'Sun', inStock: 71, lowStock: 16, outOfStock: 6 },
];

// ── Category Distribution ────────────────────────────
export const categoryDistribution = [
  { name: 'Spices & Masalas', value: 34, color: '#4F46E5' },
  { name: 'Grains & Pulses',  value: 15, color: '#10B981' },
  { name: 'Flours & Cereals', value: 13, color: '#F59E0B' },
  { name: 'Packaged Foods',   value: 9,  color: '#3B82F6' },
  { name: 'Condiments',       value: 8,  color: '#8B5CF6' },
  { name: 'Pickles',          value: 7,  color: '#EC4899' },
  { name: 'Oils & Fats',      value: 4,  color: '#06B6D4' },
  { name: 'Others',           value: 3,  color: '#F97316' },
];

// ── Monthly Wastage Cost ─────────────────────────────
export const monthlyWastageCost = [
  { month: 'Dec', cost: 2800 },
  { month: 'Jan', cost: 2400 },
  { month: 'Feb', cost: 3100 },
  { month: 'Mar', cost: 2600 },
  { month: 'Apr', cost: 2200 },
  { month: 'May', cost: 1949 },
];

// ── Top Items by Value ───────────────────────────────
export const topItemsByValue = [
  { name: 'Kaju Palla Half',  value: 750  },
  { name: 'Kaju Broken',      value: 1400 },
  { name: 'Ghee Amul',        value: 2700 },
  { name: 'Cooking Oil',      value: 3100 },
  { name: 'Black Pepper',     value: 975  },
];

// ── PO Status Summary ────────────────────────────────
export const poStatusSummary = [
  { status: 'Draft',      count: 1, color: '#94A3B8' },
  { status: 'Approved',   count: 2, color: '#4F46E5' },
  { status: 'In Transit', count: 2, color: '#3B82F6' },
  { status: 'Processing', count: 1, color: '#F59E0B' },
  { status: 'Delivered',  count: 4, color: '#10B981' },
];

// ── Recent Activity Feed ─────────────────────────────
export const recentActivity = [
  { id: 1, type: 'order',   icon: '📦', title: 'PO-2026-003 dispatched by SpiceHub India',          time: '2 hours ago',   color: '#E0E7FF', textColor: '#4F46E5' },
  { id: 2, type: 'alert',   icon: '⚠️', title: 'Cooking Oil stock dropped below minimum threshold', time: '4 hours ago',   color: '#FFFBEB', textColor: '#D97706' },
  { id: 3, type: 'wastage', icon: '🗑️', title: 'Wastage logged: 1.5kg Mushrooms (spoilage)',       time: '6 hours ago',   color: '#FEF2F2', textColor: '#DC2626' },
  { id: 4, type: 'order',   icon: '✅', title: 'PO-2026-002 delivered & confirmed — Maha Grains',   time: 'Yesterday',     color: '#ECFDF5', textColor: '#059669' },
  { id: 5, type: 'stock',   icon: '📊', title: 'Rice Lalitha restocked to 150kg by warehouse',     time: 'Yesterday',     color: '#ECFDF5', textColor: '#059669' },
  { id: 6, type: 'alert',   icon: '⚠️', title: 'Ghee Amul approaching expiry — 6 months left',     time: '2 days ago',    color: '#FFFBEB', textColor: '#D97706' },
];

// ── Wastage Reason Summary ───────────────────────────
export const wastageByReason = [
  { reason: 'Spoilage',         count: 3, cost: 666.00 },
  { reason: 'Expired',          count: 3, cost: 645.00 },
  { reason: 'Contamination',    count: 2, cost: 300.00 },
  { reason: 'Over-preparation', count: 2, cost: 370.00 },
  { reason: 'Spillage',         count: 2, cost: 472.50 },
];

// ── Wastage by Category ──────────────────────────────
export const wastageByCategory = [
  { category: 'Flours & Cereals', cost: 625.00 },
  { category: 'Grains & Pulses',  cost: 430.00 },
  { category: 'Oils & Fats',      cost: 502.50 },
  { category: 'Spices & Masalas', cost: 105.00 },
  { category: 'Condiments',       cost: 76.00  },
  { category: 'Packaged Foods',   cost: 270.00 },
  { category: 'Dry Fruits & Nuts',cost: 140.00 },
];

// ── Utilities ────────────────────────────────────────
export const getStockStatus = (current, min, max) => {
  if (current === 0)          return { label: 'Out of Stock', type: 'danger'  };
  if (current <= min)         return { label: 'Low Stock',    type: 'warning' };
  if (current >= max * 0.9)   return { label: 'Overstocked', type: 'info'    };
  return                             { label: 'In Stock',     type: 'success' };
};

export const getStockPercent  = (current, max) => Math.min(Math.round((current / max) * 100), 100);

export const getStockBarClass = (percent) => {
  if (percent === 0) return 'low';
  if (percent <= 25) return 'low';
  if (percent <= 55) return 'medium';
  return 'high';
};

export const getPOStatusType = (status) => {
  const map = { 'Draft': 'neutral', 'Approved': 'primary', 'Processing': 'warning', 'In Transit': 'info', 'Delivered': 'success', 'Cancelled': 'danger' };
  return map[status] || 'neutral';
};

export const getSupplierStatusType = (status) => {
  if (status === 'Active')   return 'success';
  if (status === 'On Hold')  return 'warning';
  if (status === 'Inactive') return 'danger';
  return 'neutral';
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const getDaysUntilExpiry = (dateStr) => {
  const now  = new Date();
  const exp  = new Date(dateStr);
  return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
};

/* ══════════════════════════════════════════════════════
   INVENTORY USAGE DATA — per-item daily consumption
   ══════════════════════════════════════════════════════ */
export const itemUsageData = {
  'INV-001': { dailyUsage: 20,   history: [18,22,20,25,19,21,18], peakDay: 'Thu', lastRestocked: '2026-05-01', restockQty: 100 },
  'INV-002': { dailyUsage: 10,   history: [8,12,10,14,10,11,9],  peakDay: 'Thu', lastRestocked: '2026-05-05', restockQty: 50  },
  'INV-003': { dailyUsage: 3,    history: [2.5,3.5,3,4,3,2.5,2.5], peakDay: 'Thu', lastRestocked: '2026-04-20', restockQty: 20 },
  'INV-004': { dailyUsage: 2.5,  history: [2,3,2.5,3,2.5,2,2],  peakDay: 'Thu', lastRestocked: '2026-04-20', restockQty: 15  },
  'INV-005': { dailyUsage: 2,    history: [1.5,2.5,2,2.5,2,1.5,1.5], peakDay: 'Thu', lastRestocked: '2026-04-18', restockQty: 15 },
  'INV-006': { dailyUsage: 1.5,  history: [1,2,1.5,2,1.5,1,1],  peakDay: 'Thu', lastRestocked: '2026-04-15', restockQty: 12  },
  'INV-007': { dailyUsage: 2,    history: [1.5,2.5,2,2.5,2,1.5,1.5], peakDay: 'Thu', lastRestocked: '2026-04-20', restockQty: 15 },
  'INV-008': { dailyUsage: 2.5,  history: [2,3,2.5,3,2.5,2,2],  peakDay: 'Thu', lastRestocked: '2026-04-22', restockQty: 18  },
  'INV-009': { dailyUsage: 2,    history: [1.5,2.5,2,2.5,2,1.5,1.5], peakDay: 'Thu', lastRestocked: '2026-04-20', restockQty: 15 },
  'INV-010': { dailyUsage: 3,    history: [2.5,3.5,3,4,3,2.5,2.5], peakDay: 'Thu', lastRestocked: '2026-04-25', restockQty: 20 },
  'INV-011': { dailyUsage: 2,    history: [1.5,2.5,2,2.5,2,1.5,1.5], peakDay: 'Thu', lastRestocked: '2026-04-15', restockQty: 10 },
  'INV-012': { dailyUsage: 2,    history: [1.5,2.5,2,2.5,2,1.5,1.5], peakDay: 'Thu', lastRestocked: '2026-04-18', restockQty: 12 },
  'INV-013': { dailyUsage: 0.5,  history: [0.3,0.7,0.5,0.7,0.5,0.4,0.4], peakDay: 'Thu', lastRestocked: '2026-04-10', restockQty: 8 },
  'INV-014': { dailyUsage: 1,    history: [0.8,1.2,1,1.5,1,0.8,0.8], peakDay: 'Thu', lastRestocked: '2026-04-12', restockQty: 8 },
  'INV-015': { dailyUsage: 1.5,  history: [1,2,1.5,2,1.5,1,1],  peakDay: 'Thu', lastRestocked: '2026-04-20', restockQty: 12  },
  'INV-016': { dailyUsage: 5,    history: [4,6,5,7,5,5,4],       peakDay: 'Thu', lastRestocked: '2026-05-01', restockQty: 30  },
  'INV-017': { dailyUsage: 3,    history: [2.5,3.5,3,4,3,2.5,2.5], peakDay: 'Thu', lastRestocked: '2026-04-25', restockQty: 15 },
  'INV-018': { dailyUsage: 1.5,  history: [1,2,1.5,2,1.5,1,1],  peakDay: 'Thu', lastRestocked: '2026-04-20', restockQty: 10  },
  'INV-019': { dailyUsage: 1,    history: [0.8,1.2,1,1.5,1,0.8,0.8], peakDay: 'Thu', lastRestocked: '2026-04-15', restockQty: 8 },
  'INV-020': { dailyUsage: 1.5,  history: [1,2,1.5,2,1.5,1,1],  peakDay: 'Thu', lastRestocked: '2026-04-22', restockQty: 10  },
  'INV-021': { dailyUsage: 2.5,  history: [2,3,2.5,3,2.5,2,2],  peakDay: 'Thu', lastRestocked: '2026-04-28', restockQty: 18  },
  'INV-022': { dailyUsage: 3,    history: [2.5,3.5,3,4,3,2.5,2.5], peakDay: 'Thu', lastRestocked: '2026-04-25', restockQty: 15 },
  'INV-023': { dailyUsage: 2,    history: [1.5,2.5,2,2.5,2,1.5,1.5], peakDay: 'Thu', lastRestocked: '2026-04-20', restockQty: 12 },
  'INV-024': { dailyUsage: 0.8,  history: [0.5,1,0.8,1,0.8,0.6,0.6], peakDay: 'Thu', lastRestocked: '2026-04-10', restockQty: 8 },
  'INV-025': { dailyUsage: 2,    history: [1.5,2.5,2,2.5,2,1.5,1.5], peakDay: 'Thu', lastRestocked: '2026-04-20', restockQty: 12 },
  'INV-026': { dailyUsage: 1.5,  history: [1,2,1.5,2,1.5,1,1],  peakDay: 'Thu', lastRestocked: '2026-04-22', restockQty: 10  },
  'INV-027': { dailyUsage: 0.3,  history: [0.2,0.4,0.3,0.4,0.3,0.2,0.2], peakDay: 'Thu', lastRestocked: '2026-04-05', restockQty: 3 },
  'INV-028': { dailyUsage: 0.5,  history: [0.3,0.7,0.5,0.7,0.5,0.4,0.4], peakDay: 'Thu', lastRestocked: '2026-04-08', restockQty: 4 },
  'INV-029': { dailyUsage: 0.3,  history: [0.2,0.4,0.3,0.4,0.3,0.2,0.2], peakDay: 'Thu', lastRestocked: '2026-04-01', restockQty: 3 },
  'INV-030': { dailyUsage: 0.2,  history: [0.1,0.3,0.2,0.3,0.2,0.1,0.1], peakDay: 'Thu', lastRestocked: '2026-03-25', restockQty: 2 },
  'INV-031': { dailyUsage: 0.1,  history: [0.08,0.12,0.1,0.12,0.1,0.08,0.08], peakDay: 'Thu', lastRestocked: '2026-03-20', restockQty: 1.5 },
  'INV-032': { dailyUsage: 1.5,  history: [1,2,1.5,2,1.5,1,1],  peakDay: 'Thu', lastRestocked: '2026-04-15', restockQty: 10  },
  'INV-033': { dailyUsage: 0.2,  history: [0.1,0.3,0.2,0.3,0.2,0.1,0.1], peakDay: 'Thu', lastRestocked: '2026-03-10', restockQty: 2 },
  'INV-034': { dailyUsage: 5,    history: [3,7,5,8,5,4,4],       peakDay: 'Thu', lastRestocked: '2026-04-20', restockQty: 20  },
  'INV-035': { dailyUsage: 0.3,  history: [0.2,0.4,0.3,0.4,0.3,0.2,0.2], peakDay: 'Thu', lastRestocked: '2026-03-15', restockQty: 2 },
  'INV-036': { dailyUsage: 0.2,  history: [0.1,0.3,0.2,0.3,0.2,0.1,0.1], peakDay: 'Thu', lastRestocked: '2026-03-15', restockQty: 2 },
  'INV-037': { dailyUsage: 0.3,  history: [0.2,0.4,0.3,0.4,0.3,0.2,0.2], peakDay: 'Thu', lastRestocked: '2026-03-15', restockQty: 2 },
  'INV-038': { dailyUsage: 0.2,  history: [0.1,0.3,0.2,0.3,0.2,0.1,0.1], peakDay: 'Thu', lastRestocked: '2026-03-10', restockQty: 1.5 },
  'INV-039': { dailyUsage: 1,    history: [0.5,1.5,1,1.5,1,0.8,0.8],  peakDay: 'Thu', lastRestocked: '2026-04-10', restockQty: 1 },
  'INV-040': { dailyUsage: 1,    history: [0.5,1.5,1,1.5,1,0.8,0.8],  peakDay: 'Thu', lastRestocked: '2026-04-05', restockQty: 1 },
  'INV-041': { dailyUsage: 0.5,  history: [0.3,0.7,0.5,0.7,0.5,0.4,0.4], peakDay: 'Thu', lastRestocked: '2026-04-01', restockQty: 10 },
  'INV-042': { dailyUsage: 1,    history: [0.5,1.5,1,1.5,1,0.8,0.8],  peakDay: 'Thu', lastRestocked: '2026-04-05', restockQty: 12 },
  'INV-043': { dailyUsage: 0.8,  history: [0.5,1,0.8,1,0.8,0.6,0.6],  peakDay: 'Thu', lastRestocked: '2026-04-01', restockQty: 10 },
  'INV-044': { dailyUsage: 1,    history: [0.5,1.5,1,1.5,1,0.8,0.8],  peakDay: 'Thu', lastRestocked: '2026-04-08', restockQty: 10 },
  'INV-045': { dailyUsage: 0.8,  history: [0.5,1,0.8,1,0.8,0.6,0.6],  peakDay: 'Thu', lastRestocked: '2026-04-01', restockQty: 10 },
  'INV-046': { dailyUsage: 0.5,  history: [0.3,0.7,0.5,0.7,0.5,0.4,0.4], peakDay: 'Thu', lastRestocked: '2026-04-01', restockQty: 8 },
  'INV-047': { dailyUsage: 0.5,  history: [0.3,0.7,0.5,0.7,0.5,0.4,0.4], peakDay: 'Thu', lastRestocked: '2026-04-01', restockQty: 8 },
  'INV-048': { dailyUsage: 10,   history: [8,12,10,14,10,8,8],   peakDay: 'Thu', lastRestocked: '2026-04-05', restockQty: 50  },
  'INV-049': { dailyUsage: 0.05, history: [0.03,0.07,0.05,0.07,0.05,0.04,0.04], peakDay: 'Thu', lastRestocked: '2026-03-01', restockQty: 0.5 },
  'INV-050': { dailyUsage: 1,    history: [0.5,1.5,1,1.5,1,0.8,0.8],  peakDay: 'Thu', lastRestocked: '2026-04-05', restockQty: 12 },
  'INV-051': { dailyUsage: 0.8,  history: [0.5,1,0.8,1,0.8,0.6,0.6],  peakDay: 'Thu', lastRestocked: '2026-04-01', restockQty: 10 },
  'INV-052': { dailyUsage: 0.8,  history: [0.5,1,0.8,1,0.8,0.6,0.6],  peakDay: 'Thu', lastRestocked: '2026-04-01', restockQty: 10 },
  'INV-053': { dailyUsage: 10,   history: [8,12,10,14,10,8,8],   peakDay: 'Thu', lastRestocked: '2026-04-10', restockQty: 80  },
  'INV-054': { dailyUsage: 0.05, history: [0.03,0.07,0.05,0.07,0.05,0.04,0.04], peakDay: 'Thu', lastRestocked: '2026-03-15', restockQty: 0.5 },
  'INV-055': { dailyUsage: 5,    history: [3,7,5,7,5,4,4],       peakDay: 'Thu', lastRestocked: '2026-04-05', restockQty: 50  },
  'INV-056': { dailyUsage: 5,    history: [3,7,5,7,5,4,4],       peakDay: 'Thu', lastRestocked: '2026-04-05', restockQty: 20  },
  'INV-057': { dailyUsage: 0.1,  history: [0.08,0.12,0.1,0.12,0.1,0.08,0.08], peakDay: 'Thu', lastRestocked: '2026-03-10', restockQty: 1.5 },
  'INV-058': { dailyUsage: 1.5,  history: [1,2,1.5,2,1.5,1,1],  peakDay: 'Thu', lastRestocked: '2026-04-20', restockQty: 10  },
  'INV-059': { dailyUsage: 0.05, history: [0.03,0.07,0.05,0.07,0.05,0.04,0.04], peakDay: 'Thu', lastRestocked: '2026-03-01', restockQty: 0.5 },
  'INV-060': { dailyUsage: 0.1,  history: [0.08,0.12,0.1,0.12,0.1,0.08,0.08], peakDay: 'Thu', lastRestocked: '2026-03-15', restockQty: 1 },
  'INV-061': { dailyUsage: 0.02, history: [0.01,0.03,0.02,0.03,0.02,0.02,0.01], peakDay: 'Thu', lastRestocked: '2026-02-01', restockQty: 0.3 },
  'INV-062': { dailyUsage: 0.3,  history: [0.2,0.4,0.3,0.4,0.3,0.2,0.2], peakDay: 'Thu', lastRestocked: '2026-04-10', restockQty: 3 },
  'INV-063': { dailyUsage: 3,    history: [2.5,3.5,3,4,3,2.5,2.5], peakDay: 'Thu', lastRestocked: '2026-05-10', restockQty: 20 },
  'INV-064': { dailyUsage: 0.3,  history: [0.2,0.4,0.3,0.4,0.3,0.2,0.2], peakDay: 'Thu', lastRestocked: '2026-05-01', restockQty: 3 },
  'INV-065': { dailyUsage: 0.1,  history: [0.08,0.12,0.1,0.12,0.1,0.08,0.08], peakDay: 'Thu', lastRestocked: '2026-03-15', restockQty: 2 },
  'INV-066': { dailyUsage: 0.5,  history: [0.3,0.7,0.5,0.7,0.5,0.4,0.4], peakDay: 'Thu', lastRestocked: '2026-04-20', restockQty: 5 },
  'INV-067': { dailyUsage: 0.5,  history: [0.3,0.7,0.5,0.7,0.5,0.4,0.4], peakDay: 'Thu', lastRestocked: '2026-04-15', restockQty: 8 },
  'INV-068': { dailyUsage: 0.1,  history: [0.08,0.12,0.1,0.12,0.1,0.08,0.08], peakDay: 'Thu', lastRestocked: '2026-04-01', restockQty: 2 },
  'INV-069': { dailyUsage: 0.1,  history: [0.05,0.15,0.1,0.15,0.1,0.08,0.08], peakDay: 'Thu', lastRestocked: '2026-04-01', restockQty: 2 },
  'INV-070': { dailyUsage: 0.1,  history: [0.05,0.15,0.1,0.15,0.1,0.08,0.08], peakDay: 'Thu', lastRestocked: '2026-04-01', restockQty: 2 },
  'INV-071': { dailyUsage: 0.5,  history: [0.3,0.7,0.5,0.7,0.5,0.4,0.4], peakDay: 'Thu', lastRestocked: '2026-04-20', restockQty: 6 },
  'INV-072': { dailyUsage: 0.1,  history: [0.05,0.15,0.1,0.15,0.1,0.08,0.08], peakDay: 'Thu', lastRestocked: '2026-04-05', restockQty: 2 },
  'INV-073': { dailyUsage: 1,    history: [0.5,1.5,1,1.5,1,0.8,0.8],  peakDay: 'Thu', lastRestocked: '2026-04-10', restockQty: 4 },
  'INV-074': { dailyUsage: 0.3,  history: [0.2,0.4,0.3,0.4,0.3,0.2,0.2], peakDay: 'Thu', lastRestocked: '2026-04-10', restockQty: 5 },
  'INV-075': { dailyUsage: 0.5,  history: [0.3,0.7,0.5,0.7,0.5,0.4,0.4], peakDay: 'Thu', lastRestocked: '2026-04-15', restockQty: 4 },
  'INV-076': { dailyUsage: 0.3,  history: [0.2,0.4,0.3,0.4,0.3,0.2,0.2], peakDay: 'Thu', lastRestocked: '2026-04-10', restockQty: 2 },
  'INV-077': { dailyUsage: 0.2,  history: [0.1,0.3,0.2,0.3,0.2,0.1,0.1], peakDay: 'Thu', lastRestocked: '2026-04-08', restockQty: 2 },
  'INV-078': { dailyUsage: 0.2,  history: [0.1,0.3,0.2,0.3,0.2,0.1,0.1], peakDay: 'Thu', lastRestocked: '2026-04-08', restockQty: 2 },
  'INV-079': { dailyUsage: 0.3,  history: [0.2,0.4,0.3,0.4,0.3,0.2,0.2], peakDay: 'Thu', lastRestocked: '2026-04-10', restockQty: 2 },
  'INV-080': { dailyUsage: 0.2,  history: [0.1,0.3,0.2,0.3,0.2,0.1,0.1], peakDay: 'Thu', lastRestocked: '2026-04-08', restockQty: 2 },
  'INV-081': { dailyUsage: 0.2,  history: [0.1,0.3,0.2,0.3,0.2,0.1,0.1], peakDay: 'Thu', lastRestocked: '2026-04-08', restockQty: 2 },
  'INV-082': { dailyUsage: 0.2,  history: [0.1,0.3,0.2,0.3,0.2,0.1,0.1], peakDay: 'Thu', lastRestocked: '2026-04-08', restockQty: 2 },
  'INV-083': { dailyUsage: 0.1,  history: [0.05,0.15,0.1,0.15,0.1,0.08,0.08], peakDay: 'Thu', lastRestocked: '2026-04-01', restockQty: 1 },
  'INV-084': { dailyUsage: 0.05, history: [0.03,0.07,0.05,0.07,0.05,0.04,0.04], peakDay: 'Thu', lastRestocked: '2026-04-01', restockQty: 0.5 },
  'INV-085': { dailyUsage: 0.3,  history: [0.2,0.4,0.3,0.4,0.3,0.2,0.2], peakDay: 'Thu', lastRestocked: '2026-04-10', restockQty: 3 },
  'INV-086': { dailyUsage: 0.2,  history: [0.15,0.25,0.2,0.25,0.2,0.15,0.15], peakDay: 'Thu', lastRestocked: '2026-04-15', restockQty: 2 },
  'INV-087': { dailyUsage: 0.5,  history: [0.3,0.7,0.5,0.7,0.5,0.4,0.4], peakDay: 'Thu', lastRestocked: '2026-04-20', restockQty: 8 },
  'INV-088': { dailyUsage: 2,    history: [1.5,2.5,2,3,2,1.5,1.5], peakDay: 'Thu', lastRestocked: '2026-04-25', restockQty: 15 },
  'INV-089': { dailyUsage: 2,    history: [1.5,2.5,2,3,2,1.5,1.5], peakDay: 'Thu', lastRestocked: '2026-04-25', restockQty: 12 },
  'INV-090': { dailyUsage: 0.5,  history: [0.3,0.7,0.5,0.7,0.5,0.4,0.4], peakDay: 'Thu', lastRestocked: '2026-05-20', restockQty: 3 },
  'INV-091': { dailyUsage: 1.5,  history: [1,2,1.5,2.5,1.5,1,1],  peakDay: 'Thu', lastRestocked: '2026-05-10', restockQty: 12 },
  'INV-092': { dailyUsage: 1,    history: [0.8,1.2,1,1.5,1,0.8,0.8], peakDay: 'Thu', lastRestocked: '2026-05-05', restockQty: 8 },
  'INV-093': { dailyUsage: 1.5,  history: [1,2,1.5,2,1.5,1,1],  peakDay: 'Thu', lastRestocked: '2026-05-08', restockQty: 12 },
};

/* ══════════════════════════════════════════════════════
   STOCK TRANSACTIONS — IN (received) & OUT (usage)
   ══════════════════════════════════════════════════════ */
export const stockTransactions = [
  { id: 'TXN-001', date: '2026-05-29', itemId: 'INV-001', item: 'Rice Lalitha',       category: 'Grains & Pulses',  type: 'IN',  qty: 100,  unit: 'kg',  unitCost: 48.00,  totalCost: 4800.00, supplier: 'Lalitha Stores',     usageType: null,          loggedBy: 'Sunita K.',  notes: 'Monthly rice restock' },
  { id: 'TXN-002', date: '2026-05-28', itemId: 'INV-002', item: 'Basmathi Rice',      category: 'Grains & Pulses',  type: 'IN',  qty: 50,   unit: 'kg',  unitCost: 65.00,  totalCost: 3250.00, supplier: 'Lalitha Stores',     usageType: null,          loggedBy: 'Maria S.',   notes: 'Restock for events' },
  { id: 'TXN-003', date: '2026-05-27', itemId: 'INV-063', item: 'Cooking Oil',        category: 'Oils & Fats',      type: 'IN',  qty: 20,   unit: 'L',   unitCost: 155.00, totalCost: 3100.00, supplier: 'Ruchi Oils & Fats',  usageType: null,          loggedBy: 'Sunita K.',  notes: '' },
  { id: 'TXN-004', date: '2026-05-26', itemId: 'INV-016', item: 'Maida',              category: 'Flours & Cereals', type: 'IN',  qty: 30,   unit: 'kg',  unitCost: 40.00,  totalCost: 1200.00, supplier: 'Maha Grains Co.',    usageType: null,          loggedBy: 'Chef Ravi',  notes: 'Baking restock' },
  { id: 'TXN-005', date: '2026-05-25', itemId: 'INV-064', item: 'Ghee Amul',          category: 'Oils & Fats',      type: 'IN',  qty: 5,    unit: 'kg',  unitCost: 540.00, totalCost: 2700.00, supplier: 'Amul Distributors',  usageType: null,          loggedBy: 'Maria S.',   notes: 'Monthly ghee order' },
  { id: 'TXN-006', date: '2026-05-24', itemId: 'INV-003', item: 'Chanadal',           category: 'Grains & Pulses',  type: 'IN',  qty: 20,   unit: 'kg',  unitCost: 95.00,  totalCost: 1900.00, supplier: 'Maha Grains Co.',    usageType: null,          loggedBy: 'Sunita K.',  notes: '' },
  { id: 'TXN-007', date: '2026-05-23', itemId: 'INV-034', item: 'Chicken Masala 100gm', category: 'Spices & Masalas', type: 'IN', qty: 20, unit: 'pcs', unitCost: 35.00, totalCost: 700.00,  supplier: 'MTR Foods Pvt Ltd',  usageType: null,          loggedBy: 'Chef Ravi',  notes: 'Quarterly masala order' },
  { id: 'TXN-008', date: '2026-05-22', itemId: 'INV-083', item: 'Kaju Broken',        category: 'Dry Fruits & Nuts',type: 'IN',  qty: 2,    unit: 'kg',  unitCost: 700.00, totalCost: 1400.00, supplier: 'Krishna Traders',    usageType: null,          loggedBy: 'Maria S.',   notes: 'For desserts' },
  { id: 'TXN-009', date: '2026-05-29', itemId: 'INV-001', item: 'Rice Lalitha',       category: 'Grains & Pulses',  type: 'OUT', qty: 20,   unit: 'kg',  unitCost: 48.00,  totalCost: 960.00,  supplier: null,                 usageType: 'Kitchen Use', loggedBy: 'Chef Ravi',  notes: 'Lunch service' },
  { id: 'TXN-010', date: '2026-05-29', itemId: 'INV-063', item: 'Cooking Oil',        category: 'Oils & Fats',      type: 'OUT', qty: 3,    unit: 'L',   unitCost: 155.00, totalCost: 465.00,  supplier: null,                 usageType: 'Kitchen Use', loggedBy: 'Chef Ravi',  notes: 'Daily cooking' },
  { id: 'TXN-011', date: '2026-05-28', itemId: 'INV-002', item: 'Basmathi Rice',      category: 'Grains & Pulses',  type: 'OUT', qty: 10,   unit: 'kg',  unitCost: 65.00,  totalCost: 650.00,  supplier: null,                 usageType: 'Event',       loggedBy: 'Sunita K.',  notes: 'Biryani for private event' },
  { id: 'TXN-012', date: '2026-05-28', itemId: 'INV-016', item: 'Maida',              category: 'Flours & Cereals', type: 'OUT', qty: 5,    unit: 'kg',  unitCost: 40.00,  totalCost: 200.00,  supplier: null,                 usageType: 'Kitchen Use', loggedBy: 'Chef Ravi',  notes: 'Roti & puri preparation' },
  { id: 'TXN-013', date: '2026-05-27', itemId: 'INV-022', item: 'Suji Ravva',         category: 'Flours & Cereals', type: 'OUT', qty: 3,    unit: 'kg',  unitCost: 48.00,  totalCost: 144.00,  supplier: null,                 usageType: 'Kitchen Use', loggedBy: 'Chef Ravi',  notes: 'Halwa & upma' },
  { id: 'TXN-014', date: '2026-05-27', itemId: 'INV-092', item: 'Salt',               category: 'Packaged Foods',   type: 'OUT', qty: 1,    unit: 'kg',  unitCost: 18.00,  totalCost: 18.00,   supplier: null,                 usageType: 'Daily Consumption', loggedBy: 'Maria S.', notes: '' },
  { id: 'TXN-015', date: '2026-05-26', itemId: 'INV-093', item: 'Sugar',              category: 'Packaged Foods',   type: 'OUT', qty: 1.5,  unit: 'kg',  unitCost: 42.00,  totalCost: 63.00,   supplier: null,                 usageType: 'Kitchen Use', loggedBy: 'Chef Ravi',  notes: 'Tea & desserts' },
  { id: 'TXN-016', date: '2026-05-26', itemId: 'INV-029', item: 'Coriander Powder',   category: 'Spices & Masalas', type: 'OUT', qty: 0.3,  unit: 'kg',  unitCost: 120.00, totalCost: 36.00,   supplier: null,                 usageType: 'Kitchen Use', loggedBy: 'Chef Ravi',  notes: '' },
  { id: 'TXN-017', date: '2026-05-25', itemId: 'INV-025', item: 'Poha',               category: 'Flours & Cereals', type: 'OUT', qty: 2,    unit: 'kg',  unitCost: 55.00,  totalCost: 110.00,  supplier: null,                 usageType: 'Kitchen Use', loggedBy: 'Maria S.',   notes: 'Breakfast service' },
  { id: 'TXN-018', date: '2026-05-24', itemId: 'INV-064', item: 'Ghee Amul',          category: 'Oils & Fats',      type: 'OUT', qty: 0.3,  unit: 'kg',  unitCost: 540.00, totalCost: 162.00,  supplier: null,                 usageType: 'Daily Consumption', loggedBy: 'Chef Ravi', notes: 'Dal tadka' },
  { id: 'TXN-019', date: '2026-05-24', itemId: 'INV-083', item: 'Kaju Broken',        category: 'Dry Fruits & Nuts',type: 'OUT', qty: 0.1,  unit: 'kg',  unitCost: 700.00, totalCost: 70.00,   supplier: null,                 usageType: 'Event',       loggedBy: 'Sunita K.',  notes: 'Kheer garnish' },
  { id: 'TXN-020', date: '2026-05-23', itemId: 'INV-017', item: 'Besan',              category: 'Flours & Cereals', type: 'OUT', qty: 3,    unit: 'kg',  unitCost: 75.00,  totalCost: 225.00,  supplier: null,                 usageType: 'Kitchen Use', loggedBy: 'Chef Ravi',  notes: 'Pakoda & batter' },
];

/* ══════════════════════════════════════════════════════
   getEnrichedItems — merges inventoryItems + itemUsageData
   ══════════════════════════════════════════════════════ */
export const getUrgencyType = (daysRemaining) => {
  if (daysRemaining <= 3)  return 'critical';
  if (daysRemaining <= 7)  return 'high';
  if (daysRemaining <= 14) return 'medium';
  return 'low';
};

export const getUrgencyLabel = (urgency, daysRemaining, currentStock) => {
  if (currentStock === 0)     return 'Out of Stock';
  if (urgency === 'critical') return `Critical — ${daysRemaining}d left`;
  if (urgency === 'high')     return `High — ${daysRemaining}d left`;
  if (urgency === 'medium')   return `Medium — ${daysRemaining}d left`;
  return 'Healthy';
};

export const getEnrichedItems = () =>
  inventoryItems.map((item) => {
    const usage         = itemUsageData[item.id] || {};
    const dailyUsage    = usage.dailyUsage   || 0;
    const history       = usage.history      || [0, 0, 0, 0, 0, 0, 0];
    const peakDay       = usage.peakDay      || 'N/A';
    const lastRestocked = usage.lastRestocked|| 'N/A';
    const restockQty    = usage.restockQty   || 0;

    const daysRemaining = dailyUsage > 0 ? Math.floor(item.currentStock / dailyUsage) : 999;
    const weeklyUsage   = +(dailyUsage * 7).toFixed(2);
    const monthlyUsage  = +(dailyUsage * 30).toFixed(2);
    const totalConsumed = +(dailyUsage * 30).toFixed(2);
    const stockLeftPct  = Math.min(Math.round((item.currentStock / item.maxStock) * 100), 100);
    const consumedPct   = Math.min(Math.round((totalConsumed / item.maxStock) * 100), 100);
    const totalValue    = +(item.currentStock * item.unitCost).toFixed(2);
    const urgency       = getUrgencyType(daysRemaining);

    return {
      ...item,
      dailyUsage, weeklyUsage, monthlyUsage, totalConsumed,
      history, peakDay, lastRestocked, restockQty,
      daysRemaining, stockLeftPct, consumedPct, totalValue, urgency,
    };
  });

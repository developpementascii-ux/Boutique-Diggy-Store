import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export { supabase, isSupabaseConfigured };

// --- Mappers de conversion React (camelCase) <-> PostgreSQL (snake_case) ---

export const mapSettingsFromDB = (db) => {
  if (!db) return null;
  return {
    shopName: db.shop_name ?? '',
    shopPhone: db.shop_phone ?? '',
    shopAddress: db.shop_address ?? '',
    currency: db.currency ?? 'DT',
    ticketFooter: db.ticket_footer ?? '',
    lowStockThreshold: Number(db.low_stock_threshold ?? 5),
  };
};

export const mapSettingsToDB = (settings) => ({
  id: 'default',
  shop_name: settings.shopName,
  shop_phone: settings.shopPhone,
  shop_address: settings.shopAddress,
  currency: settings.currency,
  ticket_footer: settings.ticketFooter,
  low_stock_threshold: settings.lowStockThreshold,
  updated_at: new Date().toISOString(),
});

export const mapCategoryFromDB = (db) => ({
  id: db.id,
  label: db.label,
  icon: db.icon,
  color: db.color,
  order: db.order ?? 0,
  description: db.description,
  subCategories: Array.isArray(db.sub_categories) ? db.sub_categories : [],
});

export const mapCategoryToDB = (cat) => ({
  id: cat.id,
  label: cat.label,
  icon: cat.icon,
  color: cat.color,
  order: cat.order ?? 0,
  description: cat.description,
  sub_categories: cat.subCategories || [],
  updated_at: new Date().toISOString(),
});

export const mapProductFromDB = (db) => ({
  id: db.id,
  name: db.name,
  category: db.category,
  subCategory: db.sub_category,
  purchasePrice: Number(db.purchase_price ?? 0),
  sellingPrice: Number(db.selling_price ?? 0),
  stock: Number(db.stock ?? 0),
  minStockAlert: Number(db.min_stock_alert ?? 2),
  unit: db.unit ?? 'pièce',
  barcode: db.barcode ?? '',
  image: db.image ?? '',
  notes: db.notes ?? '',
});

export const mapProductToDB = (p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  sub_category: p.subCategory,
  purchase_price: p.purchasePrice,
  selling_price: p.sellingPrice,
  stock: p.stock,
  min_stock_alert: p.minStockAlert,
  unit: p.unit,
  barcode: p.barcode,
  image: p.image,
  notes: p.notes,
  updated_at: new Date().toISOString(),
});

export const mapClientFromDB = (db) => {
  let extra = {};
  if (db.notes && typeof db.notes === 'string' && db.notes.startsWith('{')) {
    try {
      extra = JSON.parse(db.notes);
    } catch {
      extra = {};
    }
  }

  return {
    id: db.id,
    name: db.name,
    phone: db.phone ?? '',
    email: db.email ?? '',
    notes: extra.notes !== undefined ? extra.notes : (db.notes ?? ''),
    address: extra.address ?? '',
    customDiscountPercent: Number(extra.customDiscountPercent ?? 0),
    loyaltyPoints: Number(extra.loyaltyPoints ?? 0),
    isLoyaltyClient: extra.isLoyaltyClient !== undefined ? Boolean(extra.isLoyaltyClient) : true,
    debt: Number(db.debt ?? 0),
    totalDebt: Number(db.debt ?? 0),
    totalPurchases: Number(db.total_purchases ?? 0),
    createdAt: db.created_at,
    history: Array.isArray(extra.history) ? extra.history : [],
  };
};

export const mapClientToDB = (c) => {
  const metaObj = {
    notes: c.notes || '',
    address: c.address || '',
    customDiscountPercent: c.customDiscountPercent || 0,
    loyaltyPoints: c.loyaltyPoints || 0,
    isLoyaltyClient: c.isLoyaltyClient !== undefined ? c.isLoyaltyClient : true,
    history: c.history || [],
  };

  return {
    id: c.id,
    name: c.name,
    phone: c.phone || '',
    email: c.email || '',
    notes: JSON.stringify(metaObj),
    debt: c.totalDebt !== undefined ? c.totalDebt : (c.debt ?? 0),
    total_purchases: c.totalPurchases ?? 0,
    updated_at: new Date().toISOString(),
  };
};

export const mapRepairFromDB = (db) => {
  let extra = {};
  if (db.notes && typeof db.notes === 'string' && db.notes.startsWith('{')) {
    try {
      extra = JSON.parse(db.notes);
    } catch {
      extra = {};
    }
  }

  const totalPrice = Number(db.final_cost || db.estimated_cost || 0);
  const advancePaid = Number(db.deposit || 0);
  const remainingDue = extra.remainingDue !== undefined
    ? Number(extra.remainingDue)
    : Math.max(0, totalPrice - advancePaid);

  const issueText = db.problem_description || extra.issueDescription || extra.problemDescription || '';

  return {
    id: db.id,
    ticketNumber: db.ticket_number,
    clientName: db.client_name,
    clientPhone: db.client_phone,
    clientId: db.client_id,
    deviceModel: db.device_model,
    devicePassword: db.device_password,
    problemDescription: issueText,
    issueDescription: issueText,
    pieceUsedId: extra.pieceUsedId || '',
    pieceName: extra.pieceName || '',
    deductStock: extra.deductStock !== undefined ? extra.deductStock : true,
    expectedDate: extra.expectedDate || '',
    notes: extra.notes !== undefined ? extra.notes : (db.notes && !db.notes.startsWith('{') ? db.notes : ''),
    deposit: advancePaid,
    advancePaid: advancePaid,
    initialAdvance: extra.initialAdvance !== undefined ? Number(extra.initialAdvance) : advancePaid,
    remainingPaid: extra.remainingPaid !== undefined ? Number(extra.remainingPaid) : 0,
    remainingDue: remainingDue,
    pieceCost: extra.pieceCost !== undefined ? Number(extra.pieceCost) : 0,
    laborCost: extra.laborCost !== undefined ? Number(extra.laborCost) : 0,
    totalPrice: totalPrice,
    estimatedCost: Number(db.estimated_cost ?? totalPrice),
    finalCost: totalPrice,
    priority: extra.priority || 'normal',
    status: db.status || 'received',
    partsUsed: Array.isArray(db.parts_used) ? db.parts_used : [],
    createdAt: db.created_at,
    completedAt: db.completed_at,
    deliveredAt: db.delivered_at,
  };
};

export const mapRepairToDB = (r) => {
  const issueText = r.issueDescription || r.problemDescription || '';
  const metaObj = {
    notes: r.notes || '',
    pieceCost: r.pieceCost || 0,
    laborCost: r.laborCost || 0,
    initialAdvance: r.initialAdvance || 0,
    remainingPaid: r.remainingPaid || 0,
    remainingDue: r.remainingDue || 0,
    priority: r.priority || 'normal',
    pieceUsedId: r.pieceUsedId || '',
    pieceName: r.pieceName || '',
    deductStock: r.deductStock !== undefined ? r.deductStock : true,
    expectedDate: r.expectedDate || '',
    issueDescription: issueText,
  };

  const totalPrice = Number(r.totalPrice || r.finalCost || r.estimatedCost || 0);
  const advancePaid = Number(r.advancePaid || r.deposit || 0);

  return {
    id: r.id,
    ticket_number: r.ticketNumber,
    client_name: r.clientName,
    client_phone: r.clientPhone,
    client_id: r.clientId,
    device_model: r.deviceModel,
    device_password: r.devicePassword,
    problem_description: issueText,
    notes: JSON.stringify(metaObj),
    deposit: advancePaid,
    estimated_cost: totalPrice,
    final_cost: totalPrice,
    status: r.status,
    parts_used: r.partsUsed || [],
    created_at: r.createdAt || new Date().toISOString(),
    completed_at: r.completedAt,
    delivered_at: r.deliveredAt,
    updated_at: new Date().toISOString(),
  };
};

export const mapSaleFromDB = (db) => {
  const items = Array.isArray(db.items) ? db.items : [];
  const totalAmount = Number(db.total ?? 0);
  const totalCost = items.reduce(
    (sum, it) => sum + Number(it.costPrice || 0) * Number(it.quantity || 1),
    0
  );
  const totalProfit = totalAmount - totalCost;
  const paidAmount = Number(db.paid_amount ?? db.total ?? 0);
  const remainingCredit = Number(db.remaining_debt ?? 0);

  return {
    id: db.id,
    invoiceNumber: db.ticket_number,
    ticketNumber: db.ticket_number,
    clientName: db.client_name,
    clientPhone: db.client_phone,
    clientId: db.client_id,
    items,
    initialAmount: Number(db.subtotal ?? db.total ?? 0),
    subtotal: Number(db.subtotal ?? 0),
    discount: Number(db.discount ?? 0),
    totalAmount,
    total: totalAmount,
    amountPaid: paidAmount,
    paidAmount,
    cashGiven: paidAmount,
    changeReturned: 0,
    remainingCredit,
    remainingDebt: remainingCredit,
    paymentType: db.payment_method ?? 'cash',
    paymentMethod: db.payment_method ?? 'cash',
    cashier: db.cashier,
    sessionId: db.session_id,
    date: db.date || db.created_at,
    totalCost,
    totalProfit,
    status: remainingCredit === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
    notes: db.notes || '',
  };
};

export const mapSaleToDB = (s) => ({
  id: s.id,
  ticket_number: s.invoiceNumber || s.ticketNumber,
  client_name: s.clientName,
  client_phone: s.clientPhone,
  client_id: s.clientId,
  items: s.items || [],
  subtotal: s.subtotal || s.initialAmount || s.totalAmount || s.total || 0,
  discount: s.discount || 0,
  total: s.totalAmount !== undefined ? s.totalAmount : (s.total ?? 0),
  paid_amount: s.amountPaid !== undefined ? s.amountPaid : (s.paidAmount ?? (s.totalAmount || s.total || 0)),
  remaining_debt: s.remainingCredit !== undefined ? s.remainingCredit : (s.remainingDebt ?? 0),
  payment_method: s.paymentType || s.paymentMethod || 'cash',
  cashier: s.cashier || '',
  session_id: s.sessionId || '',
  date: s.date || new Date().toISOString(),
});

export const mapExpenseFromDB = (db) => ({
  id: db.id,
  title: db.description,
  description: db.description,
  category: db.category,
  amount: Number(db.amount ?? 0),
  paymentMethod: db.payment_method ?? 'cash',
  receiptNumber: db.receipt_number,
  sessionId: db.session_id,
  notes: db.notes ?? '',
  date: db.date || db.created_at,
});

export const mapExpenseToDB = (e) => ({
  id: e.id,
  category: e.category || 'other',
  description: e.title || e.description || '',
  amount: Number(e.amount) || 0,
  payment_method: e.paymentMethod || 'cash',
  receipt_number: e.receiptNumber || '',
  session_id: e.sessionId || '',
  notes: e.notes || '',
  date: e.date || new Date().toISOString(),
});

export const mapCashSessionFromDB = (db) => ({
  id: db.id,
  sessionNumber: db.session_number,
  date: db.opened_at ? db.opened_at.split('T')[0] : new Date().toISOString().split('T')[0],
  openedAt: db.opened_at,
  closedAt: db.closed_at,
  openedBy: db.opened_by,
  closedBy: db.closed_by,
  openingCash: Number(db.opening_amount ?? 0),
  openingAmount: Number(db.opening_amount ?? 0),
  theoreticalCash: Number(db.expected_cash ?? 0),
  expectedCash: Number(db.expected_cash ?? 0),
  countedCash: Number(db.actual_cash ?? 0),
  actualCash: Number(db.actual_cash ?? 0),
  discrepancy: Number(db.difference ?? 0),
  difference: Number(db.difference ?? 0),
  notes: db.notes ?? '',
  status: db.status,
  isClosed: db.status === 'closed' || Boolean(db.closed_at),
  cashSales: Number(db.total_sales ?? 0),
  totalSales: Number(db.total_sales ?? 0),
  cashExpenses: Number(db.total_expenses ?? 0),
  totalExpenses: Number(db.total_expenses ?? 0),
  salesCount: Number(db.sales_count ?? 0),
});

export const mapCashSessionToDB = (cs) => ({
  id: cs.id,
  session_number: cs.sessionNumber || cs.date || `SESS-${cs.id}`,
  opened_at: cs.openedAt || new Date().toISOString(),
  closed_at: cs.closedAt,
  opened_by: cs.openedBy || '',
  closed_by: cs.closedBy || '',
  opening_amount: cs.openingCash !== undefined ? cs.openingCash : (cs.openingAmount ?? 0),
  expected_cash: cs.theoreticalCash !== undefined ? cs.theoreticalCash : (cs.expectedCash ?? 0),
  actual_cash: cs.countedCash !== undefined ? cs.countedCash : (cs.actualCash ?? 0),
  difference: cs.discrepancy !== undefined ? cs.discrepancy : (cs.difference ?? 0),
  notes: cs.notes || '',
  status: cs.isClosed ? 'closed' : (cs.status || 'open'),
  total_sales: cs.cashSales !== undefined ? cs.cashSales : (cs.totalSales ?? 0),
  total_expenses: cs.cashExpenses !== undefined ? cs.cashExpenses : (cs.totalExpenses ?? 0),
  sales_count: cs.salesCount ?? 0,
});

export const mapPurchaseOrderFromDB = (db) => {
  let extra = {};
  if (db.notes && typeof db.notes === 'string' && db.notes.startsWith('{')) {
    try {
      extra = JSON.parse(db.notes);
    } catch {
      extra = {};
    }
  }

  const items = Array.isArray(db.items) ? db.items : [];
  const firstItem = items[0] || {};

  return {
    id: db.id,
    type: extra.type || 'stock_refill',
    title: extra.title || firstItem.title || db.order_number || 'Article',
    category: extra.category || '',
    subCategory: extra.subCategory || '',
    quantity: extra.quantity !== undefined ? Number(extra.quantity) : (Number(firstItem.quantity) || 1),
    estimatedCost: Number(db.total_amount ?? extra.estimatedCost ?? 0),
    priority: extra.priority || 'normal',
    status: db.status || 'pending',
    supplier: db.supplier_name || extra.supplier || '',
    supplierName: db.supplier_name,
    supplierPhone: db.supplier_phone,
    notes: extra.notes !== undefined ? extra.notes : db.notes,
    clientName: extra.clientName || '',
    clientPhone: extra.clientPhone || '',
    clientDeposit: Number(extra.clientDeposit || 0),
    linkedProductId: extra.linkedProductId || '',
    autoRestock: extra.autoRestock !== undefined ? Boolean(extra.autoRestock) : true,
    createdAt: db.date || db.created_at,
    completedAt: extra.completedAt || db.received_date || null,
  };
};

export const mapPurchaseOrderToDB = (po) => {
  const metaObj = {
    type: po.type || 'stock_refill',
    title: po.title || '',
    category: po.category || '',
    subCategory: po.subCategory || '',
    quantity: po.quantity || 1,
    estimatedCost: po.estimatedCost || 0,
    priority: po.priority || 'normal',
    supplier: po.supplier || '',
    notes: po.notes || '',
    clientName: po.clientName || '',
    clientPhone: po.clientPhone || '',
    clientDeposit: po.clientDeposit || 0,
    linkedProductId: po.linkedProductId || '',
    autoRestock: po.autoRestock !== undefined ? po.autoRestock : true,
    completedAt: po.completedAt,
  };

  return {
    id: po.id,
    order_number: po.id,
    supplier_name: po.supplier || po.supplierName || '',
    supplier_phone: po.supplierPhone || '',
    date: po.createdAt || po.date || new Date().toISOString(),
    expected_delivery_date: po.expectedDeliveryDate || null,
    received_date: po.completedAt || po.receivedDate || null,
    items: [{ title: po.title, quantity: po.quantity, cost: po.estimatedCost }],
    total_amount: Number(po.estimatedCost ?? po.totalAmount ?? 0),
    status: po.status || 'pending',
    notes: JSON.stringify(metaObj),
    updated_at: new Date().toISOString(),
  };
};

export const mapUserFromDB = (db) => ({
  id: db.id,
  username: db.username,
  name: db.name,
  role: db.role || 'user',
  pinCode: db.pin_code || '0000',
  avatar: db.avatar || 'User',
  createdAt: db.created_at,
});

export const mapUserToDB = (u) => ({
  id: u.id,
  username: u.username,
  name: u.name,
  role: u.role || 'user',
  pin_code: u.pinCode || '0000',
  avatar: u.avatar || 'User',
  created_at: u.createdAt || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// --- Service Principal Supabase ---

export const supabaseService = {
  isAvailable() {
    return isSupabaseConfigured && !!supabase;
  },

  async testConnection() {
    if (!this.isAvailable()) return { success: false, message: 'Supabase non configuré (.env)' };
    try {
      const { error } = await supabase.from('settings').select('id').limit(1);
      if (error) throw error;
      return { success: true, message: 'Connecté à PostgreSQL Supabase avec succès !' };
    } catch (err) {
      return { success: false, message: err.message || 'Erreur de connexion à Supabase' };
    }
  },

  async fetchAll() {
    if (!this.isAvailable()) return null;

    try {
      const [
        settingsRes,
        categoriesRes,
        productsRes,
        clientsRes,
        repairsRes,
        salesRes,
        expensesRes,
        cashSessionsRes,
        purchaseOrdersRes,
        usersRes,
      ] = await Promise.all([
        supabase.from('settings').select('*').single(),
        supabase.from('categories').select('*').order('order', { ascending: true }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('name', { ascending: true }),
        supabase.from('repairs').select('*').order('created_at', { ascending: false }),
        supabase.from('sales').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('cash_sessions').select('*').order('opened_at', { ascending: false }),
        supabase.from('purchase_orders').select('*').order('date', { ascending: false }),
        supabase.from('app_users').select('*').order('created_at', { ascending: true }),
      ]);

      return {
        settings: settingsRes.data ? mapSettingsFromDB(settingsRes.data) : null,
        categories: categoriesRes.data ? categoriesRes.data.map(mapCategoryFromDB) : null,
        products: productsRes.data ? productsRes.data.map(mapProductFromDB) : null,
        clients: clientsRes.data ? clientsRes.data.map(mapClientFromDB) : null,
        repairs: repairsRes.data ? repairsRes.data.map(mapRepairFromDB) : null,
        sales: salesRes.data ? salesRes.data.map(mapSaleFromDB) : null,
        expenses: expensesRes.data ? expensesRes.data.map(mapExpenseFromDB) : null,
        cashSessions: cashSessionsRes.data ? cashSessionsRes.data.map(mapCashSessionFromDB) : null,
        purchaseOrders: purchaseOrdersRes.data ? purchaseOrdersRes.data.map(mapPurchaseOrderFromDB) : null,
        users: usersRes.data ? usersRes.data.map(mapUserFromDB) : null,
      };
    } catch (err) {
      console.error('Erreur chargement Supabase:', err);
      return null;
    }
  },

  async upsertUser(user) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('app_users').upsert(mapUserToDB(user));
    } catch (err) {
      console.error('Supabase upsertUser error:', err);
    }
  },

  async deleteUser(id) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('app_users').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteUser error:', err);
    }
  },

  async upsertSettings(settings) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('settings').upsert(mapSettingsToDB(settings));
    } catch (err) {
      console.error('Supabase upsertSettings error:', err);
    }
  },

  async upsertProduct(product) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('products').upsert(mapProductToDB(product));
    } catch (err) {
      console.error('Supabase upsertProduct error:', err);
    }
  },

  async deleteProduct(id) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteProduct error:', err);
    }
  },

  async upsertCategory(category) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('categories').upsert(mapCategoryToDB(category));
    } catch (err) {
      console.error('Supabase upsertCategory error:', err);
    }
  },

  async deleteCategory(id) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('categories').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteCategory error:', err);
    }
  },

  async upsertClient(client) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('clients').upsert(mapClientToDB(client));
    } catch (err) {
      console.error('Supabase upsertClient error:', err);
    }
  },

  async deleteClient(id) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('clients').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteClient error:', err);
    }
  },

  async upsertRepair(repair) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('repairs').upsert(mapRepairToDB(repair));
    } catch (err) {
      console.error('Supabase upsertRepair error:', err);
    }
  },

  async deleteRepair(id) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('repairs').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteRepair error:', err);
    }
  },

  async insertSale(sale) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('sales').upsert(mapSaleToDB(sale));
    } catch (err) {
      console.error('Supabase insertSale error:', err);
    }
  },

  async deleteSale(id) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('sales').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteSale error:', err);
    }
  },

  async insertExpense(expense) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('expenses').upsert(mapExpenseToDB(expense));
    } catch (err) {
      console.error('Supabase insertExpense error:', err);
    }
  },

  async deleteExpense(id) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('expenses').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteExpense error:', err);
    }
  },

  async upsertCashSession(session) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('cash_sessions').upsert(mapCashSessionToDB(session));
    } catch (err) {
      console.error('Supabase upsertCashSession error:', err);
    }
  },

  async deleteCashSession(id) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('cash_sessions').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteCashSession error:', err);
    }
  },

  async upsertPurchaseOrder(order) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('purchase_orders').upsert(mapPurchaseOrderToDB(order));
    } catch (err) {
      console.error('Supabase upsertPurchaseOrder error:', err);
    }
  },

  async deletePurchaseOrder(id) {
    if (!this.isAvailable()) return;
    try {
      await supabase.from('purchase_orders').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deletePurchaseOrder error:', err);
    }
  },

  // Migration de toutes les données locales vers Supabase
  async migrateLocalDataToSupabase(localState) {
    if (!this.isAvailable()) {
      throw new Error('Supabase n\'est pas encore configuré dans le fichier .env');
    }

    const {
      settings,
      categories,
      products,
      clients,
      repairs,
      sales,
      expenses,
      cashSessions,
      purchaseOrders,
      users,
    } = localState;

    const results = {};

    if (settings) {
      const { error } = await supabase.from('settings').upsert(mapSettingsToDB(settings));
      if (error) throw error;
      results.settings = 1;
    }

    if (users?.length) {
      const { error } = await supabase.from('app_users').upsert(users.map(mapUserToDB));
      if (error) throw error;
      results.users = users.length;
    }

    if (categories?.length) {
      const { error } = await supabase.from('categories').upsert(categories.map(mapCategoryToDB));
      if (error) throw error;
      results.categories = categories.length;
    }

    if (products?.length) {
      const { error } = await supabase.from('products').upsert(products.map(mapProductToDB));
      if (error) throw error;
      results.products = products.length;
    }

    if (clients?.length) {
      const { error } = await supabase.from('clients').upsert(clients.map(mapClientToDB));
      if (error) throw error;
      results.clients = clients.length;
    }

    if (repairs?.length) {
      const { error } = await supabase.from('repairs').upsert(repairs.map(mapRepairToDB));
      if (error) throw error;
      results.repairs = repairs.length;
    }

    if (sales?.length) {
      const { error } = await supabase.from('sales').upsert(sales.map(mapSaleToDB));
      if (error) throw error;
      results.sales = sales.length;
    }

    if (expenses?.length) {
      const { error } = await supabase.from('expenses').upsert(expenses.map(mapExpenseToDB));
      if (error) throw error;
      results.expenses = expenses.length;
    }

    if (cashSessions?.length) {
      const { error } = await supabase.from('cash_sessions').upsert(cashSessions.map(mapCashSessionToDB));
      if (error) throw error;
      results.cashSessions = cashSessions.length;
    }

    if (purchaseOrders?.length) {
      const { error } = await supabase.from('purchase_orders').upsert(purchaseOrders.map(mapPurchaseOrderToDB));
      if (error) throw error;
      results.purchaseOrders = purchaseOrders.length;
    }

    return results;
  },
};

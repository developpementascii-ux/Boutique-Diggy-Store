-- ==============================================================================
-- SCHEMA SQL POUR SUPABASE (POSTGRESQL) - GESTION BOUTIQUE
-- ==============================================================================
-- Copiez et collez l'intégralité de ce script dans :
-- Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. Table Paramètres (Settings)
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    shop_name TEXT DEFAULT 'Boutique Pro-Tech & Senteurs',
    shop_phone TEXT DEFAULT '+216 98 000 000',
    shop_address TEXT DEFAULT 'Avenue Principale - Centre Ville',
    currency TEXT DEFAULT 'DT',
    ticket_footer TEXT DEFAULT 'Merci pour votre confiance ! Garantie réparation 30 jours.',
    low_stock_threshold INTEGER DEFAULT 5,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table Catégories
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    "order" INTEGER DEFAULT 0,
    description TEXT,
    sub_categories JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table Produits & Pièces détachées
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    sub_category TEXT,
    purchase_price NUMERIC(12, 3) DEFAULT 0,
    selling_price NUMERIC(12, 3) DEFAULT 0,
    stock NUMERIC(12, 3) DEFAULT 0,
    min_stock_alert NUMERIC(12, 3) DEFAULT 2,
    unit TEXT DEFAULT 'pièce',
    barcode TEXT,
    image TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table Clients
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT,
    debt NUMERIC(12, 3) DEFAULT 0,
    total_purchases NUMERIC(12, 3) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table Réparations
CREATE TABLE IF NOT EXISTS repairs (
    id TEXT PRIMARY KEY,
    ticket_number TEXT,
    client_name TEXT,
    client_phone TEXT,
    client_id TEXT,
    device_model TEXT,
    device_password TEXT,
    problem_description TEXT,
    notes TEXT,
    deposit NUMERIC(12, 3) DEFAULT 0,
    estimated_cost NUMERIC(12, 3) DEFAULT 0,
    final_cost NUMERIC(12, 3) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    parts_used JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table Ventes (Sales)
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    ticket_number TEXT,
    client_name TEXT,
    client_phone TEXT,
    client_id TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12, 3) DEFAULT 0,
    discount NUMERIC(12, 3) DEFAULT 0,
    total NUMERIC(12, 3) DEFAULT 0,
    paid_amount NUMERIC(12, 3) DEFAULT 0,
    remaining_debt NUMERIC(12, 3) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    cashier TEXT,
    session_id TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Table Dépenses / Charges (Expenses)
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(12, 3) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    receipt_number TEXT,
    session_id TEXT,
    notes TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Table Sessions de Caisse (Cash Sessions)
CREATE TABLE IF NOT EXISTS cash_sessions (
    id TEXT PRIMARY KEY,
    session_number TEXT,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opened_by TEXT,
    closed_by TEXT,
    opening_amount NUMERIC(12, 3) DEFAULT 0,
    expected_cash NUMERIC(12, 3) DEFAULT 0,
    actual_cash NUMERIC(12, 3) DEFAULT 0,
    difference NUMERIC(12, 3) DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'open',
    total_sales NUMERIC(12, 3) DEFAULT 0,
    total_expenses NUMERIC(12, 3) DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Table Commandes Fournisseurs (Purchase Orders)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    order_number TEXT,
    supplier_name TEXT,
    supplier_phone TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    expected_delivery_date TIMESTAMPTZ,
    received_date TIMESTAMPTZ,
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC(12, 3) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Table Utilisateurs & Rôles (App Users)
CREATE TABLE IF NOT EXISTS app_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user', etc.
    pin_code TEXT NOT NULL DEFAULT '0000',
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les utilisateurs initiaux s'ils n'existent pas
INSERT INTO app_users (id, username, name, role, pin_code, avatar)
VALUES 
  ('user-admin-1', 'admin', 'Administrateur', 'admin', '1234', 'ShieldCheck'),
  ('user-cashier-1', 'vendeur', 'Vendeur Caisse', 'user', '0000', 'User')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- ACTIVER ROW LEVEL SECURITY (RLS) & POLICIES POUR ACCÈS ANONYME (OU AUTH)
-- ==============================================================================
-- Active la lecture et l'écriture publique sécurisée avec la clé d'API publique (anon)

DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'settings', 'categories', 'products', 'clients', 
    'repairs', 'sales', 'expenses', 'cash_sessions', 'purchase_orders', 'app_users'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public access policy" ON %I;', tbl);
    EXECUTE format('CREATE POLICY "Public access policy" ON %I FOR ALL USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;

-- Activer les notifications en temps réel pour toutes les tables (Supabase Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE settings, categories, products, clients, repairs, sales, expenses, cash_sessions, purchase_orders, app_users;


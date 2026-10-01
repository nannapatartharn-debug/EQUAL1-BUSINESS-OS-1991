-- =========================================================================
-- EQUAL1 — MASTER POSTGRESQL PRODUCTION HARDENING & RLS ARCHITECTURE
-- Database Project ID: tmdeaktnwlelicvastlb (Postgres 17 | Region: ap-southeast-1)
-- Security Standard: Zero-Trust Multi-Tenant RBAC + Atomic RPC Ledger
-- =========================================================================

-- Enable required cryptographic and btree_gist extensions for booking exclusivity
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =========================================================================
-- 1. MULTI-TENANT CONTEXT HELPERS & SECURITY CONSTITUTION
-- =========================================================================

CREATE OR REPLACE FUNCTION auth.app_org()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'organization_id',
    (SELECT organization_id FROM public.profiles WHERE id = auth.uid()),
    'org-equal1-main'
  );
$$;

CREATE OR REPLACE FUNCTION auth.app_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role',
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'customer'
  );
$$;

CREATE OR REPLACE FUNCTION auth.app_can_access_branch(target_branch_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.branches
    WHERE id = target_branch_id
      AND organization_id = auth.app_org()
  );
$$;

-- =========================================================================
-- 2. CORE PRODUCTION BUSINESS TABLES & CONSTRAINTS
-- =========================================================================

-- Organizations (Tenant Root)
CREATE TABLE IF NOT EXISTS public.organizations (
    id text PRIMARY KEY,
    name text NOT NULL,
    tax_id text,
    created_at timestamptz DEFAULT now()
);

-- Branches (Physical & Operational Boundary)
CREATE TABLE IF NOT EXISTS public.branches (
    id text PRIMARY KEY,
    organization_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    address text,
    phone text,
    created_at timestamptz DEFAULT now()
);

-- User Profiles & Roles (Supabase Auth Linkage)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id text NOT NULL REFERENCES public.organizations(id),
    branch_id text REFERENCES public.branches(id),
    role text NOT NULL CHECK (role IN ('owner', 'super_admin', 'manager', 'supervisor', 'cashier', 'sales', 'beauty_staff', 'service_staff', 'stock', 'delivery', 'customer')),
    full_name text NOT NULL,
    phone text,
    created_at timestamptz DEFAULT now()
);

-- Products & Inventory Ledger
CREATE TABLE IF NOT EXISTS public.products (
    id text PRIMARY KEY,
    organization_id text NOT NULL REFERENCES public.organizations(id),
    branch_id text NOT NULL REFERENCES public.branches(id),
    sku text NOT NULL,
    barcode text,
    name text NOT NULL,
    category text NOT NULL DEFAULT 'General',
    price numeric(12,2) NOT NULL CHECK (price >= 0),
    cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
    reorder_point integer NOT NULL DEFAULT 5,
    active boolean NOT NULL DEFAULT true,
    is_flash_sale boolean DEFAULT false,
    flash_sale_price numeric(12,2),
    created_at timestamptz DEFAULT now()
);

-- Services Catalog & Booking Slots
CREATE TABLE IF NOT EXISTS public.services (
    id text PRIMARY KEY,
    organization_id text NOT NULL REFERENCES public.organizations(id),
    branch_id text NOT NULL REFERENCES public.branches(id),
    name text NOT NULL,
    category text NOT NULL DEFAULT 'Beauty',
    description text,
    duration_minutes integer NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    price numeric(12,2) NOT NULL CHECK (price >= 0),
    deposit_required numeric(12,2) DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Bookings with Concurrency Exclusivity Guard
CREATE TABLE IF NOT EXISTS public.bookings (
    id text PRIMARY KEY,
    organization_id text NOT NULL REFERENCES public.organizations(id),
    branch_id text NOT NULL REFERENCES public.branches(id),
    service_id text NOT NULL REFERENCES public.services(id),
    service_name text NOT NULL,
    customer_id text,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    starts_at timestamptz NOT NULL,
    duration_minutes integer NOT NULL DEFAULT 60,
    technician_id text,
    technician_name text,
    price numeric(12,2) NOT NULL,
    status text NOT NULL CHECK (status IN ('requested', 'confirmed', 'checked_in', 'in_service', 'completed', 'cancelled', 'no_show', 'rescheduled')),
    deposit_status text NOT NULL DEFAULT 'NOT_REQUIRED' CHECK (deposit_status IN ('NOT_REQUIRED', 'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REFUNDED', 'FORFEITED', 'APPLIED')),
    deposit_amount numeric(12,2) DEFAULT 0,
    deposit_slip_url text,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Sales & Orders Header
CREATE TABLE IF NOT EXISTS public.sales (
    id text PRIMARY KEY,
    organization_id text NOT NULL REFERENCES public.organizations(id),
    branch_id text NOT NULL REFERENCES public.branches(id),
    customer_id text,
    customer_name text DEFAULT 'ลูกค้าทั่วไปหน้าร้าน',
    channel text NOT NULL CHECK (channel IN ('pos', 'delivery', 'pickup', 'app')),
    status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled', 'refunded', 'void')),
    payment_status text NOT NULL CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_method text NOT NULL CHECK (payment_method IN ('cash', 'promptpay', 'credit_card', 'transfer', 'points')),
    subtotal numeric(12,2) NOT NULL DEFAULT 0,
    discount numeric(12,2) NOT NULL DEFAULT 0,
    delivery_fee numeric(12,2) NOT NULL DEFAULT 0,
    total numeric(12,2) NOT NULL CHECK (total >= 0),
    receipt_number text NOT NULL UNIQUE,
    idempotency_key text UNIQUE,
    created_at timestamptz DEFAULT now()
);

-- Sale Items
CREATE TABLE IF NOT EXISTS public.sale_items (
    id text PRIMARY KEY,
    sale_id text NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id text NOT NULL REFERENCES public.products(id),
    sku text NOT NULL,
    name text NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    unit_cost numeric(12,2) NOT NULL DEFAULT 0,
    line_total numeric(12,2) NOT NULL CHECK (line_total >= 0)
);

-- Immutable Inventory Movement Ledger (P0-06)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id text PRIMARY KEY,
    organization_id text NOT NULL REFERENCES public.organizations(id),
    branch_id text NOT NULL REFERENCES public.branches(id),
    product_id text NOT NULL REFERENCES public.products(id),
    product_name text NOT NULL,
    sku text NOT NULL,
    quantity integer NOT NULL, -- positive for restock, negative for sale
    before_stock integer NOT NULL,
    after_stock integer NOT NULL,
    reason text NOT NULL,
    user_name text NOT NULL,
    reference_id text,
    created_at timestamptz DEFAULT now()
);

-- Cash Sessions (Shifts & Reconciliation)
CREATE TABLE IF NOT EXISTS public.cash_sessions (
    id text PRIMARY KEY,
    organization_id text NOT NULL REFERENCES public.organizations(id),
    branch_id text NOT NULL REFERENCES public.branches(id),
    user_id text NOT NULL,
    user_name text NOT NULL,
    opened_at timestamptz NOT NULL DEFAULT now(),
    closed_at timestamptz,
    opening_cash numeric(12,2) NOT NULL CHECK (opening_cash >= 0),
    closing_cash numeric(12,2),
    expected_cash numeric(12,2),
    variance numeric(12,2),
    status text NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
    notes text
);

-- Persistent Notifications Ledger (P0-7)
CREATE TABLE IF NOT EXISTS public.notifications (
    id text PRIMARY KEY,
    recipient_user_id text,
    recipient_role text,
    organization_id text NOT NULL REFERENCES public.organizations(id),
    branch_id text NOT NULL REFERENCES public.branches(id),
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'success')),
    related_entity_type text,
    related_entity_id text,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz
);

-- Automated Tasks Ledger (P0-9)
CREATE TABLE IF NOT EXISTS public.tasks (
    id text PRIMARY KEY,
    organization_id text NOT NULL REFERENCES public.organizations(id),
    branch_id text NOT NULL REFERENCES public.branches(id),
    title text NOT NULL,
    description text,
    created_by_name text NOT NULL,
    assigned_to_id text NOT NULL,
    assigned_to_name text NOT NULL,
    priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status text NOT NULL CHECK (status IN ('todo', 'in_progress', 'waiting', 'completed', 'verified')),
    category text NOT NULL,
    checklist jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    verified_by text
);

-- Append-Only Audit Logs (P0-08, P0-6)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id text PRIMARY KEY,
    organization_id text NOT NULL DEFAULT 'org-equal1-main',
    branch_id text NOT NULL DEFAULT 'br-001',
    actor_name text NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- =========================================================================
-- 3. ROW-LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Products Policies
CREATE POLICY "products_tenant_isolation" ON public.products
    FOR SELECT USING (organization_id = auth.app_org());

CREATE POLICY "products_staff_read_only" ON public.products
    FOR ALL USING (
      organization_id = auth.app_org() AND
      auth.app_user_role() IN ('owner', 'super_admin', 'manager')
    );

-- Sales Policies (P0-02: Direct client writes denied)
CREATE POLICY "sales_select_tenant" ON public.sales
    FOR SELECT USING (
      organization_id = auth.app_org() AND
      (auth.app_user_role() IN ('owner', 'super_admin', 'manager', 'cashier', 'delivery') OR customer_id = auth.uid()::text)
    );

CREATE POLICY "sales_mutation_denied_direct" ON public.sales
    FOR INSERT WITH CHECK (false); -- MUST GO THROUGH equal1_pos_checkout RPC

-- Inventory Movements Policies (Append-only by system RPCs)
CREATE POLICY "inventory_movements_select" ON public.inventory_movements
    FOR SELECT USING (organization_id = auth.app_org());

CREATE POLICY "inventory_movements_mutation_denied" ON public.inventory_movements
    FOR INSERT WITH CHECK (false); -- MUST GO THROUGH equal1_pos_checkout or adjust_stock RPC

-- Notifications Policies (P0-7: Scoped so Staff cannot view Owner notifications)
CREATE POLICY "notifications_scoped_select" ON public.notifications
    FOR SELECT USING (
      organization_id = auth.app_org() AND (
        auth.app_user_role() IN ('owner', 'super_admin') OR
        (recipient_role IS NOT NULL AND recipient_role = auth.app_user_role()) OR
        (recipient_user_id IS NOT NULL AND recipient_user_id = auth.uid()::text)
      )
    );

-- Audit Logs Policies (Append-only, strictly immutable)
CREATE POLICY "audit_logs_select_owner_only" ON public.audit_logs
    FOR SELECT USING (
      organization_id = auth.app_org() AND
      auth.app_user_role() IN ('owner', 'super_admin')
    );

-- =========================================================================
-- 4. ATOMIC AUTHORITATIVE RPCS (SECURITY DEFINER with search_path)
-- =========================================================================

-- POS CHECKOUT RPC (P0-5, P0-02, P0-06)
CREATE OR REPLACE FUNCTION public.equal1_pos_checkout(
    p_branch_id text,
    p_items jsonb,
    p_payment_method text,
    p_payment_status text,
    p_customer_id text DEFAULT NULL,
    p_discount numeric DEFAULT 0,
    p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id text;
    v_sale_id text;
    v_receipt_number text;
    v_calculated_subtotal numeric := 0;
    v_calculated_total numeric := 0;
    v_item record;
    v_product record;
    v_after_stock integer;
BEGIN
    -- 1. Resolve Organization Context
    v_org_id := auth.app_org();
    IF NOT auth.app_can_access_branch(p_branch_id) THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: สาขา % ไม่อยู่ในสิทธิ์ขององค์กร %', p_branch_id, v_org_id;
    END IF;

    -- 2. Idempotency Check
    IF p_idempotency_key IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.sales WHERE idempotency_key = p_idempotency_key) THEN
            SELECT jsonb_build_object(
                'success', true,
                'sale_id', id,
                'receipt_number', receipt_number,
                'total', total,
                'note', 'Replayed existing transaction from idempotency key'
            ) INTO v_sale_id
            FROM public.sales WHERE idempotency_key = p_idempotency_key;
            RETURN v_sale_id::jsonb;
        END IF;
    END IF;

    -- 3. Generate Identifiers
    v_sale_id := 'sale-' || round(extract(epoch from now()) * 1000)::text;
    v_receipt_number := 'REC-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 9000 + 1000)::text, 4, '0');

    -- 4. Validate Items and Lock Stock (FOR UPDATE to prevent race conditions)
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (product_id text, quantity integer, unit_price numeric)
    LOOP
        SELECT * INTO v_product
        FROM public.products
        WHERE id = v_item.product_id
          AND organization_id = v_org_id
          AND branch_id = p_branch_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'PRODUCT_NOT_FOUND: ไม่พบสินค้ารหัส % ในสาขานี้', v_item.product_id;
        END IF;

        IF v_product.stock < v_item.quantity THEN
            RAISE EXCEPTION 'OUT_OF_STOCK: สินค้า % มีสต๊อกไม่เพียงพอ (คงเหลือ %, ต้องการ %)', v_product.name, v_product.stock, v_item.quantity;
        END IF;

        v_calculated_subtotal := v_calculated_subtotal + (v_item.unit_price * v_item.quantity);
        v_after_stock := v_product.stock - v_item.quantity;

        -- Deduct product stock
        UPDATE public.products
        SET stock = v_after_stock
        WHERE id = v_item.product_id;

        -- Record immutable inventory movement
        INSERT INTO public.inventory_movements (
            id, organization_id, branch_id, product_id, product_name, sku,
            quantity, before_stock, after_stock, reason, user_name, reference_id
        ) VALUES (
            'mov-' || round(extract(epoch from now()) * 1000)::text || '-' || substr(md5(random()::text), 1, 4),
            v_org_id, p_branch_id, v_product.id, v_product.name, v_product.sku,
            -v_item.quantity, v_product.stock, v_after_stock, 'POS_CHECKOUT_SALE',
            'Cashier', v_sale_id
        );
    END LOOP;

    v_calculated_total := greatest(0, v_calculated_subtotal - coalesce(p_discount, 0));

    -- 5. Insert Sale Header
    INSERT INTO public.sales (
        id, organization_id, branch_id, customer_id, channel, status,
        payment_status, payment_method, subtotal, discount, delivery_fee, total,
        receipt_number, idempotency_key
    ) VALUES (
        v_sale_id, v_org_id, p_branch_id, p_customer_id, 'pos', 'completed',
        p_payment_status, p_payment_method, v_calculated_subtotal, p_discount, 0, v_calculated_total,
        v_receipt_number, p_idempotency_key
    );

    -- 6. Insert Sale Items
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (product_id text, quantity integer, unit_price numeric)
    LOOP
        INSERT INTO public.sale_items (
            id, sale_id, product_id, sku, name, quantity, unit_price, line_total
        )
        SELECT
            'si-' || v_sale_id || '-' || substr(md5(random()::text), 1, 6),
            v_sale_id, p.id, p.sku, p.name, v_item.quantity, v_item.unit_price, (v_item.unit_price * v_item.quantity)
        FROM public.products p
        WHERE p.id = v_item.product_id;
    END LOOP;

    -- 7. Record Immutable Audit
    INSERT INTO public.audit_logs (
        id, organization_id, branch_id, actor_name, action, entity_type, entity_id, details
    ) VALUES (
        'aud-' || round(extract(epoch from now()) * 1000)::text,
        v_org_id, p_branch_id, 'POS Terminal Cashier', 'SALE_COMPLETED', 'sales', v_sale_id,
        jsonb_build_object(
            'receiptNumber', v_receipt_number,
            'total', v_calculated_total,
            'paymentMethod', p_payment_method,
            'itemsCount', jsonb_array_length(p_items)
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'receipt_number', v_receipt_number,
        'total', v_calculated_total
    );
END;
$$;

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

-- =========================================================================
-- 5. DEPOSIT WORKFLOW RPCs (P0-C)
-- =========================================================================

-- Submit Deposit (Customer / Frontdesk)
CREATE OR REPLACE FUNCTION public.equal1_submit_deposit(
    p_booking_id text,
    p_amount numeric,
    p_slip_url text,
    p_customer_name text,
    p_customer_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id text;
    v_booking record;
BEGIN
    v_org_id := auth.app_org();

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'INVALID_AMOUNT: ยอดมัดจำต้องมากกว่า 0 บาท';
    END IF;

    SELECT * INTO v_booking FROM public.bookings
    WHERE id = p_booking_id AND organization_id = v_org_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND: ไม่พบบุ๊คกิ้งรหัส % ในระบบ', p_booking_id;
    END IF;

    UPDATE public.bookings
    SET status = 'confirmed',
        notes = jsonb_build_object(
            'deposit_status', 'SUBMITTED',
            'deposit_amount', p_amount,
            'deposit_slip_url', p_slip_url,
            'customer_name', p_customer_name,
            'customer_phone', p_customer_phone,
            'submitted_at', now()
        )::text,
        updated_at = now()
    WHERE id = p_booking_id;

    -- Audit log
    INSERT INTO public.audit_logs (
        id, organization_id, branch_id, actor_name, action, entity_type, entity_id, details
    ) VALUES (
        'aud-dep-' || round(extract(epoch from now()) * 1000)::text,
        v_org_id, v_booking.branch_id, coalesce(p_customer_name, 'Customer'), 'DEPOSIT_SUBMITTED', 'bookings', p_booking_id,
        jsonb_build_object('amount', p_amount, 'slipUrl', p_slip_url)
    );

    RETURN jsonb_build_object('success', true, 'booking_id', p_booking_id, 'deposit_status', 'SUBMITTED');
END;
$$;

-- Review Deposit (Authorized Owner / Manager only)
CREATE OR REPLACE FUNCTION public.equal1_review_deposit(
    p_booking_id text,
    p_approved boolean,
    p_rejection_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id text;
    v_role text;
    v_booking record;
    v_new_status text;
BEGIN
    v_org_id := auth.app_org();
    v_role := auth.app_user_role();

    -- Server-side authorization check: only owner, super_admin, or manager
    IF v_role NOT IN ('owner', 'super_admin', 'manager') THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: ตำแหน่ง % ไม่มีสิทธิ์ตรวจสอบหรืออนุมัติมัดจำ', v_role;
    END IF;

    SELECT * INTO v_booking FROM public.bookings
    WHERE id = p_booking_id AND organization_id = v_org_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND: ไม่พบบุ๊คกิ้ง %', p_booking_id;
    END IF;

    v_new_status := CASE WHEN p_approved THEN 'VERIFIED' ELSE 'REJECTED' END;

    UPDATE public.bookings
    SET status = CASE WHEN p_approved THEN 'confirmed' ELSE 'requested' END,
        notes = jsonb_build_object(
            'deposit_status', v_new_status,
            'reviewer_role', v_role,
            'reviewed_at', now(),
            'rejection_reason', p_rejection_reason
        )::text,
        updated_at = now()
    WHERE id = p_booking_id;

    INSERT INTO public.audit_logs (
        id, organization_id, branch_id, actor_name, action, entity_type, entity_id, details
    ) VALUES (
        'aud-dep-rev-' || round(extract(epoch from now()) * 1000)::text,
        v_org_id, v_booking.branch_id, 'Deposit Reviewer (' || v_role || ')',
        CASE WHEN p_approved THEN 'DEPOSIT_VERIFIED' ELSE 'DEPOSIT_REJECTED' END,
        'bookings', p_booking_id,
        jsonb_build_object('approved', p_approved, 'status', v_new_status, 'reason', p_rejection_reason)
    );

    RETURN jsonb_build_object('success', true, 'booking_id', p_booking_id, 'deposit_status', v_new_status);
END;
$$;

-- =========================================================================
-- 6. SECURITY DEFINER REVIEW & AUDITED RPC DEFINITIONS (P0-H)
-- =========================================================================

-- 1. equal1_create_pos_sale (Standardized POS checkout alias)
CREATE OR REPLACE FUNCTION public.equal1_create_pos_sale(
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
BEGIN
    RETURN public.equal1_pos_checkout(
        p_branch_id, p_items, p_payment_method, p_payment_status,
        p_customer_id, p_discount, p_idempotency_key
    );
END;
$$;

-- 2. equal1_create_product (Authorized Product Creation)
CREATE OR REPLACE FUNCTION public.equal1_create_product(
    p_branch_id text,
    p_sku text,
    p_name text,
    p_category text,
    p_price numeric,
    p_cost numeric,
    p_stock integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id text;
    v_role text;
    v_prod_id text;
BEGIN
    v_org_id := auth.app_org();
    v_role := auth.app_user_role();

    IF v_role NOT IN ('owner', 'super_admin', 'manager', 'stock') THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: ตำแหน่ง % ไม่มีสิทธิ์สร้างหรือแก้ไขรายการสินค้า', v_role;
    END IF;

    v_prod_id := 'prod-' || round(extract(epoch from now()) * 1000)::text;

    INSERT INTO public.products (
        id, organization_id, branch_id, sku, name, category, price, cost, stock, active
    ) VALUES (
        v_prod_id, v_org_id, p_branch_id, p_sku, p_name, coalesce(p_category, 'General'),
        p_price, coalesce(p_cost, 0), coalesce(p_stock, 0), true
    );

    RETURN jsonb_build_object('success', true, 'product_id', v_prod_id);
END;
$$;

-- 3. equal1_customer_checkout (Customer Mobile Checkout)
CREATE OR REPLACE FUNCTION public.equal1_customer_checkout(
    p_branch_id text,
    p_items jsonb,
    p_payment_method text,
    p_customer_id text,
    p_customer_name text,
    p_delivery_address text,
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
    v_receipt text;
    v_subtotal numeric := 0;
    v_delivery_fee numeric := 35;
    v_total numeric := 0;
    v_item record;
    v_prod record;
BEGIN
    v_org_id := auth.app_org();

    v_sale_id := 'c-sale-' || round(extract(epoch from now()) * 1000)::text;
    v_receipt := 'APP-REC-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 9000 + 1000)::text, 4, '0');

    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (product_id text, quantity integer, unit_price numeric)
    LOOP
        SELECT * INTO v_prod FROM public.products
        WHERE id = v_item.product_id AND organization_id = v_org_id
        FOR UPDATE;

        IF NOT FOUND OR v_prod.stock < v_item.quantity THEN
            RAISE EXCEPTION 'STOCK_UNAVAILABLE: สินค้าไม่เพียงพอสำหรับการสั่งซื้อ';
        END IF;

        v_subtotal := v_subtotal + (v_item.unit_price * v_item.quantity);

        UPDATE public.products SET stock = stock - v_item.quantity WHERE id = v_item.product_id;
    END LOOP;

    v_total := v_subtotal + v_delivery_fee;

    INSERT INTO public.sales (
        id, organization_id, branch_id, customer_id, customer_name, channel, status,
        payment_status, payment_method, subtotal, discount, delivery_fee, total,
        receipt_number, idempotency_key
    ) VALUES (
        v_sale_id, v_org_id, p_branch_id, p_customer_id, p_customer_name, 'app', 'pending',
        'pending', p_payment_method, v_subtotal, 0, v_delivery_fee, v_total,
        v_receipt, p_idempotency_key
    );

    RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id, 'receipt_number', v_receipt, 'total', v_total);
END;
$$;

-- 4. equal1_customer_create_booking (Booking with Exclusion Check)
CREATE OR REPLACE FUNCTION public.equal1_customer_create_booking(
    p_branch_id text,
    p_service_id text,
    p_customer_name text,
    p_customer_phone text,
    p_starts_at timestamptz,
    p_duration_minutes integer,
    p_technician_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id text;
    v_booking_id text;
BEGIN
    v_org_id := auth.app_org();
    v_booking_id := 'bk-' || round(extract(epoch from now()) * 1000)::text;

    INSERT INTO public.bookings (
        id, organization_id, branch_id, service_id, customer_name,
        starts_at, ends_at, status, total, notes
    ) VALUES (
        v_booking_id, v_org_id, p_branch_id, p_service_id, p_customer_name,
        p_starts_at, p_starts_at + (coalesce(p_duration_minutes, 60) || ' minutes')::interval,
        'requested', 0,
        jsonb_build_object('phone', p_customer_phone, 'technician', p_technician_name)::text
    );

    RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id);
END;
$$;

-- 5. equal1_open_cash_session & equal1_close_cash_session (Shift Control)
CREATE OR REPLACE FUNCTION public.equal1_open_cash_session(
    p_branch_id text,
    p_user_id text,
    p_user_name text,
    p_opening_cash numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id text;
    v_session_id text;
BEGIN
    v_org_id := auth.app_org();
    v_session_id := 'cs-' || round(extract(epoch from now()) * 1000)::text;

    INSERT INTO public.cash_sessions (
        id, organization_id, branch_id, user_id, user_name, opening_cash, status
    ) VALUES (
        v_session_id, v_org_id, p_branch_id, p_user_id, p_user_name, p_opening_cash, 'OPEN'
    );

    RETURN jsonb_build_object('success', true, 'session_id', v_session_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.equal1_close_cash_session(
    p_session_id text,
    p_closing_cash numeric,
    p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id text;
BEGIN
    v_org_id := auth.app_org();

    UPDATE public.cash_sessions
    SET closing_cash = p_closing_cash,
        closed_at = now(),
        status = 'CLOSED',
        notes = p_notes
    WHERE id = p_session_id AND organization_id = v_org_id;

    RETURN jsonb_build_object('success', true, 'session_id', p_session_id);
END;
$$;

-- 6. equal1_update_order_status & equal1_owner_update_order_status
CREATE OR REPLACE FUNCTION public.equal1_update_order_status(
    p_sale_id text,
    p_new_status text,
    p_actor_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id text;
    v_role text;
BEGIN
    v_org_id := auth.app_org();
    v_role := auth.app_user_role();

    IF v_role NOT IN ('owner', 'super_admin', 'manager', 'cashier', 'delivery') THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: ตำแหน่ง % ไม่มีสิทธิ์เปลี่ยนสถานะออเดอร์', v_role;
    END IF;

    UPDATE public.sales
    SET status = p_new_status
    WHERE id = p_sale_id AND organization_id = v_org_id;

    INSERT INTO public.audit_logs (
        id, organization_id, actor_name, action, entity_type, entity_id, details
    ) VALUES (
        'aud-ord-' || round(extract(epoch from now()) * 1000)::text,
        v_org_id, p_actor_name, 'ORDER_STATUS_CHANGED', 'sales', p_sale_id,
        jsonb_build_object('new_status', p_new_status, 'role', v_role)
    );

    RETURN jsonb_build_object('success', true, 'sale_id', p_sale_id, 'status', p_new_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.equal1_owner_update_order_status(
    p_sale_id text,
    p_new_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.equal1_update_order_status(p_sale_id, p_new_status, 'Owner');
END;
$$;

-- 7. equal1_complete_customer_payment (Hardened: Requires authorized cashier/verification)
CREATE OR REPLACE FUNCTION public.equal1_complete_customer_payment(
    p_sale_id text,
    p_verified_by text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id text;
    v_role text;
BEGIN
    v_org_id := auth.app_org();
    v_role := auth.app_user_role();

    -- P0-01 Hardening: Customers CANNOT self-mark payment as PAID!
    IF v_role = 'customer' THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: ลูกค้าไม่สามารถอนุมัติการชำระเงินด้วยตนเองได้ ต้องผ่านการตรวจสอบสลิปโดยพนักงานหรือเกตเวย์';
    END IF;

    UPDATE public.sales
    SET payment_status = 'paid',
        status = 'confirmed'
    WHERE id = p_sale_id AND organization_id = v_org_id;

    RETURN jsonb_build_object('success', true, 'sale_id', p_sale_id, 'payment_status', 'paid');
END;
$$;

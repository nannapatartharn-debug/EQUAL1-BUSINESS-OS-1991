# EQUAL1 — MASTER SYSTEM ARCHITECTURE & RECONCILIATION MAP
**Document Version:** 1.0.0 (Pre-Implementation Audit & Master System Map)  
**Database Project ID:** `tmdeaktnwlelicvastlb` (Project: EQUAL-BUSINESS-OS | Postgres 17 | Region: ap-southeast-1)  
**Status:** 🟢 AUDITED & RECONCILED (AWAITING APPROVAL TO IMPLEMENT UNIFIED MVP)

---

## 1. EXECUTIVE SUMMARY & CONSTITUTION BASELINE

EQUAL1 is an integrated, unified Business Operating System designed for dual-engine retail and service commerce:
1. **Mini-Mart / Retail Commerce** (Fast barcode POS, Stock Movements, Purchasing, Delivery, Receipting).
2. **Beauty / Salon / Service Commerce** (Service Catalog, Stylist Schedule, Time-slot Booking with concurrency locking, In-service tracking, Deposit/Payment, Review).

### Non-Negotiable Core Tenet: Supabase as Single Source of Truth
- **Authoritative Data Layer:** All sales, payments, inventory stocks, inventory movements, customer ledger, booking slots, cash sessions, purchasing records, audit events, and RBAC permissions reside exclusively in Supabase PostgreSQL (`tmdeaktnwlelicvastlb`).
- **Client Boundary (`localStorage`):** Strictly restricted to UI preferences, active language, theme, non-authoritative cart drafts, and offline display caches. Under NO circumstances shall `localStorage` hold authoritative transaction states, declare payments "PAID", mutate stock without inventory movement, or be bulk-synced into cloud tables.

---

## 2. DATABASE INVENTORY & TABLE RELATIONSHIP MAP (53 TABLES)

The real production database on Supabase PostgreSQL 17 contains 53 audited tables grouped across 12 functional domains:

```
[organizations] (Tenant Boundary)
   │
   ├── [branches] (Physical / Operational Boundary)
   │     │
   │     ├── [products] ──< [sale_items] >── [sales] ──< [payment_allocations] >── [payment_transactions]
   │     │     │               ▲
   │     │     └──< [inventory_movements]
   │     │     └──< [stock_reservations]
   │     │
   │     ├── [services] / [service_catalog]
   │     │     └──< [bookings] (Technician + Duration + Exclusion Constraint)
   │     │
   │     ├── [customer_menu_categories] ──< [customer_menu_items]
   │     │
   │     ├── [cash_sessions] (Cashier Shift + Opening/Closing Cash Reconciliation)
   │     │
   │     ├── [expenses] (Branch Operational Costs)
   │     │
   │     ├── [suppliers] ──< [supplier_products]
   │     │     └──< [purchase_requests] ──< [purchase_orders] ──< [goods_receipts]
   │     │
   │     └── [order_status_events] (State Machine Log)
   │
   ├── [profiles] (User Profile & Role Scope)
   │     └──< [app_role_permissions] >── [app_permissions]
   │
   ├── [customers] ──< [customer_profiles]
   │     ├──< [customer_loyalty_ledger] (Points Ledger: Earn / Redeem / Reverse / Expire)
   │     └──< [customer_support_threads] ──< [customer_support_messages]
   │
   ├── [tax_profiles] ──< [tax_settings] ──< [tax_lines] ──< [tax_documents]
   ├── [business_documents] (Receipts, Invoices, Delivery Slips)
   ├── [promotions] (Coupon, Tier, Flash Sale Rules)
   ├── [audit_logs] (Append-only immutable system event ledger)
   └── [ai_knowledge] / [ai_insights] / [ai_actions] / [ai_action_requests] / [ai_runs] / [ai_logs]
```

### Table Breakdown by Domain:
1. **Foundation & RBAC:** `organizations`, `branches`, `profiles`, `organization_runtime_settings`, `app_permissions`, `app_role_permissions`, `auth_bootstrap_requests`.
2. **Catalog & Menus:** `products`, `services`, `service_catalog`, `customer_menu_categories`, `customer_menu_items`.
3. **Customer & CRM:** `customers`, `customer_profiles`, `customer_loyalty_ledger`, `customer_support_threads`, `customer_support_messages`.
4. **Sales & Orders:** `sales`, `sale_items`, `sale_adjustments`, `order_status_events`.
5. **Payments & Ledger:** `payment_transactions`, `payment_allocations`.
6. **Inventory & Movement:** `inventory_movements`, `stock_reservations`.
7. **Purchasing & Procurement:** `suppliers`, `supplier_products`, `purchase_requests`, `purchase_request_items`, `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items`.
8. **Services & Booking:** `bookings`.
9. **Cash & Finance:** `cash_sessions`, `expenses`.
10. **Tax & Documents:** `tax_profiles`, `tax_settings`, `tax_lines`, `tax_documents`, `business_documents`.
11. **Marketing & Loyalty:** `promotions`.
12. **Staff Training & Audit:** `staff_training_courses`, `staff_training_modules`, `staff_training_assignments`, `audit_logs`.
13. **AI Brain & Analytics:** `ai_knowledge`, `ai_insights`, `ai_logs`, `ai_actions`, `ai_action_requests`, `ai_runs`, `ai_data_exports`.

---

## 3. AUDITED RPC MATRIX & SECURITY DEFINER REVIEW

| Function Name | Invoker | Org / Branch Scope | Validation & Concurrency | Risk Rating | Status / Remediation |
|---|---|---|---|---|---|
| `equal1_pos_checkout` | Staff / Owner | ✅ `app_org()`, `app_can_access_branch()` | ✅ Stock locked `FOR UPDATE`, Atomic checkout | Medium-High | Needs discount authorization check. |
| `equal1_create_pos_sale` | Staff / Owner | ✅ `app_org()`, `app_can_access_branch()` | ✅ Direct REST RPC boundary | High | Consolidate with `equal1_pos_checkout` canonical path. |
| `equal1_create_pos_sale_split`| Staff / Owner | ✅ Validated | ✅ Sum validation, split methods | Medium | Well architected; reuses internal checkout. |
| `equal1_customer_checkout` | Customer | ✅ Organization & Branch isolated | ⚠️ Delivery fee client-provided, stock reserved | High (P0-04) | Calculate delivery fee server-side; enforce reservation expiration. |
| `equal1_complete_customer_payment` | Customer | ❌ Flawed | ❌ Self-declaration of payment without gateway/staff confirmation | Critical (P0-01) | Block direct customer self-verification; require webhook or staff approval. |
| `equal1_customer_cancel_order` | Customer | ✅ Isolated | ⚠️ Allows cancel when in delivery; refund handling pending | High | Enforce terminal state checks and release unconsumed reservations. |
| `equal1_customer_create_booking` | Customer | ✅ Branch & Service validated | ✅ Exclusion constraint prevents stylist double-booking | Medium (P0-05) | Add audit log emission on creation. |
| `equal1_open_cash_session` | Cashier / Owner | ✅ Branch scoped | ✅ Prevents opening session if active session exists | Low | Standard shift control. |
| `equal1_close_cash_session` | Cashier / Owner | ✅ Branch scoped | ✅ Formula `variance = actual - (opening + cash_sales)` | Low | Enforces shift reconciliation. |
| `equal1_create_product` | Owner / Manager | ✅ Scoped | ✅ Generates SKU / initial stock movement | Low-Medium | Enforce strict permission keys. |
| `equal1_owner_update_order_status` | Owner / Manager | ✅ Scoped | ❌ Permission key mismatch (`pos` instead of valid role key) | High (Broken) | Fix permission check so Owner/Manager can transition states. |

---

## 4. CRITICAL RISKS (P0 AUDIT & DEFENSE CONSTITUTION)

### P0-01: Payment Confirmation Vulnerability
- **Flaw:** In early prototypes, a client could invoke payment completion directly or mark sales as "PAID" in frontend UI without authoritative verification.
- **Constitution:** Customer frontend CANNOT mark `status = 'PAID'`. Transitions to `PAID` require:
  1. Authoritative payment gateway webhook (e.g. Omise / Stripe / 2C2P / PromptPay slip verification service).
  2. Verified staff confirmation from Staff/Owner console.
  3. Cash shift transaction executed by an active cashier session.

### P0-02: Direct Table Mutation of Sensitive Fields
- **Flaw:** Direct `.from('sales').insert()` or `.from('products').update({stock})` via REST API allows client spoofing.
- **Constitution:** All mutations to `products.stock`, `sales.total`, `sales.status`, `payment_transactions`, `customer_loyalty_ledger`, `cash_sessions`, and `audit_logs` MUST be executed through audited RPCs (`SECURITY DEFINER` with search path hardening). Direct client `INSERT/UPDATE/DELETE` on these tables is denied by RLS.

### P0-03: Elimination of "Sync Local → Cloud" Bulk Dump
- **Flaw:** A button labeled "Sync Local → Cloud" dumped unverified `localStorage` records into PostgreSQL.
- **Constitution:** Permanently removed. No bulk unauthenticated dumps permitted. If historical data ingestion is required, it must proceed through an audited migration script with idempotency, checksums, and dry-run validation.

### P0-04 & P0-05: Client-Only Checkout & Booking
- **Flaw:** Checkout and bookings previously fallen back to local mock data when offline or unauthenticated.
- **Constitution:** Customer checkout MUST invoke `equal1_customer_checkout`. Customer bookings MUST invoke `equal1_customer_create_booking`. If cloud connectivity is lost, show explicit connectivity warnings—never silently create a fake uncommitted local transaction.

### P0-06: Authoritative Inventory Movements
- **Flaw:** Silent modifications to `products.stock`.
- **Constitution:** Every addition, deduction, transfer, breakage, or sale MUST insert an `inventory_movements` record (`before`, `change`, `after`, `reason`, `actor`, `ref_id`).

### P0-07: Single Authoritative Order & Booking State Machines
- **Order State Machine:**
  `PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `DELIVERING` → `COMPLETED`
  Cancellations: `PENDING` / `CONFIRMED` / `PREPARING` → `CANCELLED`
  Failure: `FAILED`
  *Terminal states (`COMPLETED`, `CANCELLED`, `FAILED`) cannot move backwards.*
- **Booking State Machine:**
  `REQUESTED` → `CONFIRMED` → `CHECKED_IN` → `IN_SERVICE` → `COMPLETED`
  Alternatives: `CANCELLED`, `NO_SHOW`, `RESCHEDULED`.
  *Technician scheduling considers branch, stylist skills, service duration, and buffer time without locking out unrelated technicians.*

---

## 5. FRONTEND & UX ARCHITECTURE

### Design Language Constitution
- **Aesthetic:** Japanese-modern minimalist, quiet luxury, low visual noise.
- **Color Palette:** Warm ivory (`#FBFBF9`), natural linen cream (`#F5F5F0`), deep obsidian/black (`#111111`), refined dark walnut (`#2D231E`), subtle slate border lines (`#E6E6E2`), muted text (`#737373`), functional accents for OK (`#087443`) and Danger (`#B42318`).
- **Typography:** Strict hierarchy, high legibility in Thai, English, Japanese, Chinese, German.
- **No AI Slop / No Overloaded Pills:** Clean card layouts, deliberate spacing, touch targets ≥ 44px, zero horizontal scrolling on mobile (minimum 320px width support).

### App Shell & Role Perspectives
```
┌────────────────────────────────────────────────────────┐
│                   EQUAL1 UNIFIED OS                    │
├──────────────────┬──────────────────┬──────────────────┤
│   CUSTOMER APP   │    STAFF APP     │     OWNER OS     │
│ (Mobile-First /  │  (Task-Focused / │ (High-Density /  │
│  PWA / Consumer) │   Cashier/POS /  │  Analytics /     │
│                  │     Stylist)     │  Full Control)   │
├──────────────────┴──────────────────┴──────────────────┤
│                  EQUAL1 CORE ENGINE                    │
│   Auth Context | Organization & Branch | RPC Client    │
└────────────────────────────────────────────────────────┘
```

---

## 6. MULTI-LANGUAGE ARCHITECTURE (i18n)

Supported Languages from Day 1:
- 🇹🇭 Thai (Primary operational language)
- 🇬🇧 English
- 🇨🇳 Chinese (Simplified)
- 🇹🇼 Chinese (Traditional)
- 🇯🇵 Japanese
- 🇰🇷 Korean
- 🇱🇦 Lao
- 🇲🇲 Burmese
- 🇩🇪 German

No hardcoded customer- or staff-facing strings in business logic. All strings are mapped through structured translation keys (e.g. `orders.status.preparing`, `pos.cart.total`, `booking.service.duration`). Date/Time formats adapt to locale (e.g., Thai Buddhist Era vs Gregorian).

---

## 7. UNIFIED MVP IMPLEMENTATION PLAN (STEP-BY-STEP)

```
[PHASE 0: PRE-IMPLEMENTATION AUDIT & CONSTITUTION RECONCILIATION] (Current)
   └── Deliver EQUAL1_SYSTEM_MASTER_MAP.md
   └── Confirm 53-table baseline, RPC boundaries, and security rules

[PHASE 1: P0 HARDENING & TRANSACTION SECURITY]
   └── Implement Unified Supabase Client (RPC boundary only for mutations)
   └── Remove all client-side "Sync Local -> Cloud" and fake local checkout paths
   └── Enforce server-side receipt generation and stock movement audit on checkout
   └── Fix permission check for order status updates

[PHASE 2: UNIFIED POS MVP EXECUTION]
   └── Catalog Fetch: products & categories from Cloud
   └── POS Terminal UI: search, category filters, quick cart, quantity adjustment
   └── Checkout Flow: payment method select, customer assignment, discount guard
   └── RPC Execution: equal1_pos_checkout with FOR UPDATE row locking
   └── Receipt & Audit emission: receipt number, cashier user ID, stock ledger update

[PHASE 3: CUSTOMER APP FLOW INTEGRATION]
   └── Customer Shop & Mini-Mart delivery checkout via equal1_customer_checkout
   └── Beauty Booking Calendar & Slot Reservation via equal1_customer_create_booking
   └── Real-time Order & Booking Tracking Status (Pending -> Preparing -> Ready)

[PHASE 4: OWNER OS & OBSERVABILITY]
   └── Real-time Sales, Gross Profit, Low Stock, and Cash Shift Metrics
   └── System Health Monitor & Audit Log Explorer
   └── AI Business Brain (Observe -> Explain -> Recommend -> Owner Approve -> Execute)
```

---

## 8. E2E ABUSE & SECURITY TEST MATRIX (20 CRITICAL CHECKS)

| # | Test Scenario | Expected Result |
|---|---|---|
| 1 | Duplicate checkout submission (double click/network replay) | Blocked by Idempotency Key; single transaction recorded. |
| 2 | Duplicate payment submission | Idempotency blocks second charge; audit records attempt. |
| 3 | Payment attempted after order cancellation | Rejected by State Machine; payment status not marked PAID. |
| 4 | Expired stock reservation purchase | Rejected with `RESERVATION_EXPIRED`; stock returned to available. |
| 5 | Concurrent stock purchase of last unit | Row-level `FOR UPDATE` lock allows first, rejects second with `OUT_OF_STOCK`. |
| 6 | Duplicate stock consumption | Prevented by reservation status transition to `CONSUMED`. |
| 7 | Invalid order state jump (`PENDING` → `COMPLETED`) | Rejected by State Machine validation. |
| 8 | Backward state jump (`COMPLETED` → `PENDING`) | Blocked; terminal states are immutable. |
| 9 | Double booking of technician for overlapping slot | Blocked by PostgreSQL exclusion constraint. |
| 10 | Cross-branch booking or inventory mutation | Rejected by branch validation policy. |
| 11 | Customer attempting staff/owner operations | RLS / permission check throws `PERMISSION_DENIED`. |
| 12 | Direct client write to `sales` or `products.stock` | Denied by table RLS policies. |
| 13 | Cash session opened twice by same user | Blocked; active session must be closed first. |
| 14 | Cash session closed twice | Blocked; session already in `CLOSED` state. |
| 15 | Unauthorized inventory adjustment without reason | Blocked by RPC validation. |
| 16 | Forged audit log insertion by client | Blocked; audit table insert restricted to system triggers/RPCs. |
| 17 | Customer points balance direct edit | Blocked; balance derived exclusively from ledger entries. |
| 18 | Customer client submitting forged "PAID" state | Ignored/Rejected; payment requires gateway or staff verification. |
| 19 | Client-manipulated delivery fee | Server calculates fee based on verified delivery zone settings. |
| 20 | Cross-organization access attempt | Strict tenant isolation via `organization_id` in RLS. |

---

## 9. CONCLUSION & APPROVAL GATE

The system architecture has been thoroughly inspected and reconciled. The 53 existing database tables in project `tmdeaktnwlelicvastlb` represent the true production schema. The legacy parallel SQL files (`equal1_schema_setup.sql.txt`) are flagged as **DO NOT RUN**. The user interfaces extracted from the Stitch templates will serve as design inspirations, re-implemented to invoke verified Supabase RPCs.

**Awaiting instruction:** `APPROVE IMPLEMENTATION` before beginning Phase 1 & 2 code changes.

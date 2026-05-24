# Database Implementation

## Overview

The EcomX platform uses MySQL as its primary relational database, managed through Spring Data JPA and Hibernate on the backend. The database is organized into several logical groups of tables, each responsible for a distinct domain of the application: user management and authentication, product catalog, order processing, promotions, customer engagement, and system support. All core tables inherit a shared auditing structure from a common base, ensuring consistent traceability across the entire data layer.

---

## Base Entity and Auditing

Every core table in the EcomX database is built on top of a shared base structure defined by the `BaseEntity` class. This base provides four common columns — `created_date`, `modified_date`, `created_by`, and `modified_by` — which are automatically populated by Spring Data JPA's auditing mechanism. Combined with an auto-incremented `id` (BIGINT, primary key), this base ensures that every record carries a full audit trail recording when it was created, when it was last updated, and by whom. This design decision eliminates repetitive column definitions across tables and enforces a consistent auditing standard throughout the entire database without any additional developer effort.

---

## User and Authentication Module

The user domain is split across four tables to maintain a clean separation of concerns.

The `users` table is the central identity table, storing the essential credentials and account metadata for every user in the system: `username` (unique), `password` (hashed), `email`, `telephone`, `status`, `type`, and a foreign key `role_id` pointing to the `roles` table. A self-referential `man_id` column allows hierarchical manager-subordinate relationships between users to be expressed without a separate mapping table.

The `user_info` table holds extended profile information — `full_name`, `avatar` (Cloudinary URL), `avatar_public_id`, and flexible auxiliary fields (`info_01` through `info_04`) — linked to `users` via a One-to-One relationship on `user_id`. Keeping this data in a separate table avoids widening the main `users` table with columns that are only needed during profile rendering.

The `user_address` table stores one or more delivery addresses per user. Each address record holds structured location data (`address_line`, `city`, `state`, `country`, `zip_code`) along with geolocation fields (`latitude`, `longitude`) and pre-computed logistics values (`distance_to_warehouse_meters`, `shipping_fee_vnd`) calculated at save time using the OSRM routing API. A boolean `is_default` flag identifies the user's default shipping address.

The `roles` table defines system-wide roles (e.g., `SUPER_ADMIN`, `ADMIN`, `CUSTOMER`). Unusually, rather than maintaining a separate `role_permissions` junction table, EcomX stores the full set of permission codes directly in a `permission_codes` JSON column on each role row. This denormalized approach avoids expensive joins during every authenticated request, at the cost of requiring an application-layer update when role permissions change. Fine-grained per-user overrides are handled by the `user_permissions` table, which maps individual permission codes to a specific user with an optional expiry timestamp, allowing temporary elevated access without promoting the user's base role.

---

## Authentication and Security Tables

Three supporting tables underpin the JWT-based authentication system.

The `refresh_tokens` table implements a full refresh token rotation strategy. Each row stores the token string, a unique `token_id` (UUID), a `family_id` grouping related tokens through rotation chains, a `parent_token_id` linking to the previous token in the chain, and revocation metadata (`revoked`, `revoked_at`, `revoked_reason`). This structure allows the system to detect token reuse attacks: if a revoked token from a family is presented, all tokens in that family can be immediately invalidated.

The `otp_verification` table supports OTP-based flows such as email or phone verification and password reset. A unique constraint on `(login, purpose)` ensures that only one active OTP exists per user per purpose at any given time, preventing OTP accumulation attacks.

The `password_reset_tokens` table manages one-time password reset links, storing the token value, the associated user, and an expiry timestamp.

---

## Product Catalog Module

The product catalog is modeled using a two-level SPU/SKU separation, which is a standard e-commerce pattern for handling products with multiple variants.

The `products` table (SPU — Standard Product Unit) stores shared product attributes: `product_name`, `description`, a rich-text `l_description` (TEXT), `status`, `is_featured`, `hot_sale`, `sold_count`, `tag`, and a foreign key to `category` and `brand`. This table represents the product as a concept, independent of its specific purchasable configurations.

The `product_variant` table (SKU) stores each individual purchasable configuration of a product. Variants are linked to their parent product via `product_id` and differentiated by an `option_values` JSON column — a flexible map of attribute names to values (e.g., `{"Storage": "256GB", "Color": "Deep Blue"}`). This JSON-based approach avoids the complexity of a rigid attribute-value table while still supporting rich filtering on the application side. Each variant also carries a unique `sku_code`, an `active` flag, and a `sort_order` for display ordering.

The `price` table stores the current and original price for each variant, linked via `product_variant_id`. Separating prices into their own table allows multiple price entries per variant (e.g., for different units) and simplifies price history tracking.

The `category` table supports an unlimited-depth category hierarchy through a self-referential `parent_id` foreign key, allowing the creation of category trees (e.g., Electronics → Smartphones → Android).

The `brands` table is a simple lookup table for brand identity, storing a unique `code` and `name`.

A Many-to-Many relationship between products and policies is managed through the `product_policies` junction table, linking products to reusable policy records (e.g., warranty or return policies) that can be shared across multiple products without duplication.

---

## Order and Payment Module

The ordering flow is captured across four closely related tables.

The `checkout_sessions` table serves as a short-lived staging area created when a user initiates checkout. It stores a unique `public_id` (used as the VNPAY transaction reference), the serialized order request as `request_payload_json`, the session `status` (PENDING, COMPLETED, EXPIRED, FAILED), and an `expires_at` timestamp. This intermediate table decouples the payment gateway interaction from order creation, ensuring that orders are only inserted into the `orders` table after payment confirmation, and provides idempotency for VNPAY IPN callbacks.

The `orders` table records confirmed orders with a comprehensive snapshot of the purchase context: `order_code` (human-readable identifier, e.g., `DH-2026-00000001`), `total`, `status`, `delivery_address` (stored as a text snapshot rather than a foreign key, preserving the exact address used at order time even if the user later modifies their address book), `delivery_distance_meters`, `shipping_fee_vnd`, `payment_method_id`, and payment tracking fields (`is_paid`, `paid_at`). Return and refund status is tracked independently via `return_refund_status` and `return_refund_note`, keeping it orthogonal to the main order status flow.

The `order_detail` table stores one row per product variant per order, capturing `quantity`, `unit_price` (price snapshot at time of order, immutable after creation), `total_price`, and a `pricing_programs_json` column that records which promotional programs (volume tiers, PWP offers) were applied to that line item at order time. This snapshot-based approach ensures that historical order data remains accurate even after prices or promotions change.

The `payment_methods` table is a simple configuration table listing available payment options (e.g., COD, VNPAY) with a stable internal `code` field used for payment gateway integration.

---

## Promotions Module

Two tables support the promotional pricing system.

The `product_volume_price_tier` table implements quantity-based tiered pricing at the variant level. Each row defines a `min_quantity` threshold and a corresponding `unit_price` that applies when the total quantity of that specific variant in an order reaches the threshold. A unique constraint on `(product_variant_id, min_quantity)` prevents duplicate tier definitions.

The `purchase_with_purchase_offer` table manages "Purchase With Purchase" (PWP) promotions, where buying a qualifying product unlocks the option to purchase another product at a special price.

---

## Customer Engagement Module

The `user_ratings` table allows verified buyers to submit a numeric `rating` and optional text `comment` for a product. A unique constraint on `(user_id, product_id)` ensures that each user can rate a given product only once. The application enforces an additional business rule that only users with a COMPLETED order containing the product are eligible to submit a rating.

The `product_comments` table stores written reviews from verified buyers. It shares the same `(user_id, product_id)` uniqueness constraint as ratings and includes an `is_hidden` flag that allows administrators to soft-hide inappropriate content without permanently deleting the record.

---

## Recommendation and Analytics Support

The `item_similarity` table supports the product recommendation engine by persisting pre-computed cosine similarity scores between product pairs. This offline-computed table is populated by a background job and queried at runtime to serve "related products" recommendations without expensive real-time computation.

The `job_report`, `job_report_detail`, and `job_report_resume` tables track the execution history of scheduled background jobs (e.g., similarity computation, price collection), recording start time, completion status, and per-item results for auditing and debugging.

The `collector_log` table records the history of automated price or data collection events, providing an audit trail for any data ingested from external sources.

---

## System Configuration

The `config` table serves as a simple key-value store for runtime system configuration parameters that need to be adjustable without redeployment, such as feature flags, shipping fee thresholds, or integration settings.

The `warehouse` table stores the physical location of the warehouse (coordinates and address), used by the shipping fee calculator to compute delivery distances from the warehouse to a customer's address via the OSRM routing API.

The `documents` table provides a general-purpose file/document attachment store, linked to various entity types in the system via a `DocumentEntityType` enum and a target entity ID, supporting scenarios such as attaching warranty documents or product specification sheets to specific records.

---

## Design Highlights

Several deliberate design decisions are worth noting across the EcomX database implementation.

The use of JSON columns (MySQL JSON type) in `product_variant.option_values`, `roles.permission_codes`, `order_detail.pricing_programs_json`, and `checkout_sessions.request_payload_json` reflects a pragmatic trade-off: these fields either represent flexible, schema-free data structures (variant attributes) or point-in-time snapshots that must be preserved exactly as they were at the moment of capture (order pricing, checkout payload). Storing them as JSON avoids the overhead of additional junction tables while keeping the data accessible and queryable within MySQL.

The snapshot pattern applied to order data — storing `delivery_address` as a TEXT snapshot, `unit_price` as an immutable column, and `pricing_programs_json` — is a deliberate choice to ensure historical order accuracy. Unlike a normalized design that would reference live address and price records via foreign keys, the snapshot approach guarantees that an order viewed months later reflects exactly what the customer saw and paid at checkout, even if underlying prices or addresses have since changed.

The self-referential `parent_id` on `category` and the self-referential `man_id` on `users` both express tree-structured hierarchies directly within a single table, avoiding the complexity of a separate closure table while remaining practical for the depth levels expected in this application.

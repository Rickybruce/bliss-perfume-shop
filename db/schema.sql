-- Perfume shop database schema.
-- Run once against an empty database:
--   mysql -u root -p perfume_shop < db/schema.sql
--
-- Money is stored as an integer number of pesewas (1 cedi = 100 pesewas),
-- never as a float, so rounding errors can't creep into totals.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username           VARCHAR(20)  NOT NULL,
  email              VARCHAR(190) NOT NULL,
  phone              VARCHAR(16)  NOT NULL,   -- E.164, e.g. +233241234567
  password_hash      VARCHAR(100) NOT NULL,
  role               ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  phone_verified_at  DATETIME NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- otp_codes — phone verification now, password reset later; same mechanism
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_codes (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT UNSIGNED NOT NULL,
  purpose      ENUM('phone_verify','password_reset') NOT NULL,
  code_hash    VARCHAR(64) NOT NULL,   -- sha256 hex of the 6-digit code; never store the plain code
  attempts     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at   DATETIME NOT NULL,
  consumed_at  DATETIME NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_otp_user_purpose (user_id, purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- addresses — for the house-delivery fulfillment option
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  label       VARCHAR(50) NULL,          -- e.g. "Hall", "Home"
  line1       VARCHAR(190) NOT NULL,
  city        VARCHAR(100) NOT NULL,
  landmark    VARCHAR(190) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_addr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- products / product_variants / product_images
-- Price and stock live on the variant (a specific bottle size), not the
-- product, since a 50ml and a 100ml have different prices and stock.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  brand          VARCHAR(100) NULL,
  description    TEXT NULL,
  scent_family   VARCHAR(50) NULL,        -- woody, floral, fresh...
  top_notes      VARCHAR(190) NULL,
  middle_notes   VARCHAR(190) NULL,
  base_notes     VARCHAR(190) NULL,
  concentration  ENUM('EDT','EDP','Extrait','Parfum') NULL,
  is_published   TINYINT(1) NOT NULL DEFAULT 0,   -- lets her build a listing before it goes live
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_products_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id     BIGINT UNSIGNED NOT NULL,
  size_ml        SMALLINT UNSIGNED NOT NULL,
  price_pesewas  INT UNSIGNED NOT NULL,
  stock          INT NOT NULL DEFAULT 0,
  sku            VARCHAR(40) NULL,
  CONSTRAINT fk_variant_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_variant_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  BIGINT UNSIGNED NOT NULL,
  url         VARCHAR(300) NOT NULL,   -- a Cloudinary/S3 URL, never a local file path
  position    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_image_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- orders / order_items / payments / pickup_codes
-- fulfillment_type covers the three options: junction handoff, house
-- delivery, or UCC campus pickup.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id               BIGINT UNSIGNED NOT NULL,
  fulfillment_type      ENUM('junction','house_delivery','ucc_pickup') NOT NULL,
  status                ENUM('pending','paid','packed','ready','shipped','collected','cancelled') NOT NULL DEFAULT 'pending',
  delivery_address_id   BIGINT UNSIGNED NULL,
  junction_name         VARCHAR(120) NULL,
  delivery_fee_pesewas  INT UNSIGNED NOT NULL DEFAULT 0,
  total_pesewas         INT UNSIGNED NOT NULL,   -- calculated on the server, never trust a client-sent total
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_order_address FOREIGN KEY (delivery_address_id) REFERENCES addresses(id),
  KEY idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id            BIGINT UNSIGNED NOT NULL,
  product_variant_id  BIGINT UNSIGNED NOT NULL,
  product_name        VARCHAR(150) NOT NULL,     -- snapshot: survives a later rename
  size_ml             SMALLINT UNSIGNED NOT NULL,
  unit_price_pesewas  INT UNSIGNED NOT NULL,     -- snapshot: the price at the moment of purchase
  quantity            SMALLINT UNSIGNED NOT NULL,
  CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id              BIGINT UNSIGNED NOT NULL,
  paystack_reference    VARCHAR(100) NOT NULL,
  status                ENUM('initiated','success','failed') NOT NULL DEFAULT 'initiated',
  amount_pesewas        INT UNSIGNED NOT NULL,
  raw_webhook_payload   JSON NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id),
  UNIQUE KEY uq_payment_reference (paystack_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pickup_codes (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    BIGINT UNSIGNED NOT NULL,
  code_hash   VARCHAR(64) NOT NULL,
  used_at     DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pickup_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-12.0.2-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: property_rental
-- ------------------------------------------------------
-- Server version	12.0.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','SUPER_ADMIN') NOT NULL DEFAULT 'ADMIN',
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `phone` varchar(50) DEFAULT NULL COMMENT 'Phone for 2FA',
  `avatar_url` varchar(500) DEFAULT NULL COMMENT 'Profile picture',
  `two_factor_enabled` tinyint(1) DEFAULT 0,
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `two_factor_backup_codes` text DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` int(11) DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL COMMENT 'ID of the admin who created this admin (NULL for bootstrap/system admins)',
  `signature_photo` varchar(512) DEFAULT NULL COMMENT 'Path to admin signature image for PDF bills',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `email_31` (`email`),
  UNIQUE KEY `email_32` (`email`),
  UNIQUE KEY `email_33` (`email`),
  UNIQUE KEY `email_34` (`email`),
  UNIQUE KEY `email_35` (`email`),
  UNIQUE KEY `email_36` (`email`),
  UNIQUE KEY `email_37` (`email`),
  UNIQUE KEY `email_38` (`email`),
  UNIQUE KEY `email_39` (`email`),
  UNIQUE KEY `email_40` (`email`),
  UNIQUE KEY `email_41` (`email`),
  UNIQUE KEY `email_42` (`email`),
  UNIQUE KEY `email_43` (`email`),
  UNIQUE KEY `email_44` (`email`),
  UNIQUE KEY `email_45` (`email`),
  UNIQUE KEY `email_46` (`email`),
  UNIQUE KEY `email_47` (`email`),
  UNIQUE KEY `email_48` (`email`),
  UNIQUE KEY `email_49` (`email`),
  UNIQUE KEY `email_50` (`email`),
  KEY `idx_admins_last_login` (`last_login` DESC),
  KEY `idx_admins_locked` (`locked_until`),
  KEY `idx_admins_role_status` (`role`,`status`),
  KEY `idx_admins_created_by` (`created_by`),
  CONSTRAINT `admins_created_by_foreign_idx` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `admins` VALUES
(4,'Mohamed Rahim','rahim@property.com','$2b$12$zOYFzwB0Cf/P4p95MDb33eGSc2nX3sMjFHU6RUbMVa4GY.IPtk9Qi','SUPER_ADMIN','ACTIVE','2025-10-10 05:46:02','2025-11-29 06:18:27',NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,'public/uploads/4/signature/gimi-1764397107152-953491984.png');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) DEFAULT NULL,
  `tenant_id` int(11) DEFAULT NULL,
  `table_name` varchar(100) NOT NULL,
  `record_id` int(11) NOT NULL,
  `action` enum('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','FAILED_LOGIN','PASSWORD_CHANGE','SETTINGS_CHANGE') NOT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `request_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_admin` (`admin_id`,`created_at` DESC),
  KEY `idx_tenant` (`tenant_id`,`created_at` DESC),
  KEY `idx_table` (`table_name`,`record_id`),
  KEY `idx_action` (`action`,`created_at` DESC),
  KEY `idx_created` (`created_at` DESC),
  KEY `idx_ip` (`ip_address`),
  CONSTRAINT `fk_audit_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_audit_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `bills`
--

DROP TABLE IF EXISTS `bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `bills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `rent_amount` decimal(10,2) DEFAULT NULL,
  `charges` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `month` varchar(7) NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('PENDING','PAID','OVERDUE','RECEIPT_SENT','PARTIALLY_PAID','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `payment_date` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `bill_date` date NOT NULL,
  `language` enum('en','fr') NOT NULL DEFAULT 'fr',
  `pdf_path` varchar(500) DEFAULT NULL,
  `bill_number` varchar(100) DEFAULT NULL COMMENT 'Unique reference',
  `payment_method` enum('CARD','BANK_TRANSFER','CASH','CHECK','STRIPE','OTHER') DEFAULT NULL,
  `reminder_sent` tinyint(1) DEFAULT 0,
  `reminder_count` int(11) DEFAULT 0,
  `last_reminder_date` date DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bills_tenant_id_month` (`tenant_id`,`month`),
  UNIQUE KEY `unique_bill_number` (`bill_number`),
  KEY `bills_tenant_id` (`tenant_id`),
  KEY `bills_property_id` (`property_id`),
  KEY `bills_admin_id` (`admin_id`),
  KEY `bills_status` (`status`),
  KEY `bills_due_date` (`due_date`),
  KEY `bills_month` (`month`),
  KEY `idx_bills_overdue` (`due_date`,`status`),
  KEY `idx_bills_admin_status_date` (`admin_id`,`status`,`due_date`),
  KEY `idx_bills_deleted_at` (`deleted_at`),
  CONSTRAINT `bills_ibfk_136` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `bills_ibfk_137` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `bills_ibfk_138` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bills`
--

LOCK TABLES `bills` WRITE;
/*!40000 ALTER TABLE `bills` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `bills` VALUES
(24,7,7,4,1234.00,1234.00,0.00,1234.00,'2025-11','2025-11-14','OVERDUE',NULL,'Facture mensuelle de loyer pour Mohamed Faisal\nPropriété: Rahim\nLoyer mensuel: €1234.00\nTotal: €1234.00','2025-11-15 09:20:53','2025-11-22 15:38:33','2025-11-01','fr','C:\\Users\\faisa\\OneDrive\\Desktop\\france-management-2\\backend\\uploads\\bills\\bill_24_2025-11_1763825913503.pdf',NULL,NULL,0,0,NULL,NULL),
(25,16,7,4,25000.00,25000.00,0.00,25000.00,'2025-11','2025-11-14','PAID','2025-11-29','Facture mensuelle de loyer pour Moahmed\nPropriété: Rahim\nLoyer mensuel: €25000.00\nTotal: €25000.00','2025-11-15 09:20:53','2025-11-29 13:56:24','2025-11-01','fr','C:\\Users\\faisa\\Downloads\\Rahim Anna France Project Home Sharing\\project\\backend\\uploads\\bills\\bill_25_2025-11_1764397122524.pdf',NULL,NULL,0,0,NULL,NULL),
(26,17,26,4,5500.00,5500.00,0.00,5500.00,'2025-11','2025-11-14','PENDING',NULL,'Facture mensuelle de loyer pour Shifa\nPropriété: Palce\nLoyer mensuel: €5500.00\nTotal: €5500.00','2025-11-22 10:28:59','2025-11-29 06:22:10','2025-11-01','fr','C:\\Users\\faisa\\Downloads\\Rahim Anna France Project Home Sharing\\project\\backend\\uploads\\bills\\bill_26_2025-11_1764397330590.pdf',NULL,NULL,0,0,NULL,NULL);
/*!40000 ALTER TABLE `bills` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property_id` int(11) NOT NULL,
  `month` varchar(7) NOT NULL,
  `budgeted_income` decimal(12,2) NOT NULL DEFAULT 0.00,
  `budgeted_expenses` decimal(12,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `actual_income` decimal(12,2) DEFAULT 0.00,
  `actual_expenses` decimal(12,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `budgets_property_id_month` (`property_id`,`month`),
  UNIQUE KEY `uniq_budgets_property_month` (`property_id`,`month`),
  KEY `budgets_property_id` (`property_id`),
  KEY `budgets_month` (`month`),
  CONSTRAINT `budgets_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property_id` int(11) DEFAULT NULL,
  `admin_id` int(11) NOT NULL,
  `month` varchar(7) NOT NULL,
  `category` varchar(100) NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `vendor_name` varchar(255) DEFAULT NULL,
  `payment_method` enum('CARD','BANK_TRANSFER','CASH','CHECK','OTHER') DEFAULT NULL,
  `receipt_path` varchar(500) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expenses_property_id` (`property_id`),
  KEY `expenses_admin_id` (`admin_id`),
  KEY `expenses_month` (`month`),
  KEY `expenses_category` (`category`),
  KEY `idx_expenses_invoice` (`invoice_number`),
  KEY `idx_expenses_admin_month` (`admin_id`,`month`),
  CONSTRAINT `expenses_ibfk_89` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `expenses_ibfk_90` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `expenses` VALUES
(22,NULL,4,'2025-11','Internet / Wi-Fi',123.00,NULL,'2025-11-02 00:00:00','2025-11-02 14:51:41',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(23,NULL,4,'2025-11','Cleaning & Housekeeping',500.00,NULL,'2025-11-04 00:00:00','2025-11-04 18:06:57',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(29,NULL,4,'2025-11','Electricity Bill',500.00,NULL,'2025-11-15 00:00:00','2025-11-15 09:48:51',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(30,NULL,4,'2025-11','Electricity Bill',500.00,NULL,'2025-11-15 00:00:00','2025-11-15 09:53:49',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(35,30,4,'2025-11','Electricity Bill',500.00,NULL,'2025-11-16 00:00:00','2025-11-16 15:16:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(36,7,4,'2025-11','Electricity Bill',500.00,NULL,'2025-11-16 00:00:00','2025-11-16 15:27:17',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `login_attempts`
--

DROP TABLE IF EXISTS `login_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_attempts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `attempt_time` timestamp NULL DEFAULT current_timestamp(),
  `success` tinyint(1) DEFAULT 0,
  `failure_reason` varchar(255) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_email_time` (`email`,`attempt_time` DESC),
  KEY `idx_ip_time` (`ip_address`,`attempt_time` DESC),
  KEY `idx_success` (`success`,`attempt_time` DESC),
  KEY `idx_cleanup` (`attempt_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_attempts`
--

LOCK TABLES `login_attempts` WRITE;
/*!40000 ALTER TABLE `login_attempts` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `login_attempts` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `maintenance_requests`
--

DROP TABLE IF EXISTS `maintenance_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `request_number` varchar(100) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` enum('PLUMBING','ELECTRICAL','HEATING','APPLIANCE','STRUCTURAL','CLEANING','PEST_CONTROL','OTHER') NOT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') DEFAULT 'MEDIUM',
  `status` enum('PENDING','ACKNOWLEDGED','IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  `reported_date` timestamp NULL DEFAULT current_timestamp(),
  `acknowledged_date` timestamp NULL DEFAULT NULL,
  `scheduled_date` date DEFAULT NULL,
  `completed_date` date DEFAULT NULL,
  `estimated_cost` decimal(10,2) DEFAULT NULL,
  `actual_cost` decimal(10,2) DEFAULT NULL,
  `vendor_name` varchar(255) DEFAULT NULL,
  `vendor_contact` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_request_number` (`request_number`),
  KEY `idx_property` (`property_id`,`status`),
  KEY `idx_tenant` (`tenant_id`),
  KEY `idx_admin` (`admin_id`),
  KEY `idx_status_priority` (`status`,`priority`),
  KEY `idx_scheduled` (`scheduled_date`),
  KEY `idx_category` (`category`),
  CONSTRAINT `fk_maintenance_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_maintenance_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_maintenance_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_requests`
--

LOCK TABLES `maintenance_requests` WRITE;
/*!40000 ALTER TABLE `maintenance_requests` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `maintenance_requests` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `tenant_id` int(11) DEFAULT NULL,
  `type` enum('BILL_DUE','PAYMENT_RECEIVED','MAINTENANCE','LEASE_EXPIRING','SYSTEM','DOCUMENT_UPLOADED','MESSAGE') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') DEFAULT 'MEDIUM',
  `action_url` varchar(500) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_admin_unread` (`admin_id`,`is_read`,`created_at` DESC),
  KEY `idx_tenant` (`tenant_id`),
  KEY `idx_priority` (`priority`,`created_at` DESC),
  KEY `idx_type` (`type`),
  CONSTRAINT `fk_notification_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notification_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `payment_transactions`
--

DROP TABLE IF EXISTS `payment_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `transaction_number` varchar(100) DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL,
  `stripe_charge_id` varchar(255) DEFAULT NULL,
  `stripe_customer_id` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'EUR',
  `status` enum('PENDING','PROCESSING','SUCCEEDED','FAILED','REFUNDED','CANCELLED') DEFAULT 'PENDING',
  `payment_method` enum('CARD','BANK_TRANSFER','CASH','CHECK','STRIPE','SEPA','OTHER') NOT NULL,
  `payment_method_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payment_method_details`)),
  `transaction_date` timestamp NULL DEFAULT current_timestamp(),
  `confirmation_number` varchar(100) DEFAULT NULL,
  `receipt_url` varchar(500) DEFAULT NULL,
  `failure_reason` text DEFAULT NULL,
  `refund_amount` decimal(10,2) DEFAULT NULL,
  `refund_reason` text DEFAULT NULL,
  `refund_date` timestamp NULL DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_stripe_intent` (`stripe_payment_intent_id`),
  UNIQUE KEY `unique_transaction_number` (`transaction_number`),
  KEY `idx_bill` (`bill_id`),
  KEY `idx_tenant` (`tenant_id`),
  KEY `idx_admin` (`admin_id`),
  KEY `idx_status` (`status`),
  KEY `idx_date` (`transaction_date` DESC),
  KEY `idx_stripe_customer` (`stripe_customer_id`),
  CONSTRAINT `fk_transaction_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_transaction_bill` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_transaction_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_transactions`
--

LOCK TABLES `payment_transactions` WRITE;
/*!40000 ALTER TABLE `payment_transactions` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `payment_transactions` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `profits`
--

DROP TABLE IF EXISTS `profits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `profits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `total_profit` decimal(10,2) NOT NULL DEFAULT 0.00,
  `last_updated` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `profits_admin_id` (`admin_id`),
  CONSTRAINT `profits_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profits`
--

LOCK TABLES `profits` WRITE;
/*!40000 ALTER TABLE `profits` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `profits` VALUES
(1,4,25444.00,'2025-11-29 13:56:24','2025-10-19 09:54:26','2025-11-29 13:56:24');
/*!40000 ALTER TABLE `profits` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `properties`
--

DROP TABLE IF EXISTS `properties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `properties` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `address` varchar(500) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) NOT NULL,
  `country` varchar(100) DEFAULT NULL,
  `property_type` enum('APARTMENT','HOUSE','CONDO','STUDIO','OTHER') NOT NULL DEFAULT 'APARTMENT',
  `monthly_rent` decimal(10,2) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `photo` varchar(500) DEFAULT NULL,
  `number_of_halls` int(11) DEFAULT NULL,
  `number_of_kitchens` int(11) DEFAULT NULL,
  `number_of_bathrooms` int(11) DEFAULT NULL,
  `number_of_parking_spaces` int(11) DEFAULT NULL,
  `number_of_rooms` int(11) DEFAULT NULL,
  `number_of_gardens` int(11) DEFAULT NULL,
  `square_meters` decimal(10,2) DEFAULT NULL COMMENT 'Surface area',
  `floor_number` int(11) DEFAULT NULL,
  `has_elevator` tinyint(1) DEFAULT 0,
  `has_balcony` tinyint(1) DEFAULT 0,
  `furnished` tinyint(1) DEFAULT 0,
  `available_from` date DEFAULT NULL,
  `status` enum('AVAILABLE','OCCUPIED','MAINTENANCE','UNAVAILABLE') DEFAULT 'AVAILABLE',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `properties_admin_id` (`admin_id`),
  KEY `properties_property_type` (`property_type`),
  KEY `properties_city_country` (`city`,`country`),
  KEY `idx_properties_status` (`status`),
  KEY `idx_properties_available` (`available_from`,`status`),
  KEY `idx_properties_admin_status` (`admin_id`,`status`),
  KEY `properties_city_postal_code` (`city`,`postal_code`),
  KEY `idx_properties_deleted_at` (`deleted_at`),
  CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `properties`
--

LOCK TABLES `properties` WRITE;
/*!40000 ALTER TABLE `properties` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `properties` VALUES
(7,4,'Rahim',NULL,'167,Main Road','Karaikal',NULL,'00000','India','APARTMENT',499.99,'2025-10-15 12:11:08','2025-11-14 13:38:06',NULL,1,2,3,5,1,2,NULL,NULL,0,0,0,NULL,'AVAILABLE',NULL),
(26,4,'Palce',NULL,'167 Mian road','Paris',NULL,'60322',NULL,'APARTMENT',5500.00,'2025-11-14 13:39:19','2025-11-14 13:39:19','http://localhost:4002/uploads/1763127559305-395718018-Logo.jpg',12,12,1,0,1,1,NULL,NULL,0,0,0,NULL,'AVAILABLE',NULL),
(30,4,'Palace',NULL,'167,main Road','Paris',NULL,'40025',NULL,'APARTMENT',202.00,'2025-11-14 15:34:35','2025-11-14 15:34:35','http://localhost:4002/uploads/1763134475326-2898733-noun-tiles-1656668.png',0,0,0,0,0,0,NULL,NULL,0,0,0,NULL,'AVAILABLE',NULL),
(31,4,'mss',NULL,'167 main road','paris',NULL,'paris',NULL,'APARTMENT',500000.00,'2025-11-22 10:11:55','2025-11-22 10:11:55','http://localhost:4002/uploads/1763806315541-65124289-Screenshot_2025-11-17_191022.png',2,5,5,45,5,2,NULL,NULL,0,0,0,NULL,'AVAILABLE',NULL),
(33,4,'Test Property 1764419027965',NULL,'123 Test Street','Paris',NULL,'75001',NULL,'APARTMENT',1000.00,'2025-11-29 12:23:47','2025-11-29 12:23:48',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,NULL,'AVAILABLE','2025-11-29 12:23:48');
/*!40000 ALTER TABLE `properties` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `property_photos`
--

DROP TABLE IF EXISTS `property_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `property_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL COMMENT 'Relative path from uploads root, e.g., /1/properties/5/photo.jpg',
  `file_url` varchar(1000) NOT NULL COMMENT 'Full URL to access the photo',
  `original_filename` varchar(255) DEFAULT NULL COMMENT 'Original filename from upload',
  `file_size` int(11) DEFAULT NULL COMMENT 'File size in bytes',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME type of the file',
  `is_primary` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this is the primary photo for the property',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `caption` varchar(255) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `property_photos_admin_id` (`admin_id`),
  KEY `property_photos_property_id` (`property_id`),
  KEY `property_photos_is_primary` (`is_primary`),
  KEY `idx_photos_display_order` (`property_id`,`display_order`),
  CONSTRAINT `property_photos_ibfk_89` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `property_photos_ibfk_90` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `property_photos`
--

LOCK TABLES `property_photos` WRITE;
/*!40000 ALTER TABLE `property_photos` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `property_photos` VALUES
(10,4,7,'public\\uploads\\4\\properties\\7\\Screenshot_2025_07_19_182617-1762349267553-983029950.png','http://localhost:4002/uploads/4/properties/7/Screenshot_2025_07_19_182617-1762349267553-983029950.png','Screenshot 2025-07-19 182617.png',394541,'image/png',1,'2025-11-05 13:27:47','2025-11-05 13:27:47',0,NULL,NULL),
(12,4,26,'public\\uploads\\4\\properties\\26\\Logo-1763127567995-797190077.jpg','http://localhost:4002/uploads/4/properties/26/Logo-1763127567995-797190077.jpg','Logo.jpg',55888,'image/jpeg',1,'2025-11-14 13:39:27','2025-11-14 13:46:22',0,NULL,NULL),
(14,4,26,'public\\uploads\\4\\properties\\26\\Screenshot_2025_11_05_184606-1763127963054-220989927.png','http://localhost:4002/uploads/4/properties/26/Screenshot_2025_11_05_184606-1763127963054-220989927.png','Screenshot 2025-11-05 184606.png',82762,'image/png',0,'2025-11-14 13:46:03','2025-11-14 13:46:22',0,NULL,NULL),
(15,4,30,'public\\uploads\\4\\properties\\30\\noun_tiles_1656668-1763134484276-803733953.png','http://localhost:4002/uploads/4/properties/30/noun_tiles_1656668-1763134484276-803733953.png','noun-tiles-1656668.png',15733,'image/png',1,'2025-11-14 15:34:44','2025-11-14 15:34:44',0,NULL,NULL),
(16,4,31,'public/uploads/1763806315541-65124289-Screenshot_2025-11-17_191022.png','http://localhost:4002/uploads/1763806315541-65124289-Screenshot_2025-11-17_191022.png','Screenshot 2025-11-17 191022.png',1803454,'image/png',1,'2025-11-22 10:11:55','2025-11-22 10:11:55',0,NULL,NULL);
/*!40000 ALTER TABLE `property_photos` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `receipts`
--

DROP TABLE IF EXISTS `receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bill_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `sent_date` datetime NOT NULL,
  `sent_to_tenant` tinyint(1) NOT NULL DEFAULT 1,
  `sent_to_admin` tinyint(1) NOT NULL DEFAULT 1,
  `sent_to_owner` tinyint(1) NOT NULL DEFAULT 0,
  `tenant_email` varchar(255) DEFAULT NULL,
  `admin_email` varchar(255) DEFAULT NULL,
  `owner_email` varchar(255) DEFAULT NULL,
  `pdf_path` varchar(500) DEFAULT NULL,
  `status` enum('SENT','FAILED','PENDING') NOT NULL DEFAULT 'PENDING',
  `error_message` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `receipt_number` varchar(100) DEFAULT NULL,
  `retry_count` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_receipt_number` (`receipt_number`),
  KEY `receipts_bill_id` (`bill_id`),
  KEY `receipts_tenant_id` (`tenant_id`),
  KEY `receipts_admin_id` (`admin_id`),
  KEY `receipts_sent_date` (`sent_date`),
  KEY `receipts_status` (`status`),
  CONSTRAINT `receipts_ibfk_133` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `receipts_ibfk_134` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `receipts_ibfk_135` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipts`
--

LOCK TABLES `receipts` WRITE;
/*!40000 ALTER TABLE `receipts` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `receipts` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `sid` varchar(255) NOT NULL,
  `sess` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`sess`)),
  `expire` datetime NOT NULL,
  PRIMARY KEY (`sid`),
  KEY `sessions_expire` (`expire`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `tenant_documents`
--

DROP TABLE IF EXISTS `tenant_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL COMMENT 'Relative path from uploads root, e.g., /1/tenants/3/document.pdf',
  `file_url` varchar(1000) NOT NULL COMMENT 'Full URL to access the document',
  `original_filename` varchar(255) DEFAULT NULL COMMENT 'Original filename from upload',
  `file_size` int(11) DEFAULT NULL COMMENT 'File size in bytes',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME type of the file',
  `document_type` varchar(100) DEFAULT NULL COMMENT 'Type of document (e.g., ID, Lease, Contract)',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `verified_at` timestamp NULL DEFAULT NULL,
  `verified_by` int(11) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tenant_documents_admin_id` (`admin_id`),
  KEY `tenant_documents_tenant_id` (`tenant_id`),
  KEY `tenant_documents_document_type` (`document_type`),
  KEY `idx_documents_expiry` (`expiry_date`),
  KEY `idx_documents_verified` (`is_verified`),
  CONSTRAINT `tenant_documents_ibfk_89` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tenant_documents_ibfk_90` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_documents`
--

LOCK TABLES `tenant_documents` WRITE;
/*!40000 ALTER TABLE `tenant_documents` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `tenant_documents` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `lease_start` date DEFAULT NULL,
  `lease_end` date DEFAULT NULL,
  `rent_amount` decimal(10,2) DEFAULT NULL,
  `join_date` date NOT NULL,
  `status` enum('ACTIVE','INACTIVE','EXPIRED','PENDING') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `occupation` varchar(255) DEFAULT NULL,
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_phone` varchar(50) DEFAULT NULL,
  `security_deposit` decimal(10,2) DEFAULT NULL,
  `move_out_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL COMMENT 'Tenant address',
  `charges_amount` decimal(10,2) DEFAULT NULL COMMENT 'Optional charges amount for the tenant',
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tenants_admin_id` (`admin_id`),
  KEY `tenants_property_id` (`property_id`),
  KEY `tenants_status` (`status`),
  KEY `tenants_lease_start_lease_end` (`lease_start`,`lease_end`),
  KEY `idx_tenants_email` (`email`),
  KEY `idx_tenants_property_status` (`property_id`,`status`),
  KEY `idx_tenants_deleted_at` (`deleted_at`),
  CONSTRAINT `tenants_ibfk_93` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tenants_ibfk_94` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `tenants` VALUES
(7,4,7,'Mohamed Faisal','faisal786mf7@gmail.com','07358874293',NULL,NULL,1234.00,'2025-10-18','ACTIVE','2025-10-18 10:04:55','2025-11-16 15:16:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(16,4,7,'Moahmed','faisal786@gmail.com','7358874283',NULL,NULL,25000.00,'2025-11-14','ACTIVE','2025-11-14 15:43:48','2025-11-16 15:22:29',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(17,4,26,'Shifa','faisal786mf7@gmail.com','7358874293',NULL,NULL,250.00,'2025-11-15','ACTIVE','2025-11-15 07:20:46','2025-11-22 15:12:48',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'167 Main Road',50.00,NULL),
(24,4,33,'Test Tenant 1764419027992','test1764419027992@example.com','+33123456789',NULL,NULL,1000.00,'2025-11-29','ACTIVE','2025-11-29 12:23:47','2025-11-29 12:23:48',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-29 12:23:48');
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `user_feedback`
--

DROP TABLE IF EXISTS `user_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` enum('FEATURE','BUG','IMPROVEMENT','UI','SECURITY','OTHER') NOT NULL,
  `priority` enum('LOW','MEDIUM','HIGH') DEFAULT 'MEDIUM',
  `status` enum('PENDING','UNDER_REVIEW','PLANNED','IN_PROGRESS','COMPLETED','REJECTED') DEFAULT 'PENDING',
  `votes` int(11) DEFAULT 0,
  `is_ai_generated` tinyint(1) DEFAULT 0,
  `implemented_in_version` varchar(20) DEFAULT NULL,
  `admin_response` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_admin` (`admin_id`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`,`votes` DESC),
  KEY `idx_category` (`category`),
  KEY `idx_votes` (`votes` DESC),
  CONSTRAINT `fk_feedback_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_feedback`
--

LOCK TABLES `user_feedback` WRITE;
/*!40000 ALTER TABLE `user_feedback` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `user_feedback` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Temporary table structure for view `v_active_tenants`
--

DROP TABLE IF EXISTS `v_active_tenants`;
/*!50001 DROP VIEW IF EXISTS `v_active_tenants`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_active_tenants` AS SELECT
 1 AS `id`,
  1 AS `tenant_name`,
  1 AS `email`,
  1 AS `phone`,
  1 AS `rent_amount`,
  1 AS `lease_start`,
  1 AS `lease_end`,
  1 AS `status`,
  1 AS `property_id`,
  1 AS `property_title`,
  1 AS `property_address`,
  1 AS `property_city`,
  1 AS `admin_id`,
  1 AS `admin_name`,
  1 AS `admin_email` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `v_overdue_bills`
--

DROP TABLE IF EXISTS `v_overdue_bills`;
/*!50001 DROP VIEW IF EXISTS `v_overdue_bills`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_overdue_bills` AS SELECT
 1 AS `id`,
  1 AS `month`,
  1 AS `amount`,
  1 AS `due_date`,
  1 AS `status`,
  1 AS `days_overdue`,
  1 AS `tenant_name`,
  1 AS `tenant_email`,
  1 AS `tenant_phone`,
  1 AS `property_title`,
  1 AS `admin_name` */;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'property_rental'
--

--
-- Dumping routines for database 'property_rental'
--

--
-- Final view structure for view `v_active_tenants`
--

/*!50001 DROP VIEW IF EXISTS `v_active_tenants`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_active_tenants` AS select `t`.`id` AS `id`,`t`.`name` AS `tenant_name`,`t`.`email` AS `email`,`t`.`phone` AS `phone`,`t`.`rent_amount` AS `rent_amount`,`t`.`lease_start` AS `lease_start`,`t`.`lease_end` AS `lease_end`,`t`.`status` AS `status`,`p`.`id` AS `property_id`,`p`.`title` AS `property_title`,`p`.`address` AS `property_address`,`p`.`city` AS `property_city`,`a`.`id` AS `admin_id`,`a`.`name` AS `admin_name`,`a`.`email` AS `admin_email` from ((`tenants` `t` join `properties` `p` on(`t`.`property_id` = `p`.`id`)) join `admins` `a` on(`t`.`admin_id` = `a`.`id`)) where `t`.`status` = 'ACTIVE' */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_overdue_bills`
--

/*!50001 DROP VIEW IF EXISTS `v_overdue_bills`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_overdue_bills` AS select `b`.`id` AS `id`,`b`.`month` AS `month`,`b`.`amount` AS `amount`,`b`.`due_date` AS `due_date`,`b`.`status` AS `status`,to_days(curdate()) - to_days(`b`.`due_date`) AS `days_overdue`,`t`.`name` AS `tenant_name`,`t`.`email` AS `tenant_email`,`t`.`phone` AS `tenant_phone`,`p`.`title` AS `property_title`,`a`.`name` AS `admin_name` from (((`bills` `b` join `tenants` `t` on(`b`.`tenant_id` = `t`.`id`)) join `properties` `p` on(`b`.`property_id` = `p`.`id`)) join `admins` `a` on(`b`.`admin_id` = `a`.`id`)) where `b`.`status` = 'OVERDUE' order by `b`.`due_date` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-11-30 15:02:34

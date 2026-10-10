-- =============================================================================
-- GRAND ADDIS HOTEL - Production MySQL / MariaDB Database Dump
-- Compatible with Plesk Obsidian / Onyx, phpMyAdmin, and MySQL 8.0+ / MariaDB 10.5+
-- Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

-- -----------------------------------------------------------------------------
-- 1. Database Creation (Optional - Uncomment only if running as MySQL root CLI)
-- In Plesk, create your database in the GUI, open phpMyAdmin (or "Import Dump"),
-- and import this file directly into your created database.
-- -----------------------------------------------------------------------------
-- CREATE DATABASE IF NOT EXISTS `grand_addis_db`
--   DEFAULT CHARACTER SET utf8mb4
--   COLLATE utf8mb4_unicode_ci;
-- USE `grand_addis_db`;


-- -----------------------------------------------------------------------------
-- 2. Table: hotel_settings
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `hotel_settings`;
CREATE TABLE `hotel_settings` (
  `key` VARCHAR(191) NOT NULL,
  `value` TEXT NOT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `hotel_settings` (`key`, `value`) VALUES
('usd_to_etb_rate', '189'),
('hotel_name', 'Grand Addis Hotel'),
('hotel_address', '22 Around Golagul, behind Meklit Building, Addis Ababa, Ethiopia'),
('hotel_phone', '+251 116 672 828'),
('hotel_email', 'reservations@egrandaddishotel.com')
ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);

-- -----------------------------------------------------------------------------
-- 3. Table: room_types
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `room_types`;
CREATE TABLE `room_types` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `baseCapacity` INT NOT NULL DEFAULT 2,
  `maxCapacity` INT NOT NULL DEFAULT 3,
  `amenities` JSON DEFAULT NULL,
  `images` JSON DEFAULT NULL,
  `basePriceETB` DECIMAL(10,2) NOT NULL DEFAULT 5800.00,
  `basePriceUSD` DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  `size` VARCHAR(50) DEFAULT '32 m²',
  `bedType` VARCHAR(100) DEFAULT 'King Bed',
  `view` VARCHAR(100) DEFAULT 'City View',
  `category` VARCHAR(100) DEFAULT 'Hotel Rooms',
  `featured` TINYINT(1) DEFAULT 1,
  `aliases` JSON DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_room_types_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `room_types` (
  `id`, `slug`, `name`, `description`, `baseCapacity`, `maxCapacity`,
  `amenities`, `images`, `basePriceETB`, `basePriceUSD`, `size`, `bedType`, `view`, `category`, `featured`, `aliases`
) VALUES
(
  'rt-standard-double',
  'standard-double-room',
  'Standard Double Room',
  'Refined comfort for business and leisure travelers. Features comfortable queen bed, ergonomic desk, blackout drapes, and modern en-suite marble bathroom.',
  2, 2,
  JSON_ARRAY('Queen Bed', 'High-Speed Wi-Fi', 'Work Station', 'Satellite HD TV', 'Tea & Ethiopian Coffee Maker', '24/7 Room Service', 'Daily Housekeeping', 'Electronic Safe'),
  JSON_ARRAY('/images/vikbooking/bo5a5902.jpg', '/images/vikbooking/big_bo5a5894.jpg', '/images/vikbooking/big_bo5a5900.jpg', '/hotel_images/1760816082.webp'),
  5800.00, 50.00, '28 m²', 'Queen Bed', 'City View', 'Hotel Rooms', 1,
  JSON_ARRAY('standard-room', 'double-rooms', 'standard')
),
(
  'rt-twin-deluxe',
  'twin-deluxe-room',
  'Twin Deluxe Room',
  'Two plush double beds ideal for colleagues, friends, or small families visiting Addis Ababa. Includes private balcony, modern workspace, and city views.',
  2, 3,
  JSON_ARRAY('2 Double Beds', 'City View Balcony', 'High-speed Wi-Fi', 'Spacious Marble Bathroom', 'Complimentary Breakfast', 'Electric Kettle', 'In-Room Safe'),
  JSON_ARRAY('/images/vikbooking/bo5a5832.jpg', '/images/vikbooking/big_260bo5a5832.jpg', '/images/vikbooking/big_bo5a5852.jpg', '/hotel_images/1760816141.webp'),
  7200.00, 62.00, '34 m²', 'Two Double Beds', 'City View Balcony', 'Hotel Rooms', 1,
  JSON_ARRAY('twin-room', 'twin-deluxe')
),
(
  'rt-deluxe-king',
  'deluxe-king-room',
  'Deluxe King Room',
  'Spacious luxury room featuring a plush king-sized bed, panoramic balcony with skyline view of Addis Ababa, marble bathroom with deep soaking tub and rainfall shower, and ergonomic work desk.',
  2, 3,
  JSON_ARRAY('King Bed', 'Private Balcony', 'High-speed Wi-Fi', 'Rainfall Shower & Soaking Tub', 'Smart 55" 4K TV', 'Mini-bar & Refreshment Station', 'Complimentary Breakfast', '24/7 Room Service'),
  JSON_ARRAY('/images/vikbooking/bo5a5878.jpg', '/images/vikbooking/big_bo5a5868.jpg', '/images/BO5A5826-scaled.jpg', '/hotel_images/1760816140.webp'),
  8500.00, 75.00, '36 m²', 'King Size Bed', 'Panoramic City & Mountain View', 'Hotel Rooms', 1,
  JSON_ARRAY('deluxe-room', 'deluxe-king')
),
(
  'rt-executive-suite',
  'executive-suite',
  'Executive Suite with Balcony',
  'An elevated luxury sanctuary with separated living room, master bedroom, executive lounge access, espresso bar, and scenic mountain and city views over the Bole district.',
  2, 4,
  JSON_ARRAY('King Bed', 'Separate Living Room', 'Executive Lounge Access', 'Espresso Machine', 'Panoramic Balcony', 'Bathtub & Jacuzzi', 'VIP Airport Shuttle', 'Breakfast Buffet Included'),
  JSON_ARRAY('/images/BO5A5992-scaled.jpg', '/images/BO5A5989-scaled.jpg', '/images/BO5A5976-scaled.jpg', '/hotel_images/1760816139.webp'),
  14000.00, 120.00, '52 m²', 'Master King Bed + Daybed', 'Corner Skyline View', 'Suites', 1,
  JSON_ARRAY('grand-executive-suite', 'executive')
),
(
  'rt-presidential-suite',
  'presidential-suite',
  'Grand Addis Presidential Suite',
  'The pinnacle of luxury in Addis Ababa. Palatial top-floor residence with grand dining room, kitchen, private butler service, jacuzzi, and 360-degree terrace overlooking the capital.',
  4, 6,
  JSON_ARRAY('Master King Bed + Guest Suite', '360° Private Rooftop Terrace', 'Jacuzzi Spa & Sauna', 'Private Dining Room & Kitchenette', 'Dedicated 24/7 Butler Service', 'Complimentary Limousine Airport Transfer', 'Full Stocked Mini-bar', 'Chef Tasting Experience'),
  JSON_ARRAY('/hotel_images/1760816135.webp', '/images/BO5A5992-scaled.jpg', '/images/BO5A5976-scaled.jpg', '/images/BO5A5805-scaled.jpg'),
  35000.00, 300.00, '96 m²', 'Palatial King Master + Guest Suite', '360° Private Rooftop Terrace View', 'Suites', 1,
  JSON_ARRAY('grand-presidential-suite', 'presidential')
)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `basePriceUSD`=VALUES(`basePriceUSD`), `basePriceETB`=VALUES(`basePriceETB`);

-- -----------------------------------------------------------------------------
-- 4. Table: rooms (Physical Rooms Inventory)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `rooms`;
CREATE TABLE `rooms` (
  `id` VARCHAR(191) NOT NULL,
  `roomNumber` VARCHAR(50) NOT NULL,
  `floor` INT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
  `roomTypeId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_rooms_roomNumber` (`roomNumber`),
  KEY `idx_rooms_roomTypeId_status` (`roomTypeId`, `status`),
  CONSTRAINT `fk_rooms_room_type` FOREIGN KEY (`roomTypeId`) REFERENCES `room_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `rooms` (`id`, `roomNumber`, `floor`, `status`, `roomTypeId`) VALUES
('rm-101', '101', 1, 'AVAILABLE', 'rt-standard-double'),
('rm-102', '102', 1, 'AVAILABLE', 'rt-standard-double'),
('rm-103', '103', 1, 'AVAILABLE', 'rt-standard-double'),
('rm-104', '104', 1, 'AVAILABLE', 'rt-standard-double'),
('rm-105', '105', 1, 'AVAILABLE', 'rt-standard-double'),
('rm-201', '201', 2, 'AVAILABLE', 'rt-twin-deluxe'),
('rm-202', '202', 2, 'AVAILABLE', 'rt-twin-deluxe'),
('rm-203', '203', 2, 'AVAILABLE', 'rt-twin-deluxe'),
('rm-204', '204', 2, 'AVAILABLE', 'rt-twin-deluxe'),
('rm-205', '205', 2, 'AVAILABLE', 'rt-twin-deluxe'),
('rm-301', '301', 3, 'AVAILABLE', 'rt-deluxe-king'),
('rm-302', '302', 3, 'AVAILABLE', 'rt-deluxe-king'),
('rm-303', '303', 3, 'AVAILABLE', 'rt-deluxe-king'),
('rm-304', '304', 3, 'AVAILABLE', 'rt-deluxe-king'),
('rm-305', '305', 3, 'AVAILABLE', 'rt-deluxe-king'),
('rm-401', '401', 4, 'AVAILABLE', 'rt-executive-suite'),
('rm-402', '402', 4, 'AVAILABLE', 'rt-executive-suite'),
('rm-403', '403', 4, 'AVAILABLE', 'rt-executive-suite'),
('rm-501', '501', 5, 'AVAILABLE', 'rt-presidential-suite')
ON DUPLICATE KEY UPDATE `status`='AVAILABLE';

-- -----------------------------------------------------------------------------
-- 5. Table: guests
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `guests`;
CREATE TABLE `guests` (
  `id` VARCHAR(191) NOT NULL,
  `firstName` VARCHAR(100) NOT NULL,
  `lastName` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phoneNumber` VARCHAR(100) NOT NULL,
  `nationalIdOrPass` VARCHAR(100) DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_guests_email` (`email`),
  KEY `idx_guests_phone` (`phoneNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Table: reservations
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `reservations`;
CREATE TABLE `reservations` (
  `id` VARCHAR(191) NOT NULL,
  `bookingRef` VARCHAR(100) NOT NULL,
  `checkInDate` DATE NOT NULL,
  `checkOutDate` DATE NOT NULL,
  `adultsCount` INT NOT NULL DEFAULT 1,
  `childrenCount` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
  `expiresAt` DATETIME(3) DEFAULT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `subtotal` DECIMAL(10,2) NOT NULL,
  `taxAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `totalAmount` DECIMAL(10,2) NOT NULL,
  `specialRequests` TEXT DEFAULT NULL,
  `guestId` VARCHAR(191) NOT NULL,
  `roomTypeId` VARCHAR(191) NOT NULL,
  `roomId` VARCHAR(191) DEFAULT NULL,
  `isDateExtended` TINYINT(1) DEFAULT 0,
  `dateChangeNote` TEXT DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_reservations_bookingRef` (`bookingRef`),
  KEY `idx_reservations_guestId` (`guestId`),
  KEY `idx_reservations_roomTypeId` (`roomTypeId`),
  KEY `idx_reservations_roomId` (`roomId`),
  KEY `idx_reservations_dates_status` (`roomTypeId`, `status`, `checkInDate`, `checkOutDate`),
  CONSTRAINT `fk_reservations_guest` FOREIGN KEY (`guestId`) REFERENCES `guests` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_reservations_room_type` FOREIGN KEY (`roomTypeId`) REFERENCES `room_types` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_reservations_room` FOREIGN KEY (`roomId`) REFERENCES `rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Table: payments
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `provider` VARCHAR(50) NOT NULL DEFAULT 'CASH_ON_ARRIVAL',
  `status` VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
  `txRef` VARCHAR(191) NOT NULL,
  `gatewayRef` VARCHAR(191) DEFAULT NULL,
  `reservationId` VARCHAR(191) NOT NULL,
  `paidAt` DATETIME(3) DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_payments_txRef` (`txRef`),
  KEY `idx_payments_reservationId` (`reservationId`),
  CONSTRAINT `fk_payments_reservation` FOREIGN KEY (`reservationId`) REFERENCES `reservations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Table: experiences
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `experiences`;
CREATE TABLE `experiences` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `duration` VARCHAR(100) NOT NULL,
  `image` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `highlights` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `experiences` (`id`, `title`, `subtitle`, `category`, `duration`, `image`, `description`, `highlights`) VALUES
(
  'exp1',
  'Traditional Ethiopian Coffee Ceremony',
  'A sensory journey through the birthplace of Arabica',
  'Culture',
  '1.5 Hours',
  '/images/BO5A5779-scaled.jpg',
  'Immerse yourself in centuries of tradition. Watch our coffee masters wash, roast, grind, and brew beans over charcoal embers in a clay jebena, accompanied by fragrant incense and traditional snacks.',
  JSON_ARRAY('Clay jebena brewing', 'Freshly roasted beans tasting', 'Cultural storytelling', 'Traditional snacks & popcorn')
),
(
  'exp2',
  'Addis Ababa City & Heritage Excursion',
  'Explore history, culture, and panoramic views',
  'City Tour',
  'Half Day (4-5 Hours)',
  '/images/BO5A5957-scaled.jpg',
  'Discover the best of Addis Ababa with our private chauffeured tour. Visit the National Museum of Ethiopia (home of 3.2-million-year-old Lucy), Holy Trinity Cathedral, and the breathtaking viewpoints from Mount Entoto.',
  JSON_ARRAY('National Museum & Lucy', 'Mount Entoto scenic panorama', 'Holy Trinity Cathedral', 'Comfortable luxury transport')
),
(
  'exp3',
  'Chef-Led Culinary Masterclass',
  'Learn the secrets of authentic Ethiopian gastronomy',
  'Gastronomy',
  '2.5 Hours',
  '/images/BO5A5805-scaled.jpg',
  'Join our Executive Chef in our hotel kitchen. Learn how to ferment teff batter for injera, balance traditional berbere spices, and cook aromatic tibs and vegetarian shiro stews.',
  JSON_ARRAY('Hands-on cooking', 'Injera making demonstration', 'Spice blending secrets', 'Tasting dinner with wine')
),
(
  'exp4',
  'Highland Wellness & Fitness Escape',
  'Re-energize your body at 2,300 meters altitude',
  'Wellness',
  '2 Hours',
  '/images/BO5A5977-scaled.jpg',
  'Harness the clean highland air of Addis Ababa. Enjoy guided morning rooftop yoga or circuit training in our fitness suite, followed by steam recovery and freshly blended smoothies.',
  JSON_ARRAY('Sunrise yoga sessions', 'Cardio & strength gym access', 'Steam & sauna recovery', 'Detox fresh smoothies')
)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- -----------------------------------------------------------------------------
-- 9. Table: testimonials
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `testimonials`;
CREATE TABLE `testimonials` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `rating` INT NOT NULL DEFAULT 5,
  `date` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `comment` TEXT NOT NULL,
  `room_type` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'APPROVED',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_testimonials_status` (`status`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `testimonials` (`id`, `name`, `location`, `rating`, `date`, `title`, `comment`, `room_type`, `status`) VALUES
('t1', 'Alexander Wright', 'London, United Kingdom', 5, 'February 2026', 'Exceptional hospitality and prime location', 'We arrived early and could not check in immediately due to high occupancy, but the reception staff warmly welcomed us with fresh coffee, took care of our luggage, and allowed us to relax in the lounge. The Deluxe room was spotless, peaceful, and the bed exceptionally comfortable. We will definitely return!', 'Deluxe Room', 'APPROVED'),
('t2', 'Bethelhem Tadesse', 'Nairobi, Kenya', 5, 'January 2026', 'True gem in the heart of Addis Ababa', 'Grand Addis Hotel exceeded all my expectations. The staff are so courteous, always greeting with genuine smiles. The restaurant serves incredible Ethiopian food alongside international dishes. Highly recommended for both business and leisure.', 'Grand Executive Suite', 'APPROVED'),
('t3', 'Jean-Pierre Laurent', 'Paris, France', 5, 'March 2026', 'Unbeatable value and peaceful oasis', 'Traveling for diplomatic meetings, I needed reliable high-speed internet and quiet nights. The Standard Room delivered on every level. Quiet AC, modern bathroom, and 10 minutes to Bole Airport. Outstanding value!', 'Standard Room', 'APPROVED'),
('t4', 'Sarah & Michael Jenkins', 'Toronto, Canada', 5, 'December 2025', 'Memorable stay for our anniversary', 'From the warm welcome upon arrival to the authentic Ethiopian coffee tasting, everything was flawless. The location in 22 around Golagul made it so easy to get everywhere in the city.', 'Deluxe Room', 'APPROVED')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- -----------------------------------------------------------------------------
-- 10. Table: contact_messages
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `contact_messages`;
CREATE TABLE `contact_messages` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(100) DEFAULT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'NEW',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. Auxiliary Tables (table_reservations, spa_appointments, etc.)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `table_reservations`;
CREATE TABLE `table_reservations` (
  `id` VARCHAR(191) NOT NULL,
  `date` DATE NOT NULL,
  `time` VARCHAR(20) NOT NULL,
  `party_size` INT NOT NULL,
  `guest_name` VARCHAR(100) NOT NULL,
  `guest_phone` VARCHAR(100) NOT NULL,
  `guest_email` VARCHAR(191) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_table_res_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `spa_appointments`;
CREATE TABLE `spa_appointments` (
  `id` VARCHAR(191) NOT NULL,
  `service_id` VARCHAR(100) NOT NULL,
  `service_name` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `time` VARCHAR(20) NOT NULL,
  `client_name` VARCHAR(100) NOT NULL,
  `client_phone` VARCHAR(100) NOT NULL,
  `client_email` VARCHAR(191) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_spa_app_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `event_inquiries`;
CREATE TABLE `event_inquiries` (
  `id` VARCHAR(191) NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `target_date` DATE NOT NULL,
  `guests_count` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(100) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'NEW',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `dining_menu`;
CREATE TABLE `dining_menu` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `description` TEXT NOT NULL,
  `tag` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `spa_treatments`;
CREATE TABLE `spa_treatments` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `duration` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `description` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `promotions`;
CREATE TABLE `promotions` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `badge` VARCHAR(100) NOT NULL,
  `discount` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `inclusions` JSON NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `valid_until` VARCHAR(100) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `faqs`;
CREATE TABLE `faqs` (
  `id` VARCHAR(191) NOT NULL,
  `question` VARCHAR(255) NOT NULL,
  `answer` TEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_faqs_order` (`sort_order`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 18. Table: gallery_images
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `gallery_images`;
CREATE TABLE `gallery_images` (
  `id` VARCHAR(191) NOT NULL,
  `src` TEXT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'hotel',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_gallery_order` (`sort_order`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `gallery_images` (`id`, `src`, `title`, `category`, `sort_order`) VALUES
('gal-1', '/images/BO5A5779-scaled.jpg', 'Grand Exterior & Entrance', 'hotel', 1),
('gal-2', '/images/BO5A5826-scaled.jpg', 'Deluxe Suite Bedding', 'rooms', 2),
('gal-3', '/images/BO5A5821-scaled.jpg', 'Luxury Guest Room View', 'rooms', 3),
('gal-4', '/images/BO5A5957-scaled.jpg', 'Lounge & Dining Ambiance', 'hotel', 4),
('gal-5', '/images/BO5A5963-scaled.jpg', 'Cocktail Lounge & Bar', 'hotel', 5),
('gal-6', '/images/BO5A5977-scaled.jpg', 'Executive Meeting Room', 'hotel', 6),
('gal-7', '/images/BO5A5988-scaled.jpg', 'Relaxation Lounge', 'hotel', 7),
('gal-8', '/images/BO5A5900-scaled.jpg', 'Standard Room Setup', 'rooms', 8),
('gal-9', '/images/BO5A5992-scaled.jpg', 'Presidential Parlor', 'rooms', 9),
('gal-10', '/images/BO5A5989-scaled.jpg', 'En-suite Luxury Bath', 'rooms', 10),
('gal-11', '/images/BO5A5976-scaled.jpg', 'Bespoke Interior Details', 'hotel', 11),
('gal-12', '/images/BO5A5805-scaled.jpg', 'Culinary Hospitality', 'hotel', 12),
('gal-13', '/images/vikbooking/bo5a5902.jpg', 'Standard Room Warm Light', 'rooms', 13),
('gal-14', '/images/vikbooking/bo5a5878.jpg', 'Deluxe Master Suite', 'rooms', 14),
('gal-15', '/images/vikbooking/bo5a5832.jpg', 'Twin Bed Guest Room', 'rooms', 15)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `category`=VALUES(`category`), `src`=VALUES(`src`);

SET FOREIGN_KEY_CHECKS = 1;

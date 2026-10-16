import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment in priority order
for (const envFile of ['.env.production', '.env.local', '.env']) {
  const envPath = path.join(rootDir, envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const connectionString =
  process.env.DATABASE_URL || 'postgresql://tamrat@localhost:5432/grand_addis_db';

const isMysql = Boolean(
  process.env.DB_HOST ||
  process.env.DB_USER ||
  process.env.DB_USERNAME ||
  process.env.MYSQL_USER ||
  process.env.MYSQL_URL ||
  process.env.MYSQL_DATABASE_URL ||
  connectionString.startsWith('mysql://') ||
  connectionString.startsWith('mysql:')
);

function parseMysqlUrl(rawUrl) {
  try {
    const withoutScheme = (rawUrl || '').replace(/^mysql:\/\//i, '');
    const slashIdx = withoutScheme.indexOf('/');
    const pathAndQuery = slashIdx !== -1 ? withoutScheme.slice(slashIdx + 1) : '';
    const database = pathAndQuery.split('?')[0];

    const hostAndAuth = slashIdx !== -1 ? withoutScheme.slice(0, slashIdx) : withoutScheme;
    const lastAtIdx = hostAndAuth.lastIndexOf('@');

    let user, password, host, port;

    if (lastAtIdx !== -1) {
      const auth = hostAndAuth.slice(0, lastAtIdx);
      const hostPart = hostAndAuth.slice(lastAtIdx + 1);

      const firstColonIdx = auth.indexOf(':');
      if (firstColonIdx !== -1) {
        user = decodeURIComponent(auth.slice(0, firstColonIdx));
        password = decodeURIComponent(auth.slice(firstColonIdx + 1));
      } else {
        user = decodeURIComponent(auth);
      }

      const hostColonIdx = hostPart.lastIndexOf(':');
      if (hostColonIdx !== -1) {
        host = hostPart.slice(0, hostColonIdx);
        port = parseInt(hostPart.slice(hostColonIdx + 1), 10);
      } else {
        host = hostPart;
      }
    } else {
      const hostColonIdx = hostAndAuth.lastIndexOf(':');
      if (hostColonIdx !== -1) {
        host = hostAndAuth.slice(0, hostColonIdx);
        port = parseInt(hostAndAuth.slice(hostColonIdx + 1), 10);
      } else {
        host = hostAndAuth;
      }
    }

    if (host && host.includes('@')) {
      const parts = host.split('@');
      host = parts[parts.length - 1];
    }

    return {
      user,
      password,
      host,
      port: isNaN(port) ? undefined : port,
      database: database ? decodeURIComponent(database) : undefined,
    };
  } catch {
    return {};
  }
}

function getMysqlConnectionConfig() {
  const dbUser = process.env.DB_USER || process.env.DB_USERNAME || process.env.MYSQL_USER || process.env.MYSQL_USERNAME;
  const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS || process.env.MYSQL_PASSWORD || process.env.MYSQL_PASS;
  const dbHost = process.env.DB_HOST || process.env.MYSQL_HOST;
  const dbPort = parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10);
  const dbName = process.env.DB_NAME || process.env.DB_DATABASE || process.env.MYSQL_DATABASE || process.env.MYSQL_DB;
  const rawUrl = process.env.MYSQL_URL || process.env.MYSQL_DATABASE_URL || (connectionString.startsWith('mysql') ? connectionString : null);
  const parsedFromUrl = rawUrl ? parseMysqlUrl(rawUrl) : {};

  let finalHost = dbHost || parsedFromUrl.host;
  if (finalHost && finalHost.includes('@')) {
    const parts = finalHost.split('@');
    finalHost = parts[parts.length - 1];
  }
  const finalUser = dbUser || parsedFromUrl.user;
  const finalDatabase = dbName || parsedFromUrl.database;
  const finalPassword = dbPassword !== undefined ? dbPassword : parsedFromUrl.password;

  if (!finalHost || !finalUser || finalPassword === undefined || !finalDatabase) {
    throw new Error('MySQL credentials incomplete. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME, or MYSQL_URL / DATABASE_URL.');
  }

  return {
    host: finalHost,
    port: dbPort || 3306,
    user: finalUser,
    password: finalPassword,
    database: finalDatabase,
    multipleStatements: true,
  };
}

const SEED_ROOM_TYPES = [
  {
    id: 'rt-standard-double',
    slug: 'standard-double-room',
    name: 'Standard Double Room',
    category: 'Hotel Rooms',
    size: '28 m²',
    bedType: 'Queen Bed',
    view: 'City View',
    basePriceETB: 5800,
    basePriceUSD: 50,
    baseCapacity: 2,
    maxCapacity: 2,
    description: 'Refined comfort for business and leisure travelers. Features comfortable queen bed, ergonomic desk, blackout drapes, and modern en-suite marble bathroom.',
    amenities: ['Queen Bed', 'High-Speed Wi-Fi', 'Work Station', 'Satellite HD TV', 'Tea & Ethiopian Coffee Maker', '24/7 Room Service', 'Daily Housekeeping', 'Electronic Safe'],
    images: ['/images/vikbooking/bo5a5902.jpg', '/images/vikbooking/big_bo5a5894.jpg', '/images/vikbooking/big_bo5a5900.jpg', '/hotel_images/1760816082.webp'],
    aliases: ['standard-room', 'double-rooms', 'standard', '1'],
  },
  {
    id: 'rt-twin-deluxe',
    slug: 'twin-deluxe-room',
    name: 'Twin Deluxe Room',
    category: 'Hotel Rooms',
    size: '34 m²',
    bedType: 'Two Double Beds',
    view: 'City View Balcony',
    basePriceETB: 7200,
    basePriceUSD: 62,
    baseCapacity: 2,
    maxCapacity: 3,
    description: 'Two plush double beds ideal for colleagues, friends, or small families visiting Addis Ababa. Includes private balcony, modern workspace, and city views.',
    amenities: ['2 Double Beds', 'City View Balcony', 'High-speed Wi-Fi', 'Spacious Marble Bathroom', 'Complimentary Breakfast', 'Electric Kettle', 'In-Room Safe'],
    images: ['/images/vikbooking/bo5a5832.jpg', '/images/vikbooking/big_260bo5a5832.jpg', '/images/vikbooking/big_bo5a5852.jpg', '/hotel_images/1760816141.webp'],
    aliases: ['twin-room', 'twin-deluxe', '3'],
  },
  {
    id: 'rt-deluxe-king',
    slug: 'deluxe-king-room',
    name: 'Deluxe King Room',
    category: 'Hotel Rooms',
    size: '36 m²',
    bedType: 'King Size Bed',
    view: 'Panoramic City & Mountain View',
    basePriceETB: 8500,
    basePriceUSD: 75,
    baseCapacity: 2,
    maxCapacity: 3,
    description: 'Spacious luxury room featuring a plush king-sized bed, panoramic balcony with skyline view of Addis Ababa, marble bathroom with deep soaking tub and rainfall shower, and ergonomic work desk.',
    amenities: ['King Bed', 'Private Balcony', 'High-speed Wi-Fi', 'Rainfall Shower & Soaking Tub', 'Smart 55" 4K TV', 'Mini-bar & Refreshment Station', 'Complimentary Breakfast', '24/7 Room Service'],
    images: ['/images/vikbooking/bo5a5878.jpg', '/images/vikbooking/big_bo5a5868.jpg', '/images/BO5A5826-scaled.jpg', '/hotel_images/1760816140.webp'],
    aliases: ['deluxe-room', 'deluxe-king', '2'],
  },
  {
    id: 'rt-executive-suite',
    slug: 'executive-suite',
    name: 'Executive Suite with Balcony',
    category: 'Suites',
    size: '52 m²',
    bedType: 'Master King Bed + Daybed',
    view: 'Corner Skyline View',
    basePriceETB: 14000,
    basePriceUSD: 120,
    baseCapacity: 2,
    maxCapacity: 4,
    description: 'Distinct master bedroom with separate open-plan lounge, dining corner, dual private balconies, and dedicated concierge access.',
    amenities: ['Separate Living & Dining Area', 'Dual Private Balconies', 'Executive Lounge Access', 'Nespresso Coffee Machine', 'Jacuzzi & Rainfall Shower', 'Airport Transfer Included', 'Complimentary Laundry Service'],
    images: ['/images/vikbooking/bo5a5826.jpg', '/images/vikbooking/big_bo5a5821.jpg', '/images/BO5A5992-scaled.jpg', '/hotel_images/1760816082.webp'],
    aliases: ['executive', 'executive-suite', '4'],
  },
  {
    id: 'rt-presidential-suite',
    slug: 'presidential-suite',
    name: 'Grand Presidential Suite',
    category: 'Suites',
    size: '88 m²',
    bedType: 'Grand Emperor Bed',
    view: 'Panoramic 360° City View',
    basePriceETB: 28000,
    basePriceUSD: 240,
    baseCapacity: 2,
    maxCapacity: 5,
    description: 'The pinnacle of luxury in 22 Addis Ababa. Spans expansive master wing, lavish marble bathroom with jacuzzi, private boardroom/dining salon for 8 guests, and dedicated 24/7 butler service.',
    amenities: ['VIP Airport Chauffeur', '24/7 Dedicated Butler', 'Private Dining Salon', 'Oversized Jacuzzi & Steam Shower', 'Bang & Olufsen Sound System', 'Private Bar with Curated Wines', 'Panoramic Wrap-around Balcony'],
    images: ['/images/BO5A5992-scaled.jpg', '/images/BO5A5826-scaled.jpg', '/images/BO5A5989-scaled.jpg', '/images/BO5A5976-scaled.jpg'],
    aliases: ['presidential', 'presidential-suite', '5'],
  },
  {
    id: 'rt-deluxe-twin',
    slug: 'deluxe-twin-room',
    name: 'Deluxe Twin Room',
    category: 'Hotel Rooms',
    size: '34 m²',
    bedType: 'Two Twin Beds',
    view: 'City View',
    basePriceETB: 7500,
    basePriceUSD: 65,
    baseCapacity: 2,
    maxCapacity: 3,
    description: 'Modern twin room designed for comfort and connectivity, with two twin beds, premium bedding, and en-suite bath.',
    amenities: ['Two Twin Beds', 'High-Speed Wi-Fi', 'Work Station', 'Satellite HD TV', 'Coffee/Tea Maker', '24/7 Room Service'],
    images: ['/images/vikbooking/bo5a5832.jpg', '/images/vikbooking/big_260bo5a5832.jpg', '/hotel_images/1760816141.webp'],
    aliases: ['deluxe-twin', 'twin-beds', '6'],
  },
];

const SEED_PHYSICAL_ROOMS = [
  { id: 'rm-101', roomNumber: '101', floor: 1, roomTypeId: 'rt-standard-double' },
  { id: 'rm-102', roomNumber: '102', floor: 1, roomTypeId: 'rt-standard-double' },
  { id: 'rm-103', roomNumber: '103', floor: 1, roomTypeId: 'rt-standard-double' },
  { id: 'rm-104', roomNumber: '104', floor: 1, roomTypeId: 'rt-standard-double' },
  { id: 'rm-105', roomNumber: '105', floor: 1, roomTypeId: 'rt-standard-double' },
  { id: 'rm-201', roomNumber: '201', floor: 2, roomTypeId: 'rt-twin-deluxe' },
  { id: 'rm-202', roomNumber: '202', floor: 2, roomTypeId: 'rt-twin-deluxe' },
  { id: 'rm-203', roomNumber: '203', floor: 2, roomTypeId: 'rt-twin-deluxe' },
  { id: 'rm-204', roomNumber: '204', floor: 2, roomTypeId: 'rt-twin-deluxe' },
  { id: 'rm-205', roomNumber: '205', floor: 2, roomTypeId: 'rt-twin-deluxe' },
  { id: 'rm-301', roomNumber: '301', floor: 3, roomTypeId: 'rt-deluxe-king' },
  { id: 'rm-302', roomNumber: '302', floor: 3, roomTypeId: 'rt-deluxe-king' },
  { id: 'rm-303', roomNumber: '303', floor: 3, roomTypeId: 'rt-deluxe-king' },
  { id: 'rm-304', roomNumber: '304', floor: 3, roomTypeId: 'rt-deluxe-king' },
  { id: 'rm-305', roomNumber: '305', floor: 3, roomTypeId: 'rt-deluxe-king' },
  { id: 'rm-401', roomNumber: '401', floor: 4, roomTypeId: 'rt-executive-suite' },
  { id: 'rm-402', roomNumber: '402', floor: 4, roomTypeId: 'rt-executive-suite' },
  { id: 'rm-403', roomNumber: '403', floor: 4, roomTypeId: 'rt-executive-suite' },
  { id: 'rm-501', roomNumber: '501', floor: 5, roomTypeId: 'rt-presidential-suite' },
];

const SEED_GALLERY_IMAGES = [
  { src: '/images/BO5A5779-scaled.jpg', title: 'Grand Exterior & Entrance', category: 'hotel' },
  { src: '/images/BO5A5826-scaled.jpg', title: 'Deluxe Suite Bedding', category: 'rooms' },
  { src: '/images/BO5A5821-scaled.jpg', title: 'Luxury Guest Room View', category: 'rooms' },
  { src: '/images/BO5A5957-scaled.jpg', title: 'Lounge & Dining Ambiance', category: 'hotel' },
  { src: '/images/BO5A5963-scaled.jpg', title: 'Cocktail Lounge & Bar', category: 'hotel' },
  { src: '/images/BO5A5977-scaled.jpg', title: 'Executive Meeting Room', category: 'hotel' },
  { src: '/images/BO5A5988-scaled.jpg', title: 'Relaxation Lounge', category: 'hotel' },
  { src: '/images/BO5A5900-scaled.jpg', title: 'Standard Room Setup', category: 'rooms' },
  { src: '/images/BO5A5992-scaled.jpg', title: 'Presidential Parlor', category: 'rooms' },
  { src: '/images/BO5A5989-scaled.jpg', title: 'En-suite Luxury Bath', category: 'rooms' },
  { src: '/images/BO5A5976-scaled.jpg', title: 'Bespoke Interior Details', category: 'hotel' },
  { src: '/images/BO5A5805-scaled.jpg', title: 'Culinary Hospitality', category: 'hotel' },
  { src: '/images/vikbooking/bo5a5902.jpg', title: 'Standard Room Warm Light', category: 'rooms' },
  { src: '/images/vikbooking/bo5a5878.jpg', title: 'Deluxe Master Suite', category: 'rooms' },
  { src: '/images/vikbooking/bo5a5832.jpg', title: 'Twin Bed Guest Room', category: 'rooms' },
];

const SEED_EXPERIENCES = [
  { id: 'exp1', title: 'Traditional Ethiopian Coffee Ceremony', subtitle: 'A sensory journey through the birthplace of Arabica', category: 'Culture', duration: '1.5 Hours', image: '/images/BO5A5779-scaled.jpg', description: 'Immerse yourself in centuries of tradition. Watch our coffee masters wash, roast, grind, and brew beans over charcoal embers in a clay jebena, accompanied by fragrant incense and traditional snacks.', highlights: ['Clay jebena brewing', 'Freshly roasted beans tasting', 'Cultural storytelling', 'Traditional snacks & popcorn'] },
  { id: 'exp2', title: 'Addis Ababa City & Heritage Excursion', subtitle: 'Explore history, culture, and panoramic views', category: 'City Tour', duration: 'Half Day (4-5 Hours)', image: '/images/BO5A5957-scaled.jpg', description: 'Discover the best of Addis Ababa with our private chauffeured tour. Visit the National Museum of Ethiopia (home of 3.2-million-year-old Lucy), Holy Trinity Cathedral, and the breathtaking viewpoints from Mount Entoto.', highlights: ['National Museum & Lucy', 'Mount Entoto scenic panorama', 'Holy Trinity Cathedral', 'Comfortable luxury transport'] },
  { id: 'exp3', title: 'Chef-Led Culinary Masterclass', subtitle: 'Learn the secrets of authentic Ethiopian gastronomy', category: 'Gastronomy', duration: '2.5 Hours', image: '/images/BO5A5805-scaled.jpg', description: 'Join our Executive Chef in our hotel kitchen. Learn how to ferment teff batter for injera, balance traditional berbere spices, and cook aromatic tibs and vegetarian shiro stews.', highlights: ['Hands-on cooking', 'Injera making demonstration', 'Spice blending secrets', 'Tasting dinner with wine'] },
  { id: 'exp4', title: 'Highland Wellness & Fitness Escape', subtitle: 'Re-energize your body at 2,300 meters altitude', category: 'Wellness', duration: '2 Hours', image: '/images/BO5A5977-scaled.jpg', description: 'Harness the clean highland air of Addis Ababa. Enjoy guided morning rooftop yoga or circuit training in our fitness suite, followed by steam recovery and freshly blended smoothies.', highlights: ['Sunrise yoga sessions', 'Cardio & strength gym access', 'Steam & sauna recovery', 'Detox fresh smoothies'] },
];

const SEED_PROMOTIONS = [
  { id: 'promo1', title: 'Member Exclusive Stay', badge: 'Best Value', discount: 'Save 15%', description: 'Book direct as a Grand Addis member and unlock 15% off room rates, complimentary high-speed Wi-Fi, late check-out upon availability, and 24-hour fitness access.', inclusions: ['15% discount on all room categories', 'Daily complimentary breakfast buffet', 'Late check-out until 15:00 (subject to availability)', 'Complimentary airport pickup on bookings of 3+ nights'], code: 'GRANDMEMBER15', valid_until: 'December 31, 2026' },
  { id: 'promo2', title: 'Dinner, Bed & Breakfast Package', badge: 'Popular', discount: 'Full Board Perks', description: 'A seamless, fully flexible package combining luxurious overnight accommodation, hearty breakfast, and a 3-course dinner from our restaurant set menu.', inclusions: ['Luxury room or suite accommodation', 'Full buffet breakfast daily', 'Three-course evening dinner for two resident adults', 'High-speed Wi-Fi in rooms and public spaces'], code: 'DINNERBED26', valid_until: 'Ongoing' },
  { id: 'promo3', title: 'Weekend Rebalance Retreat', badge: 'Weekend Special', discount: 'Save 20%', description: 'Designed for quick weekend escapes and couples. Enjoy complimentary bottle of sparkling wine on arrival, 30% discount on spa treatments, and leisurely Sunday brunch.', inclusions: ['Welcome sparkling wine & fresh fruit basket', '30% discount on all spa treatments', 'Sunday late checkout until 16:00', 'Complimentary access to steam and sauna'], code: 'WEEKENDREBALANCE', valid_until: 'Year-Round (Fri-Sun)' },
];

const SEED_FAQS = [
  { id: 'f1', question: 'How do I reserve a room at Grand Addis Hotel?', answer: 'Reservations can be made directly through our online booking engine on this website, by calling our 24/7 reservations desk at +251 116 672 828, or by emailing reservations@egrandaddishotel.com. You will receive an instant confirmation voucher.', category: 'reservations', sort_order: 1 },
  { id: 'f2', question: 'What are the check-in and check-out times?', answer: 'Check-in is from 14:00 (2:00 PM) onwards, and check-out is until 12:00 (12:00 PM). Early check-in or late check-out is subject to room availability upon arrival; you are always welcome to store luggage in our secure room and enjoy the lounge and dining areas.', category: 'checkin', sort_order: 2 },
  { id: 'f3', question: 'Do you offer airport transportation from Bole International Airport?', answer: 'Yes! We offer convenient airport pick-up and drop-off services. Bole International Airport (ADD) is approximately 10-15 minutes away (5.2 km). You can add airport transfer during your online booking or contact our concierge prior to arrival with your flight details.', category: 'services', sort_order: 3 },
  { id: 'f4', question: 'What payment methods are accepted at the hotel?', answer: 'We accept major international credit and debit cards (Visa, MasterCard, American Express), international bank transfers, and local Ethiopian payment methods including cash in ETB, Telebirr, and CBE Birr.', category: 'payment', sort_order: 4 },
  { id: 'f5', question: 'What is your cancellation and modification policy?', answer: 'Flexible rate reservations can be cancelled or modified free of charge up to 24 hours prior to scheduled check-in date. Promotional and non-refundable rates may carry specific conditions indicated during booking.', category: 'reservations', sort_order: 5 },
  { id: 'f6', question: 'Is high-speed Wi-Fi available throughout the hotel?', answer: 'Yes, complimentary high-speed fiber-optic Wi-Fi is available across all guest rooms, suites, restaurants, conference halls, and lobby areas.', category: 'services', sort_order: 6 },
  { id: 'f7', question: 'Are dining and room service available 24/7?', answer: 'Our main restaurant serves breakfast from 06:30 to 10:30, lunch from 12:00 to 15:00, and dinner from 18:30 to 22:30. An in-room dining night menu is available 24 hours a day for your convenience.', category: 'services', sort_order: 7 },
];

const SEED_DINING = [
  { id: 'm1', name: 'Chicken Parmigiana Bites', category: 'starter', price: 49, description: 'Green roman salad, chicken breast, beetroot, extra virgin olive oil, creamy avocado, crisp lettuce.', tag: "Chef's Choice" },
  { id: 'm2', name: 'Pasta with Pesto Cream Sauce', category: 'starter', price: 17, description: 'Handmade fresh tagliatelle, basil pesto, pine nuts, aged parmesan crisps, sun-dried cherry tomatoes.', tag: null },
  { id: 'm3', name: 'Blueberry Zucchini Artisan Bread', category: 'starter', price: 40, description: 'Warm freshly baked zucchini bread, wild blueberry compote, whipped honey truffle butter.', tag: null },
  { id: 'm4', name: 'Crispy Calamari Fritti', category: 'starter', price: 24, description: 'Tender squid rings, smoked paprika dust, lemon caper aioli, fresh garden herbs.', tag: null },
  { id: 'm5', name: 'Traditional Sambusa Trio', category: 'starter', price: 14, description: 'Golden pastry pockets stuffed with seasoned spiced lentils, minced beef, and garden scallions served with sweet awaze dip.', tag: 'Local Favorite' },
  { id: 'm6', name: 'Prime Grilled Beef Tenderloin', category: 'main', price: 52, description: 'Grass-fed beef fillet, homemade potato hash, white cabbage purée, roasted baby carrots, rich rosemary marjoram sauce.', tag: 'Signature' },
  { id: 'm7', name: 'Grand Addis Special Tibs', category: 'ethiopian', price: 32, description: 'Sautéed tender beef cubes with rosemary, sweet onions, jalapeño peppers, clarified spiced butter (niter kibbeh), served on freshly baked teff injera.', tag: 'Authentic Ethiopian' },
  { id: 'm8', name: 'Doro Wot Feast', category: 'ethiopian', price: 36, description: 'Traditional slow-cooked chicken stew infused with aromatic berbere spice blend, boiled farm egg, and ayib cottage cheese.', tag: 'Heritage Special' },
  { id: 'm9', name: 'Pan-Seared Lake Tana Tilapia', category: 'main', price: 38, description: 'Fresh tilapia fillet, saffron-infused pilaf rice, steamed asparagus, garlic-caper white wine emulsion.', tag: null },
  { id: 'm10', name: 'Wild Mushroom Truffle Risotto', category: 'main', price: 28, description: 'Arborio rice, porcini and oyster mushrooms, shaved parmesan reggiano, white truffle oil essence.', tag: 'Vegetarian' },
  { id: 'm11', name: 'No Bake S’mores Cheesecake', category: 'dessert', price: 26, description: 'Toasted graham cracker crust, silky smoked chocolate ganache, torch-browned marshmallow cream.', tag: 'Sweet Indulgence' },
  { id: 'm12', name: 'Cannoli Stuffed French Toast', category: 'dessert', price: 15, description: 'Brioche soaked in spiced custard, sweet ricotta citrus filling, pistachio crunch, dark chocolate drizzle.', tag: null },
  { id: 'm13', name: 'Caramelized Plum & Curd Tart', category: 'dessert', price: 18, description: 'Plum sauce with plum brandy, curd chips, caramelized black plums, poppy seed artisanal gelato.', tag: null },
  { id: 'm14', name: 'Ethiopian Sidama Coffee Tiramisu', category: 'dessert', price: 19, description: 'Savoiardi ladyfingers soaked in freshly pulled single-origin Sidama espresso, mascarpone mousse, raw cacao.', tag: "Chef's Special" },
  { id: 'm15', name: 'Traditional Ethiopian Buna Ceremony', category: 'beverage', price: 8, description: 'Freshly roasted Ethiopian coffee beans brewed in a traditional clay jebena pot, accompanied by frankincense aromas and popped corn.', tag: 'Cultural Highlight' },
  { id: 'm16', name: 'Abyssinian Sunset Cocktail', category: 'beverage', price: 16, description: 'Aged rum, passionfruit nectar, fresh lime juice, honey ginger syrup, splash of sparkling soda.', tag: null },
  { id: 'm17', name: 'Freshly Pressed Tropical Juices', category: 'beverage', price: 9, description: 'Layers of fresh avocado, mango, papaya, and strawberry puree with fresh lime wedge (Spriss).', tag: null },
];

const SEED_SPA = [
  { id: 'sp1', name: 'Grand Signature Aromatherapy Massage', category: 'Massage Therapy', duration: '60 / 90 mins', price: 65, description: 'A soothing full-body massage employing cold-pressed organic botanical oils, rhythmic strokes, and acupressure to release muscle tension and restore inner calm.' },
  { id: 'sp2', name: 'Deep Tissue Muscle Recovery', category: 'Massage Therapy', duration: '60 / 90 mins', price: 75, description: 'Targeted deep-layer manipulation designed for tired travelers and fitness enthusiasts, focusing on posture alignment, chronic stiffness, and revitalization.' },
  { id: 'sp3', name: 'Thermal Steam & Eucalyptus Sauna Ritual', category: 'Hydrothermal Sanctuary', duration: '45 mins', price: 35, description: 'Detoxifying private thermal steam bath infused with highland eucalyptus leaves, followed by cold mist shower and herbal infusion teas.' },
  { id: 'sp4', name: 'Highland Coffee Body Polish', category: 'Body Scrubs & Wraps', duration: '50 mins', price: 55, description: 'Exfoliating scrub crafted from freshly ground Yirgacheffe coffee beans, brown sugar, and rich shea butter, leaving your skin luminous and silk-soft.' },
  { id: 'sp5', name: 'Radiance Botanical Facial', category: 'Skin Care', duration: '60 mins', price: 60, description: 'Customized deep cleansing facial featuring natural antioxidant serums, lymphatic drainage massage, and cooling aloe-collagen mask.' },
];

const SEED_TESTIMONIALS = [
  { id: 't1', name: 'Marcus Vance', location: 'London, UK', rating: 5, date: 'October 2026', title: 'Exceptional Luxury in Addis Ababa', comment: 'From the warm greeting at Bole Airport to the impeccable suite on the 4th floor, Grand Addis Hotel delivered perfection. The Ethiopian coffee ceremony was truly unforgettable.', room_type: 'Executive Suite with Balcony', status: 'APPROVED' },
  { id: 't2', name: 'Sarah Lin', location: 'Geneva, Switzerland', rating: 5, date: 'September 2026', title: 'Perfect Business & Leisure Base', comment: 'Super fast fiber-optic Wi-Fi, incredibly quiet rooms, and the finest hospitality. The dining experience was five-star.', room_type: 'Deluxe King Room', status: 'APPROVED' },
  { id: 't3', name: 'Dawit Bekele', location: 'Addis Ababa / Diaspora', rating: 5, date: 'September 2026', title: 'Proud of This Level of Hospitality', comment: 'World-class comfort right in the vibrant heart of 22. Highly recommended for international travelers and local staycations alike.', room_type: 'Grand Presidential Suite', status: 'APPROVED' },
];

const MYSQL_COLUMN_MIGRATIONS = [
  // room_types
  "ALTER TABLE \`room_types\` ADD COLUMN \`size\` VARCHAR(50) DEFAULT '32 m²'",
  "ALTER TABLE \`room_types\` ADD COLUMN \`bedType\` VARCHAR(100) DEFAULT 'King Bed'",
  "ALTER TABLE \`room_types\` ADD COLUMN \`view\` VARCHAR(100) DEFAULT 'City View'",
  "ALTER TABLE \`room_types\` ADD COLUMN \`category\` VARCHAR(100) DEFAULT 'Hotel Rooms'",
  "ALTER TABLE \`room_types\` ADD COLUMN \`featured\` TINYINT(1) DEFAULT 1",
  "ALTER TABLE \`room_types\` ADD COLUMN \`aliases\` JSON DEFAULT NULL",

  // reservations
  "ALTER TABLE \`reservations\` ADD COLUMN \`adultsCount\` INT NOT NULL DEFAULT 1",
  "ALTER TABLE \`reservations\` ADD COLUMN \`childrenCount\` INT NOT NULL DEFAULT 0",
  "ALTER TABLE \`reservations\` ADD COLUMN \`expiresAt\` DATETIME(3) DEFAULT NULL",
  "ALTER TABLE \`reservations\` ADD COLUMN \`subtotal\` DECIMAL(10,2) NOT NULL DEFAULT 0.00",
  "ALTER TABLE \`reservations\` ADD COLUMN \`taxAmount\` DECIMAL(10,2) NOT NULL DEFAULT 0.00",
  "ALTER TABLE \`reservations\` ADD COLUMN \`totalAmount\` DECIMAL(10,2) NOT NULL DEFAULT 0.00",
  "ALTER TABLE \`reservations\` ADD COLUMN \`roomId\` VARCHAR(191) DEFAULT NULL",
  "ALTER TABLE \`reservations\` ADD COLUMN \`isDateExtended\` TINYINT(1) DEFAULT 0",
  "ALTER TABLE \`reservations\` ADD COLUMN \`dateChangeNote\` TEXT DEFAULT NULL",

  // payments
  "ALTER TABLE \`payments\` ADD COLUMN \`reservationId\` VARCHAR(191) DEFAULT NULL",
  "ALTER TABLE \`payments\` ADD COLUMN \`paidAt\` DATETIME(3) DEFAULT NULL",
  "ALTER TABLE \`payments\` ADD COLUMN \`rawPayload\` JSON DEFAULT NULL",

  // promotions
  "ALTER TABLE \`promotions\` ADD COLUMN \`badge\` VARCHAR(100) NOT NULL DEFAULT 'Offer'",
  "ALTER TABLE \`promotions\` ADD COLUMN \`discount\` VARCHAR(100) NOT NULL DEFAULT '10% Off'",
  "ALTER TABLE \`promotions\` ADD COLUMN \`inclusions\` JSON DEFAULT NULL",
  "ALTER TABLE \`promotions\` ADD COLUMN \`code\` VARCHAR(100) NOT NULL DEFAULT 'PROMO'",
  "ALTER TABLE \`promotions\` MODIFY COLUMN \`valid_until\` VARCHAR(100) NOT NULL DEFAULT 'Ongoing'",

  // dining_menu
  "ALTER TABLE \`dining_menu\` ADD COLUMN \`price\` DECIMAL(10,2) NOT NULL DEFAULT 25.00",
  "ALTER TABLE \`dining_menu\` ADD COLUMN \`tag\` VARCHAR(50) DEFAULT NULL",

  // spa_treatments
  "ALTER TABLE \`spa_treatments\` ADD COLUMN \`price\` DECIMAL(10,2) NOT NULL DEFAULT 50.00",

  // table_reservations
  "ALTER TABLE \`table_reservations\` ADD COLUMN \`party_size\` INT NOT NULL DEFAULT 2",
  "ALTER TABLE \`table_reservations\` ADD COLUMN \`guest_name\` VARCHAR(255) DEFAULT NULL",
  "ALTER TABLE \`table_reservations\` ADD COLUMN \`guest_phone\` VARCHAR(100) DEFAULT NULL",
  "ALTER TABLE \`table_reservations\` ADD COLUMN \`guest_email\` VARCHAR(191) DEFAULT NULL",
  "ALTER TABLE \`table_reservations\` ADD COLUMN \`notes\` TEXT DEFAULT NULL",

  // spa_appointments
  "ALTER TABLE \`spa_appointments\` ADD COLUMN \`service_id\` VARCHAR(191) DEFAULT NULL",
  "ALTER TABLE \`spa_appointments\` ADD COLUMN \`service_name\` VARCHAR(255) DEFAULT 'Spa Treatment'",
  "ALTER TABLE \`spa_appointments\` ADD COLUMN \`client_name\` VARCHAR(255) DEFAULT NULL",
  "ALTER TABLE \`spa_appointments\` ADD COLUMN \`client_phone\` VARCHAR(100) DEFAULT NULL",
  "ALTER TABLE \`spa_appointments\` ADD COLUMN \`client_email\` VARCHAR(191) DEFAULT NULL",

  // event_inquiries
  "ALTER TABLE \`event_inquiries\` ADD COLUMN \`target_date\` DATE DEFAULT NULL",
  "ALTER TABLE \`event_inquiries\` ADD COLUMN \`guests_count\` VARCHAR(50) NOT NULL DEFAULT '50'",
  "ALTER TABLE \`event_inquiries\` ADD COLUMN \`details\` TEXT DEFAULT NULL",

  // experiences
  "ALTER TABLE \`experiences\` ADD COLUMN \`subtitle\` VARCHAR(255) DEFAULT NULL",

  // gallery_images
  "ALTER TABLE \`gallery_images\` ADD COLUMN \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)",

  // hotel_settings
  "ALTER TABLE \`hotel_settings\` MODIFY COLUMN \`value\` LONGTEXT NOT NULL",
];

async function seed() {
  console.log('\n============================================================');
  console.log('GRAND ADDIS HOTEL - IDEMPOTENT DATABASE SEED');
  console.log(`Detected Engine: ${isMysql ? 'MySQL / MariaDB' : 'PostgreSQL'}`);
  console.log('(Customer bookings, reservations, and guest data are preserved)');
  console.log('============================================================\n');

  if (isMysql) {
    let connConfig;
    try {
      connConfig = getMysqlConnectionConfig();
    } catch (err) {
      console.warn('⚠️ Warning: MySQL config not found. Skipping MySQL seed:', err.message);
      return;
    }

    let conn;
    try {
      conn = await mysql.createConnection(connConfig);
      console.log('✓ Connected to MySQL database.\n');

      // Ensure all schema columns exist before seeding
      for (const migration of MYSQL_COLUMN_MIGRATIONS) {
        try {
          await conn.query(migration);
        } catch {
          // Column already exists or already modified
        }
      }

      // 1. Hotel Settings
      await conn.query(`
        INSERT INTO \`hotel_settings\` (\`key\`, \`value\`) VALUES
        ('usd_to_etb_rate', '189'),
        ('hotel_name', 'Grand Addis Hotel'),
        ('hotel_address', '22 Around Golagul, behind Meklit Building, Addis Ababa, Ethiopia'),
        ('hotel_phone', '+251 116 672 828'),
        ('hotel_email', 'reservations@egrandaddishotel.com')
        ON DUPLICATE KEY UPDATE \`key\` = \`key\`;
      `);
      console.log('✓ Hotel settings verified.');

      // 2. Room Types (only if empty to protect customizations)
      const [rtRows] = await conn.query(`SELECT COUNT(*) as count FROM \`room_types\``);
      if (rtRows[0]?.count === 0) {
        for (const r of SEED_ROOM_TYPES) {
          await conn.query(
            `INSERT INTO \`room_types\` (
              \`id\`, \`slug\`, \`name\`, \`description\`, \`baseCapacity\`, \`maxCapacity\`,
              \`amenities\`, \`images\`, \`basePriceETB\`, \`basePriceUSD\`, \`size\`,
              \`bedType\`, \`view\`, \`category\`, \`featured\`, \`aliases\`, \`createdAt\`, \`updatedAt\`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW());`,
            [
              r.id, r.slug, r.name, r.description, r.baseCapacity, r.maxCapacity,
              JSON.stringify(r.amenities), JSON.stringify(r.images), r.basePriceETB, r.basePriceUSD,
              r.size, r.bedType, r.view, r.category, JSON.stringify(r.aliases),
            ]
          );
        }
        console.log(`✓ ${SEED_ROOM_TYPES.length} Room types seeded.`);
      } else {
        console.log(`✓ Room types already exist (${rtRows[0]?.count} records).`);
      }

      // 3. Physical Rooms Inventory (only if empty)
      const [rmRows] = await conn.query(`SELECT COUNT(*) as count FROM \`rooms\``);
      if (rmRows[0]?.count === 0) {
        for (const rm of SEED_PHYSICAL_ROOMS) {
          await conn.query(
            `INSERT INTO \`rooms\` (\`id\`, \`roomNumber\`, \`floor\`, \`status\`, \`roomTypeId\`, \`createdAt\`, \`updatedAt\`)
             VALUES (?, ?, ?, 'AVAILABLE', ?, NOW(), NOW());`,
            [rm.id, rm.roomNumber, rm.floor, rm.roomTypeId]
          );
        }
        console.log(`✓ ${SEED_PHYSICAL_ROOMS.length} Physical rooms seeded.`);
      } else {
        console.log(`✓ Rooms inventory already exists (${rmRows[0]?.count} records).`);
      }

      // 4. Gallery Images (only if empty)
      const [galRows] = await conn.query(`SELECT COUNT(*) as count FROM \`gallery_images\``);
      if (galRows[0]?.count === 0) {
        for (let i = 0; i < SEED_GALLERY_IMAGES.length; i++) {
          const item = SEED_GALLERY_IMAGES[i];
          await conn.query(
            `INSERT INTO \`gallery_images\` (\`id\`, \`src\`, \`title\`, \`category\`, \`sort_order\`)
             VALUES (?, ?, ?, ?, ?);`,
            [`gal-${i + 1}`, item.src, item.title, item.category, i + 1]
          );
        }
        console.log(`✓ ${SEED_GALLERY_IMAGES.length} Gallery images seeded.`);
      } else {
        console.log(`✓ Gallery images already exist (${galRows[0]?.count} records).`);
      }

      // 5. Experiences (only if empty)
      const [expRows] = await conn.query(`SELECT COUNT(*) as count FROM \`experiences\``);
      if (expRows[0]?.count === 0) {
        for (const e of SEED_EXPERIENCES) {
          await conn.query(
            `INSERT INTO \`experiences\` (\`id\`, \`title\`, \`subtitle\`, \`category\`, \`duration\`, \`image\`, \`description\`, \`highlights\`)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [e.id, e.title, e.subtitle, e.category, e.duration, e.image, e.description, JSON.stringify(e.highlights)]
          );
        }
        console.log(`✓ ${SEED_EXPERIENCES.length} Experiences seeded.`);
      } else {
        console.log(`✓ Experiences already exist (${expRows[0]?.count} records).`);
      }

      // 6. Promotions (only if empty)
      const [promoRows] = await conn.query(`SELECT COUNT(*) as count FROM \`promotions\``);
      if (promoRows[0]?.count === 0) {
        for (const p of SEED_PROMOTIONS) {
          await conn.query(
            `INSERT INTO \`promotions\` (\`id\`, \`title\`, \`badge\`, \`discount\`, \`description\`, \`inclusions\`, \`code\`, \`valid_until\`)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [p.id, p.title, p.badge, p.discount, p.description, JSON.stringify(p.inclusions), p.code, p.valid_until]
          );
        }
        console.log(`✓ ${SEED_PROMOTIONS.length} Promotions seeded.`);
      } else {
        console.log(`✓ Promotions already exist (${promoRows[0]?.count} records).`);
      }

      // 7. FAQs (only if empty)
      const [faqRows] = await conn.query(`SELECT COUNT(*) as count FROM \`faqs\``);
      if (faqRows[0]?.count === 0) {
        for (const f of SEED_FAQS) {
          await conn.query(
            `INSERT INTO \`faqs\` (\`id\`, \`question\`, \`answer\`, \`category\`, \`sort_order\`)
             VALUES (?, ?, ?, ?, ?);`,
            [f.id, f.question, f.answer, f.category, f.sort_order]
          );
        }
        console.log(`✓ ${SEED_FAQS.length} FAQs seeded.`);
      } else {
        console.log(`✓ FAQs already exist (${faqRows[0]?.count} records).`);
      }

      // 8. Dining Menu (only if empty)
      const [menuRows] = await conn.query(`SELECT COUNT(*) as count FROM \`dining_menu\``);
      if (menuRows[0]?.count === 0) {
        for (const m of SEED_DINING) {
          await conn.query(
            `INSERT INTO \`dining_menu\` (\`id\`, \`name\`, \`category\`, \`price\`, \`description\`, \`tag\`)
             VALUES (?, ?, ?, ?, ?, ?);`,
            [m.id, m.name, m.category, m.price, m.description, m.tag]
          );
        }
        console.log(`✓ ${SEED_DINING.length} Dining menu items seeded.`);
      } else {
        console.log(`✓ Dining menu already exists (${menuRows[0]?.count} records).`);
      }

      // 9. Spa Treatments (only if empty)
      const [spaRows] = await conn.query(`SELECT COUNT(*) as count FROM \`spa_treatments\``);
      if (spaRows[0]?.count === 0) {
        for (const s of SEED_SPA) {
          await conn.query(
            `INSERT INTO \`spa_treatments\` (\`id\`, \`name\`, \`category\`, \`duration\`, \`price\`, \`description\`)
             VALUES (?, ?, ?, ?, ?, ?);`,
            [s.id, s.name, s.category, s.duration, s.price, s.description]
          );
        }
        console.log(`✓ ${SEED_SPA.length} Spa treatments seeded.`);
      } else {
        console.log(`✓ Spa treatments already exist (${spaRows[0]?.count} records).`);
      }

      // 10. Testimonials (only if empty)
      const [testRows] = await conn.query(`SELECT COUNT(*) as count FROM \`testimonials\``);
      if (testRows[0]?.count === 0) {
        for (const t of SEED_TESTIMONIALS) {
          await conn.query(
            `INSERT INTO \`testimonials\` (\`id\`, \`name\`, \`location\`, \`rating\`, \`date\`, \`title\`, \`comment\`, \`room_type\`, \`status\`)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [t.id, t.name, t.location, t.rating, t.date, t.title, t.comment, t.room_type, t.status]
          );
        }
        console.log(`✓ ${SEED_TESTIMONIALS.length} Testimonials seeded.`);
      } else {
        console.log(`✓ Testimonials already exist (${testRows[0]?.count} records).`);
      }

      console.log('\n✓ MySQL Database seeding completed successfully!\n');
    } catch (err) {
      console.error('✗ Seed error on MySQL:', err.message || err);
      process.exit(1);
    } finally {
      if (conn) await conn.end();
    }
  } else {
    // PostgreSQL Seeding
    const pool = new Pool({ connectionString });
    try {
      const client = await pool.connect();
      console.log('✓ Connected to PostgreSQL database.\n');

      // 1. Hotel Settings
      await client.query(`
        INSERT INTO hotel_settings (key, value) VALUES
        ('usd_to_etb_rate', '189'),
        ('hotel_name', 'Grand Addis Hotel'),
        ('hotel_address', '22 Around Golagul, behind Meklit Building, Addis Ababa, Ethiopia'),
        ('hotel_phone', '+251 116 672 828'),
        ('hotel_email', 'reservations@egrandaddishotel.com')
        ON CONFLICT (key) DO NOTHING;
      `);
      console.log('✓ Hotel settings verified.');

      // 2. Room Types (only if empty)
      const rtRes = await client.query(`SELECT COUNT(*) as count FROM room_types`);
      if (parseInt(rtRes.rows[0]?.count || '0', 10) === 0) {
        for (const r of SEED_ROOM_TYPES) {
          await client.query(
            `INSERT INTO room_types (
              id, slug, name, description, "baseCapacity", "maxCapacity",
              amenities, images, "basePriceETB", "basePriceUSD", size,
              "bedType", view, category, featured, aliases, "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, $15, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;`,
            [
              r.id, r.slug, r.name, r.description, r.baseCapacity, r.maxCapacity,
              r.amenities, r.images, r.basePriceETB, r.basePriceUSD,
              r.size, r.bedType, r.view, r.category, r.aliases,
            ]
          );
        }
        console.log(`✓ ${SEED_ROOM_TYPES.length} Room types seeded.`);
      } else {
        console.log(`✓ Room types already exist (${rtRes.rows[0]?.count} records).`);
      }

      // 3. Physical Rooms (only if empty)
      const rmRes = await client.query(`SELECT COUNT(*) as count FROM rooms`);
      if (parseInt(rmRes.rows[0]?.count || '0', 10) === 0) {
        for (const rm of SEED_PHYSICAL_ROOMS) {
          await client.query(
            `INSERT INTO rooms (id, "roomNumber", floor, status, "roomTypeId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, 'AVAILABLE', $4, NOW(), NOW())
             ON CONFLICT (id) DO NOTHING;`,
            [rm.id, rm.roomNumber, rm.floor, rm.roomTypeId]
          );
        }
        console.log(`✓ ${SEED_PHYSICAL_ROOMS.length} Physical rooms seeded.`);
      } else {
        console.log(`✓ Rooms inventory already exists (${rmRes.rows[0]?.count} records).`);
      }

      // 4. Gallery Images (only if empty)
      const galCount = await client.query(`SELECT COUNT(*) as count FROM gallery_images`);
      if (parseInt(galCount.rows[0].count, 10) === 0) {
        for (let i = 0; i < SEED_GALLERY_IMAGES.length; i++) {
          const item = SEED_GALLERY_IMAGES[i];
          await client.query(
            `INSERT INTO gallery_images (id, src, title, category, sort_order)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING;`,
            [`gal-${i + 1}`, item.src, item.title, item.category, i + 1]
          );
        }
        console.log(`✓ ${SEED_GALLERY_IMAGES.length} Gallery images seeded.`);
      } else {
        console.log(`✓ Gallery images already exist (${galCount.rows[0].count} records).`);
      }

      // 5. Experiences (only if empty)
      const expCount = await client.query(`SELECT COUNT(*) as count FROM experiences`);
      if (parseInt(expCount.rows[0].count, 10) === 0) {
        for (const e of SEED_EXPERIENCES) {
          await client.query(
            `INSERT INTO experiences (id, title, subtitle, category, duration, image, description, highlights)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING;`,
            [e.id, e.title, e.subtitle, e.category, e.duration, e.image, e.description, e.highlights]
          );
        }
        console.log(`✓ ${SEED_EXPERIENCES.length} Experiences seeded.`);
      } else {
        console.log(`✓ Experiences already exist (${expCount.rows[0].count} records).`);
      }

      // 6. Promotions (only if empty)
      const promoCount = await client.query(`SELECT COUNT(*) as count FROM promotions`);
      if (parseInt(promoCount.rows[0].count, 10) === 0) {
        for (const p of SEED_PROMOTIONS) {
          await client.query(
            `INSERT INTO promotions (id, title, badge, discount, description, inclusions, code, valid_until)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING;`,
            [p.id, p.title, p.badge, p.discount, p.description, p.inclusions, p.code, p.valid_until]
          );
        }
        console.log(`✓ ${SEED_PROMOTIONS.length} Promotions seeded.`);
      } else {
        console.log(`✓ Promotions already exist (${promoCount.rows[0].count} records).`);
      }

      // 7. FAQs (only if empty)
      const faqCount = await client.query(`SELECT COUNT(*) as count FROM faqs`);
      if (parseInt(faqCount.rows[0].count, 10) === 0) {
        for (const f of SEED_FAQS) {
          await client.query(
            `INSERT INTO faqs (id, question, answer, category, sort_order)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING;`,
            [f.id, f.question, f.answer, f.category, f.sort_order]
          );
        }
        console.log(`✓ ${SEED_FAQS.length} FAQs seeded.`);
      } else {
        console.log(`✓ FAQs already exist (${faqCount.rows[0].count} records).`);
      }

      // 8. Dining Menu (only if empty)
      const menuCount = await client.query(`SELECT COUNT(*) as count FROM dining_menu`);
      if (parseInt(menuCount.rows[0].count, 10) === 0) {
        for (const m of SEED_DINING) {
          await client.query(
            `INSERT INTO dining_menu (id, name, category, price, description, tag)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING;`,
            [m.id, m.name, m.category, m.price, m.description, m.tag]
          );
        }
        console.log(`✓ ${SEED_DINING.length} Dining menu items seeded.`);
      } else {
        console.log(`✓ Dining menu already exists (${menuCount.rows[0].count} records).`);
      }

      // 9. Spa Treatments (only if empty)
      const spaCount = await client.query(`SELECT COUNT(*) as count FROM spa_treatments`);
      if (parseInt(spaCount.rows[0].count, 10) === 0) {
        for (const s of SEED_SPA) {
          await client.query(
            `INSERT INTO spa_treatments (id, name, category, duration, price, description)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING;`,
            [s.id, s.name, s.category, s.duration, s.price, s.description]
          );
        }
        console.log(`✓ ${SEED_SPA.length} Spa treatments seeded.`);
      } else {
        console.log(`✓ Spa treatments already exist (${spaCount.rows[0].count} records).`);
      }

      // 10. Testimonials (only if empty)
      const testCount = await client.query(`SELECT COUNT(*) as count FROM testimonials`);
      if (parseInt(testCount.rows[0].count, 10) === 0) {
        for (const t of SEED_TESTIMONIALS) {
          await client.query(
            `INSERT INTO testimonials (id, name, location, rating, date, title, comment, room_type, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO NOTHING;`,
            [t.id, t.name, t.location, t.rating, t.date, t.title, t.comment, t.room_type, t.status]
          );
        }
        console.log(`✓ ${SEED_TESTIMONIALS.length} Testimonials seeded.`);
      } else {
        console.log(`✓ Testimonials already exist (${testCount.rows[0].count} records).`);
      }

      client.release();
      console.log('\n✓ PostgreSQL Database seeding completed successfully!\n');
    } catch (err) {
      console.error('✗ Seed error on PostgreSQL:', err.message || err);
      process.exit(1);
    } finally {
      await pool.end();
    }
  }
}

seed();

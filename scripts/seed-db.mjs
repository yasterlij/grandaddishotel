import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://tamrat@localhost:5432/grand_addis_db';

const pool = new Pool({ connectionString });

async function seed() {
  console.log('Connecting to PostgreSQL at:', connectionString);

  // 1. Alter room_types table with extra attributes if not present
  await pool.query(`
    ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "size" TEXT DEFAULT '32 m²';
    ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "bedType" TEXT DEFAULT 'King Bed';
    ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "view" TEXT DEFAULT 'City View';
    ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'Hotel Rooms';
    ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "featured" BOOLEAN DEFAULT true;
    ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "aliases" TEXT[] DEFAULT '{}';
  `);

  // 2. Auxiliary Tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS table_reservations (
      id TEXT PRIMARY KEY,
      date DATE NOT NULL,
      time TEXT NOT NULL,
      party_size INTEGER NOT NULL,
      guest_name TEXT NOT NULL,
      guest_phone TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS spa_appointments (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      date DATE NOT NULL,
      time TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      client_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NEW',
      created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_inquiries (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      target_date DATE NOT NULL,
      guests_count TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      details TEXT,
      status TEXT NOT NULL DEFAULT 'NEW',
      created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      comment TEXT NOT NULL,
      room_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'APPROVED',
      created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dining_menu (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      description TEXT NOT NULL,
      tag TEXT,
      created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS spa_treatments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      duration TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS experiences (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      category TEXT NOT NULL,
      duration TEXT NOT NULL,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      highlights TEXT[] NOT NULL,
      created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      badge TEXT NOT NULL,
      discount TEXT NOT NULL,
      description TEXT NOT NULL,
      inclusions TEXT[] NOT NULL,
      code TEXT NOT NULL,
      valid_until TEXT NOT NULL,
      created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Tables verified and created successfully.');

  // 3. Upsert Room Types
  const roomTypesData = [
    {
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
      aliases: ['standard-room', 'double-rooms', 'standard'],
    },
    {
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
      aliases: ['twin-room', 'twin-deluxe'],
    },
    {
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
      aliases: ['deluxe-room', 'deluxe-king'],
    },
    {
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
      description: 'An elevated luxury sanctuary with separated living room, master bedroom, executive lounge access, espresso bar, and scenic mountain and city views over the Bole district.',
      amenities: ['King Bed', 'Separate Living Room', 'Executive Lounge Access', 'Espresso Machine', 'Panoramic Balcony', 'Bathtub & Jacuzzi', 'VIP Airport Shuttle', 'Breakfast Buffet Included'],
      images: ['/images/BO5A5992-scaled.jpg', '/images/BO5A5989-scaled.jpg', '/images/BO5A5976-scaled.jpg', '/hotel_images/1760816139.webp'],
      aliases: ['grand-executive-suite', 'executive'],
    },
    {
      slug: 'presidential-suite',
      name: 'Grand Addis Presidential Suite',
      category: 'Suites',
      size: '96 m²',
      bedType: 'Palatial King Master + Guest Suite',
      view: '360° Private Rooftop Terrace View',
      basePriceETB: 35000,
      basePriceUSD: 300,
      baseCapacity: 4,
      maxCapacity: 6,
      description: 'The pinnacle of luxury in Addis Ababa. Palatial top-floor residence with grand dining room, kitchen, private butler service, jacuzzi, and 360-degree terrace overlooking the capital.',
      amenities: ['Master King Bed + Guest Suite', '360° Private Rooftop Terrace', 'Jacuzzi Spa & Sauna', 'Private Dining Room & Kitchenette', 'Dedicated 24/7 Butler Service', 'Complimentary Limousine Airport Transfer', 'Full Stocked Mini-bar', 'Chef Tasting Experience'],
      images: ['/hotel_images/1760816135.webp', '/images/BO5A5992-scaled.jpg', '/images/BO5A5976-scaled.jpg', '/images/BO5A5805-scaled.jpg'],
      aliases: ['grand-presidential-suite', 'presidential'],
    },
  ];

  for (const r of roomTypesData) {
    await pool.query(
      `INSERT INTO room_types (
        id, slug, name, description, "baseCapacity", "maxCapacity", amenities, images,
        "basePriceETB", "basePriceUSD", size, "bedType", view, category, featured, aliases, "updatedAt"
      ) VALUES (
        gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, $14, NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        "baseCapacity" = EXCLUDED."baseCapacity",
        "maxCapacity" = EXCLUDED."maxCapacity",
        amenities = EXCLUDED.amenities,
        images = EXCLUDED.images,
        "basePriceETB" = EXCLUDED."basePriceETB",
        "basePriceUSD" = EXCLUDED."basePriceUSD",
        size = EXCLUDED.size,
        "bedType" = EXCLUDED."bedType",
        view = EXCLUDED.view,
        category = EXCLUDED.category,
        aliases = EXCLUDED.aliases,
        "updatedAt" = NOW()`,
      [
        r.slug,
        r.name,
        r.description,
        r.baseCapacity,
        r.maxCapacity,
        r.amenities,
        r.images,
        r.basePriceETB,
        r.basePriceUSD,
        r.size,
        r.bedType,
        r.view,
        r.category,
        r.aliases,
      ]
    );
  }
  console.log('Room types synchronized.');

  // 4. Dining Menu
  const menuCount = await pool.query('SELECT count(*) FROM dining_menu');
  if (parseInt(menuCount.rows[0].count, 10) === 0) {
    const menus = [
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
    for (const m of menus) {
      await pool.query(
        `INSERT INTO dining_menu (id, name, category, price, description, tag) VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [m.id, m.name, m.category, m.price, m.description, m.tag]
      );
    }
    console.log('Dining menu populated.');
  }

  // 5. Spa Treatments
  const spaCount = await pool.query('SELECT count(*) FROM spa_treatments');
  if (parseInt(spaCount.rows[0].count, 10) === 0) {
    const spas = [
      { id: 'sp1', name: 'Grand Signature Aromatherapy Massage', category: 'Massage Therapy', duration: '60 / 90 mins', price: 65, description: 'A soothing full-body massage employing cold-pressed organic botanical oils, rhythmic strokes, and acupressure to release muscle tension and restore inner calm.' },
      { id: 'sp2', name: 'Deep Tissue Muscle Recovery', category: 'Massage Therapy', duration: '60 / 90 mins', price: 75, description: 'Targeted deep-layer manipulation designed for tired travelers and fitness enthusiasts, focusing on posture alignment, chronic stiffness, and revitalization.' },
      { id: 'sp3', name: 'Thermal Steam & Eucalyptus Sauna Ritual', category: 'Hydrothermal Sanctuary', duration: '45 mins', price: 35, description: 'Detoxifying private thermal steam bath infused with highland eucalyptus leaves, followed by cold mist shower and herbal infusion teas.' },
      { id: 'sp4', name: 'Highland Coffee Body Polish', category: 'Body Scrubs & Wraps', duration: '50 mins', price: 55, description: 'Exfoliating scrub crafted from freshly ground Yirgacheffe coffee beans, brown sugar, and rich shea butter, leaving your skin luminous and silk-soft.' },
      { id: 'sp5', name: 'Radiance Botanical Facial', category: 'Skin Care', duration: '60 mins', price: 60, description: 'Customized deep cleansing facial featuring natural antioxidant serums, lymphatic drainage massage, and cooling aloe-collagen mask.' },
    ];
    for (const s of spas) {
      await pool.query(
        `INSERT INTO spa_treatments (id, name, category, duration, price, description) VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [s.id, s.name, s.category, s.duration, s.price, s.description]
      );
    }
    console.log('Spa treatments populated.');
  }

  // 6. Experiences
  const expCount = await pool.query('SELECT count(*) FROM experiences');
  if (parseInt(expCount.rows[0].count, 10) === 0) {
    const exps = [
      { id: 'exp1', title: 'Traditional Ethiopian Coffee Ceremony', subtitle: 'A sensory journey through the birthplace of Arabica', category: 'Culture', duration: '1.5 Hours', image: '/images/BO5A5779-scaled.jpg', description: 'Immerse yourself in centuries of tradition. Watch our coffee masters wash, roast, grind, and brew beans over charcoal embers in a clay jebena, accompanied by fragrant incense and traditional snacks.', highlights: ['Clay jebena brewing', 'Freshly roasted beans tasting', 'Cultural storytelling', 'Traditional snacks & popcorn'] },
      { id: 'exp2', title: 'Addis Ababa City & Heritage Excursion', subtitle: 'Explore history, culture, and panoramic views', category: 'City Tour', duration: 'Half Day (4-5 Hours)', image: '/images/BO5A5957-scaled.jpg', description: 'Discover the best of Addis Ababa with our private chauffeured tour. Visit the National Museum of Ethiopia (home of 3.2-million-year-old Lucy), Holy Trinity Cathedral, and the breathtaking viewpoints from Mount Entoto.', highlights: ['National Museum & Lucy', 'Mount Entoto scenic panorama', 'Holy Trinity Cathedral', 'Comfortable luxury transport'] },
      { id: 'exp3', title: 'Chef-Led Culinary Masterclass', subtitle: 'Learn the secrets of authentic Ethiopian gastronomy', category: 'Gastronomy', duration: '2.5 Hours', image: '/images/BO5A5805-scaled.jpg', description: 'Join our Executive Chef in our hotel kitchen. Learn how to ferment teff batter for injera, balance traditional berbere spices, and cook aromatic tibs and vegetarian shiro stews.', highlights: ['Hands-on cooking', 'Injera making demonstration', 'Spice blending secrets', 'Tasting dinner with wine'] },
      { id: 'exp4', title: 'Highland Wellness & Fitness Escape', subtitle: 'Re-energize your body at 2,300 meters altitude', category: 'Wellness', duration: '2 Hours', image: '/images/BO5A5977-scaled.jpg', description: 'Harness the clean highland air of Addis Ababa. Enjoy guided morning rooftop yoga or circuit training in our fitness suite, followed by steam recovery and freshly blended smoothies.', highlights: ['Sunrise yoga sessions', 'Cardio & strength gym access', 'Steam & sauna recovery', 'Detox fresh smoothies'] },
    ];
    for (const e of exps) {
      await pool.query(
        `INSERT INTO experiences (id, title, subtitle, category, duration, image, description, highlights) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [e.id, e.title, e.subtitle, e.category, e.duration, e.image, e.description, e.highlights]
      );
    }
    console.log('Experiences populated.');
  }

  // 7. Promotions
  const promoCount = await pool.query('SELECT count(*) FROM promotions');
  if (parseInt(promoCount.rows[0].count, 10) === 0) {
    const promos = [
      { id: 'promo1', title: 'Member Exclusive Stay', badge: 'Best Value', discount: 'Save 15%', description: 'Book direct as a Grand Addis member and unlock 15% off room rates, complimentary high-speed Wi-Fi, late check-out upon availability, and 24-hour fitness access.', inclusions: ['15% discount on all room categories', 'Daily complimentary breakfast buffet', 'Late check-out until 15:00 (subject to availability)', 'Complimentary airport pickup on bookings of 3+ nights'], code: 'GRANDMEMBER15', validUntil: 'December 31, 2026' },
      { id: 'promo2', title: 'Dinner, Bed & Breakfast Package', badge: 'Popular', discount: 'Full Board Perks', description: 'A seamless, fully flexible package combining luxurious overnight accommodation, hearty breakfast, and a 3-course dinner from our restaurant set menu.', inclusions: ['Luxury room or suite accommodation', 'Full buffet breakfast daily', 'Three-course evening dinner for two resident adults', 'High-speed Wi-Fi in rooms and public spaces'], code: 'DINNERBED26', validUntil: 'Ongoing' },
      { id: 'promo3', title: 'Weekend Rebalance Retreat', badge: 'Weekend Special', discount: 'Save 20%', description: 'Designed for quick weekend escapes and couples. Enjoy complimentary bottle of sparkling wine on arrival, 30% discount on spa treatments, and leisurely Sunday brunch.', inclusions: ['Welcome sparkling wine & fresh fruit basket', '30% discount on all spa treatments', 'Sunday late checkout until 16:00', 'Complimentary access to steam and sauna'], code: 'WEEKENDREBALANCE', validUntil: 'Year-Round (Fri-Sun)' },
    ];
    for (const p of promos) {
      await pool.query(
        `INSERT INTO promotions (id, title, badge, discount, description, inclusions, code, valid_until) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [p.id, p.title, p.badge, p.discount, p.description, p.inclusions, p.code, p.validUntil]
      );
    }
    console.log('Promotions populated.');
  }

  // 8. FAQs
  const faqCount = await pool.query('SELECT count(*) FROM faqs');
  if (parseInt(faqCount.rows[0].count, 10) === 0) {
    const faqs = [
      { id: 'f1', question: 'How do I reserve a room at Grand Addis Hotel?', answer: 'Reservations can be made directly through our online booking engine on this website, by calling our 24/7 reservations desk at +251 116 672 828, or by emailing reservations@egrandaddishotel.com. You will receive an instant confirmation voucher.', category: 'reservations', sort: 1 },
      { id: 'f2', question: 'What are the check-in and check-out times?', answer: 'Check-in is from 14:00 (2:00 PM) onwards, and check-out is until 12:00 (12:00 PM). Early check-in or late check-out is subject to room availability upon arrival; you are always welcome to store luggage in our secure room and enjoy the lounge and dining areas.', category: 'checkin', sort: 2 },
      { id: 'f3', question: 'Do you offer airport transportation from Bole International Airport?', answer: 'Yes! We offer convenient airport pick-up and drop-off services. Bole International Airport (ADD) is approximately 10-15 minutes away (5.2 km). You can add airport transfer during your online booking or contact our concierge prior to arrival with your flight details.', category: 'services', sort: 3 },
      { id: 'f4', question: 'What payment methods are accepted at the hotel?', answer: 'We accept major international credit and debit cards (Visa, MasterCard, American Express), international bank transfers, and local Ethiopian payment methods including cash in ETB, Telebirr, and CBE Birr.', category: 'payment', sort: 4 },
      { id: 'f5', question: 'What is your cancellation and modification policy?', answer: 'Flexible rate reservations can be cancelled or modified free of charge up to 24 hours prior to scheduled check-in date. Promotional and non-refundable rates may carry specific conditions indicated during booking.', category: 'reservations', sort: 5 },
      { id: 'f6', question: 'Is high-speed Wi-Fi available throughout the hotel?', answer: 'Yes, complimentary high-speed fiber-optic Wi-Fi is available across all guest rooms, suites, restaurants, conference halls, and lobby areas.', category: 'services', sort: 6 },
      { id: 'f7', question: 'Are dining and room service available 24/7?', answer: 'Our main restaurant serves breakfast from 06:30 to 10:30, lunch from 12:00 to 15:00, and dinner from 18:30 to 22:30. An in-room dining night menu is available 24 hours a day for your convenience.', category: 'services', sort: 7 },
    ];
    for (const f of faqs) {
      await pool.query(
        `INSERT INTO faqs (id, question, answer, category, sort_order) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [f.id, f.question, f.answer, f.category, f.sort]
      );
    }
    console.log('FAQs populated.');
  }

  console.log('🎉 PostgreSQL Database is fully seeded and ready!');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

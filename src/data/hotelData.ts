export interface Room {
  id: string;
  slug: string;
  name: string;
  category: string;
  pricePerNight: number;
  capacity: number;
  size: string;
  bedType: string;
  view: string;
  description: string;
  images: string[];
  amenities: string[];
  featured?: boolean;
}

export interface MenuItem {
  name: string;
  category: 'starter' | 'main' | 'dessert' | 'beverage' | 'ethiopian';
  price: number;
  description: string;
  tag?: string;
}

export interface SpaTreatment {
  id: string;
  name: string;
  duration: string;
  price: number;
  description: string;
  category: string;
}

export interface Experience {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  duration: string;
  image: string;
  description: string;
  highlights: string[];
}

export interface Promotion {
  id: string;
  title: string;
  badge: string;
  discount: string;
  description: string;
  inclusions: string[];
  code: string;
  validUntil: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  roomType: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: 'reservations' | 'payment' | 'services' | 'checkin';
}

export const HOTEL_INFO = {
  name: 'Grand Addis Hotel',
  tagline: 'Resort & Hotel',
  headline: 'Your Grand Stay In The Heart Of Addis',
  description: 'Welcome to Grand Addis Hotel, an oasis of luxury and tranquility located at 22 Around Golagul in Addis Ababa, Ethiopia. Experience bespoke hospitality, refined comfort, world-class dining, and serene wellness.',
  phone: '+251 116 672 828',
  phoneAlt: '+251 911 234 567',
  email: 'reservations@egrandaddishotel.com',
  emailAlt: 'info@grandaddishotel.com',
  address: '22 Around Golagul, Addis Ababa, Ethiopia',
  city: 'Addis Ababa',
  country: 'Ethiopia',
  checkInTime: '14:00 (2:00 PM)',
  checkOutTime: '12:00 (12:00 PM)',
  airportDistance: '5.2 km from Addis Ababa Bole International Airport (approx. 10-15 mins)',
  socials: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    tripadvisor: 'https://tripadvisor.com',
    telegram: 'https://t.me/grandaddishotel',
  }
};

export const ROOMS: Room[] = [
  {
    id: '1',
    slug: 'standard-room',
    name: 'Standard Room',
    category: 'Hotel Rooms',
    pricePerNight: 27,
    capacity: 2,
    size: '28 m²',
    bedType: 'Queen Bed',
    view: 'City View',
    description: 'Designed for discerning travelers who appreciate understated elegance and comfort. The Standard Room at Grand Addis Hotel features contemporary warm-toned furnishings, high-speed Wi-Fi, plush bedding, and an en-suite marble bathroom.',
    images: [
      '/images/vikbooking/bo5a5902.jpg',
      '/images/vikbooking/big_bo5a5894.jpg',
      '/images/vikbooking/big_bo5a5900.jpg',
      '/images/BO5A5900-scaled.jpg',
    ],
    amenities: [
      'High-Speed Wi-Fi',
      'Smart LED TV with Satellite Channels',
      'Individual Air Conditioning & Climate Control',
      'Modern En-suite Bathroom with Rain Shower',
      'Work Desk with Ergonomic Chair',
      'Tea & Ethiopian Coffee Maker',
      'Daily Housekeeping',
      'Electronic In-Room Safe'
    ],
    featured: true
  },
  {
    id: '2',
    slug: 'deluxe-room',
    name: 'Deluxe Room',
    category: 'Hotel Rooms',
    pricePerNight: 34,
    capacity: 2,
    size: '36 m²',
    bedType: 'King Size Bed',
    view: 'Panoramic City & Mountain View',
    description: 'Generously proportioned and bathed in natural light, the Deluxe Room offers a sanctuary of elevated relaxation. Enjoy plush king bedding, an intimate sitting lounge area, floor-to-ceiling windows overlooking Addis Ababa, and premium guest amenities.',
    images: [
      '/images/vikbooking/bo5a5878.jpg',
      '/images/vikbooking/big_bo5a5868.jpg',
      '/images/BO5A5826-scaled.jpg',
      '/images/BO5A5821-scaled.jpg'
    ],
    amenities: [
      'Ultra High-Speed Wi-Fi',
      '50-inch 4K Smart TV',
      'Individual Climate Control',
      'Marble Bathroom with Deep Soaking Tub & Rain Shower',
      'Executive Working Desk',
      'Mini Bar & Refreshment Station',
      'Complimentary Bottled Mineral Water',
      'Bathrobes & Luxury Toiletries',
      'In-Room Safe & 24/7 Room Service'
    ],
    featured: true
  },
  {
    id: '3',
    slug: 'twin-room',
    name: 'Twin Room',
    category: 'Hotel Rooms',
    pricePerNight: 34,
    capacity: 2,
    size: '34 m²',
    bedType: 'Two Single Beds',
    view: 'City View',
    description: 'Ideal for colleagues or friends traveling together, our Twin Room provides generous space without sacrificing comfort or luxury. Fitted with two ergonomic single beds, soundproof windows, and dedicated workspace.',
    images: [
      '/images/vikbooking/bo5a5832.jpg',
      '/images/vikbooking/big_260bo5a5832.jpg',
      '/images/vikbooking/big_bo5a5852.jpg',
      '/images/BO5A5924-1-scaled.jpg'
    ],
    amenities: [
      'High-Speed Wi-Fi',
      'Smart TV',
      'Air Conditioning',
      'Two Premium Single Mattresses',
      'Spacious Marble Bathroom',
      'Writing Desk',
      'Coffee & Tea Making Facilities',
      'Electronic Safe'
    ],
    featured: true
  },
  {
    id: '4',
    slug: 'executive-suite',
    name: 'Grand Executive Suite',
    category: 'Suites',
    pricePerNight: 55,
    capacity: 3,
    size: '52 m²',
    bedType: 'Master King Bed + Daybed',
    view: 'Corner Skyline View',
    description: 'The pinnacle of luxury at Grand Addis Hotel. The Executive Suite comprises a separate living parlor, dining nook, expansive master bedroom, dressing area, and deluxe bathroom with soaking tub.',
    images: [
      '/images/BO5A5992-scaled.jpg',
      '/images/BO5A5989-scaled.jpg',
      '/images/BO5A5976-scaled.jpg',
      '/images/BO5A5988-scaled.jpg'
    ],
    amenities: [
      'Complimentary Airport VIP Shuttle',
      'Separate Living Room & Dining Area',
      'Espresso Machine & Premium Tea Selection',
      '55-inch Smart 4K TV & Soundbar',
      'Designer Bathrobes & Luxury Bathroom Amenities',
      'Complimentary Full Breakfast for Two',
      'Evening Turn-down Service with Chocolates',
      'Priority Restaurant & Spa Reservations'
    ],
    featured: true
  }
];

export const DINING_MENUS: MenuItem[] = [
  // Starters
  {
    name: 'Chicken Parmigiana Bites',
    category: 'starter',
    price: 49,
    description: 'Green roman salad, chicken breast, beetroot, extra virgin olive oil, creamy avocado, crisp lettuce.',
    tag: "Chef's Choice"
  },
  {
    name: 'Pasta with Pesto Cream Sauce',
    category: 'starter',
    price: 17,
    description: 'Handmade fresh tagliatelle, basil pesto, pine nuts, aged parmesan crisps, sun-dried cherry tomatoes.'
  },
  {
    name: 'Blueberry Zucchini Artisan Bread',
    category: 'starter',
    price: 40,
    description: 'Warm freshly baked zucchini bread, wild blueberry compote, whipped honey truffle butter.'
  },
  {
    name: 'Crispy Calamari Fritti',
    category: 'starter',
    price: 24,
    description: 'Tender squid rings, smoked paprika dust, lemon caper aioli, fresh garden herbs.'
  },
  {
    name: 'Traditional Sambusa Trio',
    category: 'starter',
    price: 14,
    description: 'Golden pastry pockets stuffed with seasoned spiced lentils, minced beef, and garden scallions served with sweet awaze dip.',
    tag: 'Local Favorite'
  },

  // Mains
  {
    name: 'Prime Grilled Beef Tenderloin',
    category: 'main',
    price: 52,
    description: 'Grass-fed beef fillet, homemade potato hash, white cabbage purée, roasted baby carrots, rich rosemary marjoram sauce.',
    tag: 'Signature'
  },
  {
    name: 'Grand Addis Special Tibs',
    category: 'ethiopian',
    price: 32,
    description: 'Sautéed tender beef cubes with rosemary, sweet onions, jalapeño peppers, clarified spiced butter (niter kibbeh), served on freshly baked teff injera.',
    tag: 'Authentic Ethiopian'
  },
  {
    name: 'Doro Wot Feast',
    category: 'ethiopian',
    price: 36,
    description: 'Traditional slow-cooked chicken stew infused with aromatic berbere spice blend, boiled farm egg, and ayib cottage cheese.',
    tag: 'Heritage Special'
  },
  {
    name: 'Pan-Seared Lake Tana Tilapia',
    category: 'main',
    price: 38,
    description: 'Fresh tilapia fillet, saffron-infused pilaf rice, steamed asparagus, garlic-caper white wine emulsion.'
  },
  {
    name: 'Wild Mushroom Truffle Risotto',
    category: 'main',
    price: 28,
    description: 'Arborio rice, porcini and oyster mushrooms, shaved parmesan reggiano, white truffle oil essence.',
    tag: 'Vegetarian'
  },

  // Desserts
  {
    name: 'No Bake S’mores Cheesecake',
    category: 'dessert',
    price: 26,
    description: 'Toasted graham cracker crust, silky smoked chocolate ganache, torch-browned marshmallow cream.',
    tag: 'Sweet Indulgence'
  },
  {
    name: 'Cannoli Stuffed French Toast',
    category: 'dessert',
    price: 15,
    description: 'Brioche soaked in spiced custard, sweet ricotta citrus filling, pistachio crunch, dark chocolate drizzle.'
  },
  {
    name: 'Caramelized Plum & Curd Tart',
    category: 'dessert',
    price: 18,
    description: 'Plum sauce with plum brandy, curd chips, caramelized black plums, poppy seed artisanal gelato.'
  },
  {
    name: 'Ethiopian Sidama Coffee Tiramisu',
    category: 'dessert',
    price: 19,
    description: 'Savoiardi ladyfingers soaked in freshly pulled single-origin Sidama espresso, mascarpone mousse, raw cacao.',
    tag: "Chef's Special"
  },

  // Beverages
  {
    name: 'Traditional Ethiopian Buna Ceremony',
    category: 'beverage',
    price: 8,
    description: 'Freshly roasted Ethiopian coffee beans brewed in a traditional clay jebena pot, accompanied by frankincense aromas and popped corn.',
    tag: 'Cultural Highlight'
  },
  {
    name: 'Abyssinian Sunset Cocktail',
    category: 'beverage',
    price: 16,
    description: 'Aged rum, passionfruit nectar, fresh lime juice, honey ginger syrup, splash of sparkling soda.'
  },
  {
    name: 'Freshly Pressed Tropical Juices',
    category: 'beverage',
    price: 9,
    description: 'Layers of fresh avocado, mango, papaya, and strawberry puree with fresh lime wedge (Spriss).'
  }
];

export const WELLNESS_SERVICES: SpaTreatment[] = [
  {
    id: 'sp1',
    name: 'Grand Signature Aromatherapy Massage',
    category: 'Massage Therapy',
    duration: '60 / 90 mins',
    price: 65,
    description: 'A soothing full-body massage employing cold-pressed organic botanical oils, rhythmic strokes, and acupressure to release muscle tension and restore inner calm.'
  },
  {
    id: 'sp2',
    name: 'Deep Tissue Muscle Recovery',
    category: 'Massage Therapy',
    duration: '60 / 90 mins',
    price: 75,
    description: 'Targeted deep-layer manipulation designed for tired travelers and fitness enthusiasts, focusing on posture alignment, chronic stiffness, and revitalization.'
  },
  {
    id: 'sp3',
    name: 'Thermal Steam & Eucalyptus Sauna Ritual',
    category: 'Hydrothermal Sanctuary',
    duration: '45 mins',
    price: 35,
    description: 'Detoxifying private thermal steam bath infused with highland eucalyptus leaves, followed by cold mist shower and herbal infusion teas.'
  },
  {
    id: 'sp4',
    name: 'Highland Coffee Body Polish',
    category: 'Body Scrubs & Wraps',
    duration: '50 mins',
    price: 55,
    description: 'Exfoliating scrub crafted from freshly ground Yirgacheffe coffee beans, brown sugar, and rich shea butter, leaving your skin luminous and silk-soft.'
  },
  {
    id: 'sp5',
    name: 'Radiance Botanical Facial',
    category: 'Skin Care',
    duration: '60 mins',
    price: 60,
    description: 'Customized deep cleansing facial featuring natural antioxidant serums, lymphatic drainage massage, and cooling aloe-collagen mask.'
  }
];

export const EXPERIENCES: Experience[] = [
  {
    id: 'exp1',
    title: 'Traditional Ethiopian Coffee Ceremony',
    subtitle: 'A sensory journey through the birthplace of Arabica',
    category: 'Culture',
    duration: '1.5 Hours',
    image: '/images/BO5A5779-scaled.jpg',
    description: 'Immerse yourself in centuries of tradition. Watch our coffee masters wash, roast, grind, and brew beans over charcoal embers in a clay jebena, accompanied by fragrant incense and traditional snacks.',
    highlights: ['Clay jebena brewing', 'Freshly roasted beans tasting', 'Cultural storytelling', 'Traditional snacks & popcorn']
  },
  {
    id: 'exp2',
    title: 'Addis Ababa City & Heritage Excursion',
    subtitle: 'Explore history, culture, and panoramic views',
    category: 'City Tour',
    duration: 'Half Day (4-5 Hours)',
    image: '/images/BO5A5957-scaled.jpg',
    description: 'Discover the best of Addis Ababa with our private chauffeured tour. Visit the National Museum of Ethiopia (home of 3.2-million-year-old Lucy), Holy Trinity Cathedral, and the breathtaking viewpoints from Mount Entoto.',
    highlights: ['National Museum & Lucy', 'Mount Entoto scenic panorama', 'Holy Trinity Cathedral', 'Comfortable luxury transport']
  },
  {
    id: 'exp3',
    title: 'Chef-Led Culinary Masterclass',
    subtitle: 'Learn the secrets of authentic Ethiopian gastronomy',
    category: 'Gastronomy',
    duration: '2.5 Hours',
    image: '/images/BO5A5805-scaled.jpg',
    description: 'Join our Executive Chef in our hotel kitchen. Learn how to ferment teff batter for injera, balance traditional berbere spices, and cook aromatic tibs and vegetarian shiro stews.',
    highlights: ['Hands-on cooking', 'Injera making demonstration', 'Spice blending secrets', 'Tasting dinner with wine']
  },
  {
    id: 'exp4',
    title: 'Highland Wellness & Fitness Escape',
    subtitle: 'Re-energize your body at 2,300 meters altitude',
    category: 'Wellness',
    duration: '2 Hours',
    image: '/images/BO5A5977-scaled.jpg',
    description: 'Harness the clean highland air of Addis Ababa. Enjoy guided morning rooftop yoga or circuit training in our fitness suite, followed by steam recovery and freshly blended smoothies.',
    highlights: ['Sunrise yoga sessions', 'Cardio & strength gym access', 'Steam & sauna recovery', 'Detox fresh smoothies']
  }
];

export const PROMOTIONS: Promotion[] = [
  {
    id: 'promo1',
    title: 'Member Exclusive Stay',
    badge: 'Best Value',
    discount: 'Save 15%',
    description: 'Book direct as a Grand Addis member and unlock 15% off room rates, complimentary high-speed Wi-Fi, late check-out upon availability, and 24-hour fitness access.',
    inclusions: [
      '15% discount on all room categories',
      'Daily complimentary breakfast buffet',
      'Late check-out until 15:00 (subject to availability)',
      'Complimentary airport pickup on bookings of 3+ nights'
    ],
    code: 'GRANDMEMBER15',
    validUntil: 'December 31, 2026'
  },
  {
    id: 'promo2',
    title: 'Dinner, Bed & Breakfast Package',
    badge: 'Popular',
    discount: 'Full Board Perks',
    description: 'A seamless, fully flexible package combining luxurious overnight accommodation, hearty breakfast, and a 3-course dinner from our restaurant set menu.',
    inclusions: [
      'Luxury room or suite accommodation',
      'Full buffet breakfast daily',
      'Three-course evening dinner for two resident adults',
      'High-speed Wi-Fi in rooms and public spaces'
    ],
    code: 'DINNERBED26',
    validUntil: 'Ongoing'
  },
  {
    id: 'promo3',
    title: 'Weekend Rebalance Retreat',
    badge: 'Weekend Special',
    discount: 'Save 20%',
    description: 'Designed for quick weekend escapes and couples. Enjoy complimentary bottle of sparkling wine on arrival, 30% discount on spa treatments, and leisurely Sunday brunch.',
    inclusions: [
      'Welcome sparkling wine & fresh fruit basket',
      '30% discount on all spa treatments',
      'Sunday late checkout until 16:00',
      'Complimentary access to steam and sauna'
    ],
    code: 'WEEKENDREBALANCE',
    validUntil: 'Year-Round (Fri-Sun)'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Alexander Wright',
    location: 'London, United Kingdom',
    rating: 5,
    date: 'February 2026',
    title: 'Exceptional hospitality and prime location',
    comment: 'We arrived early and could not check in immediately due to high occupancy, but the reception staff warmly welcomed us with fresh coffee, took care of our luggage, and allowed us to relax in the lounge. The Deluxe room was spotless, peaceful, and the bed exceptionally comfortable. We will definitely return!',
    roomType: 'Deluxe Room'
  },
  {
    id: 't2',
    name: 'Bethelhem Tadesse',
    location: 'Nairobi, Kenya',
    rating: 5,
    date: 'January 2026',
    title: 'True gem in the heart of Addis Ababa',
    comment: 'Grand Addis Hotel exceeded all my expectations. The staff are so courteous, always greeting with genuine smiles. The restaurant serves incredible Ethiopian food alongside international dishes. Highly recommended for both business and leisure.',
    roomType: 'Grand Executive Suite'
  },
  {
    id: 't3',
    name: 'Jean-Pierre Laurent',
    location: 'Paris, France',
    rating: 5,
    date: 'March 2026',
    title: 'Unbeatable value and peaceful oasis',
    comment: 'Traveling for diplomatic meetings, I needed reliable high-speed internet and quiet nights. The Standard Room delivered on every level. Quiet AC, modern bathroom, and 10 minutes to Bole Airport. Outstanding value!',
    roomType: 'Standard Room'
  },
  {
    id: 't4',
    name: 'Sarah & Michael Jenkins',
    location: 'Toronto, Canada',
    rating: 5,
    date: 'December 2025',
    title: 'Memorable stay for our anniversary',
    comment: 'From the surprise flower petals in our room to the rejuvenating massage at the spa, everything was flawless. The location in 22 around Golagul made it so easy to get everywhere in the city.',
    roomType: 'Deluxe Room'
  }
];

export const FAQS: FAQItem[] = [
  {
    question: 'How do I reserve a room at Grand Addis Hotel?',
    answer: 'Reservations can be made directly through our online booking engine on this website, by calling our 24/7 reservations desk at +251 116 672 828, or by emailing reservations@egrandaddishotel.com. You will receive an instant confirmation voucher.',
    category: 'reservations'
  },
  {
    question: 'What are the check-in and check-out times?',
    answer: 'Check-in is from 14:00 (2:00 PM) onwards, and check-out is until 12:00 (12:00 PM). Early check-in or late check-out is subject to room availability upon arrival; you are always welcome to store luggage in our secure room and enjoy the lounge and dining areas.',
    category: 'checkin'
  },
  {
    question: 'Do you offer airport transportation from Bole International Airport?',
    answer: 'Yes! We offer convenient airport pick-up and drop-off services. Bole International Airport (ADD) is approximately 10-15 minutes away (5.2 km). You can add airport transfer during your online booking or contact our concierge prior to arrival with your flight details.',
    category: 'services'
  },
  {
    question: 'What payment methods are accepted at the hotel?',
    answer: 'We accept major international credit and debit cards (Visa, MasterCard, American Express), international bank transfers, and local Ethiopian payment methods including cash in ETB, Telebirr, and CBE Birr.',
    category: 'payment'
  },
  {
    question: 'What is your cancellation and modification policy?',
    answer: 'Flexible rate reservations can be cancelled or modified free of charge up to 24 hours prior to scheduled check-in date. Promotional and non-refundable rates may carry specific conditions indicated during booking.',
    category: 'reservations'
  },
  {
    question: 'Is high-speed Wi-Fi available throughout the hotel?',
    answer: 'Yes, complimentary high-speed fiber-optic Wi-Fi is available across all guest rooms, suites, restaurants, conference halls, and lobby areas.',
    category: 'services'
  },
  {
    question: 'Are dining and room service available 24/7?',
    answer: 'Our main restaurant serves breakfast from 06:30 to 10:30, lunch from 12:00 to 15:00, and dinner from 18:30 to 22:30. An in-room dining night menu is available 24 hours a day for your convenience.',
    category: 'services'
  }
];

export const GALLERY_IMAGES = [
  { src: '/images/BO5A5779-scaled.jpg', title: 'Grand Exterior & Entrance', category: 'hotel' },
  { src: '/images/BO5A5826-scaled.jpg', title: 'Deluxe Suite Bedding', category: 'rooms' },
  { src: '/images/BO5A5821-scaled.jpg', title: 'Luxury Guest Room View', category: 'rooms' },
  { src: '/images/BO5A5957-scaled.jpg', title: 'Restaurant & Fine Dining', category: 'dining' },
  { src: '/images/BO5A5963-scaled.jpg', title: 'Bar & Cocktail Lounge', category: 'dining' },
  { src: '/images/BO5A5977-scaled.jpg', title: 'Executive Meeting Room', category: 'events' },
  { src: '/images/BO5A5988-scaled.jpg', title: 'Wellness & Spa Corner', category: 'wellness' },
  { src: '/images/BO5A5900-scaled.jpg', title: 'Standard Room Setup', category: 'rooms' },
  { src: '/images/BO5A5992-scaled.jpg', title: 'Presidential Parlor', category: 'rooms' },
  { src: '/images/BO5A5989-scaled.jpg', title: 'En-suite Luxury Bath', category: 'rooms' },
  { src: '/images/BO5A5976-scaled.jpg', title: 'Bespoke Interior Details', category: 'hotel' },
  { src: '/images/BO5A5805-scaled.jpg', title: 'Culinary Presentation', category: 'dining' },
  { src: '/images/vikbooking/bo5a5902.jpg', title: 'Standard Room Warm Light', category: 'rooms' },
  { src: '/images/vikbooking/bo5a5878.jpg', title: 'Deluxe Master Suite', category: 'rooms' },
  { src: '/images/vikbooking/bo5a5832.jpg', title: 'Twin Bed Guest Room', category: 'rooms' },
];

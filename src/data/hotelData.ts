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
  /** Present on rooms loaded from the database. */
  aliases?: string[];
  availableCount?: number;
  basePriceETB?: number;
  basePriceUSD?: number;
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

export const HOTEL_INFO = {
  name: 'Grand Addis Hotel',
  tagline: 'Resort & Hotel',
  headline: 'Your Grand Stay In The Heart Of Addis',
  description: 'Welcome to Grand Addis Hotel, an oasis of luxury and tranquility located at 22 Around Golagul in Addis Ababa, Ethiopia. Experience bespoke hospitality, refined comfort, and authentic Ethiopian culture.',
  phone: '+251 116 672 828',
  phoneAlt: '+251 911 234 567',
  email: 'reservations@egrandaddishotel.com',
  emailAlt: 'info@grandaddishotel.com',
  address: '22 Around Golagul, behind Meklit Building, Addis Ababa, Ethiopia',
  city: 'Addis Ababa',
  country: 'Ethiopia',
  checkInTime: '14:00 (2:00 PM)',
  checkOutTime: '12:00 (12:00 PM)',
  airportDistance: '5.2 km from Addis Ababa Bole International Airport (approx. 10-15 mins)',
  mapEmbedUrl: 'https://maps.google.com/maps?q=Grand+Addis+Hotel,+22,+Addis+Ababa,+Ethiopia&t=&z=17&ie=UTF8&iwloc=&output=embed',
  mapDirectionsUrl: 'https://www.google.com/maps/search/?api=1&query=Grand+Addis+Hotel+Addis+Ababa+Ethiopia',
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
      'Priority Concierge & Tour Bookings'
    ],
    featured: true
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
    comment: 'From the warm welcome upon arrival to the authentic Ethiopian coffee tasting, everything was flawless. The location in 22 around Golagul made it so easy to get everywhere in the city.',
    roomType: 'Deluxe Room'
  }
];

export const GALLERY_IMAGES = [
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

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // Quick verify & ensure initial testimonials
    const testCount = await query('SELECT count(*) FROM testimonials');
    if (parseInt(testCount.rows[0].count, 10) === 0) {
      await query(`
        INSERT INTO testimonials (id, name, location, rating, date, title, comment, room_type) VALUES
        ('t1', 'Alexander Wright', 'London, United Kingdom', 5, 'February 2026', 'Exceptional hospitality and prime location', 'We arrived early and could not check in immediately due to high occupancy, but the reception staff warmly welcomed us with fresh coffee, took care of our luggage, and allowed us to relax in the lounge. The Deluxe room was spotless, peaceful, and the bed exceptionally comfortable.', 'Deluxe Room'),
        ('t2', 'Bethelhem Tadesse', 'Nairobi, Kenya', 5, 'January 2026', 'True gem in the heart of Addis Ababa', 'Grand Addis Hotel exceeded all my expectations. The staff are so courteous, always greeting with genuine smiles. The restaurant serves incredible Ethiopian food alongside international dishes. Highly recommended for both business and leisure.', 'Grand Executive Suite'),
        ('t3', 'Jean-Pierre Laurent', 'Paris, France', 5, 'March 2026', 'Unbeatable value and peaceful oasis', 'Traveling for diplomatic meetings, I needed reliable high-speed internet and quiet nights. The Standard Room delivered on every level. Quiet AC, modern bathroom, and 10 minutes to Bole Airport. Outstanding value!', 'Standard Room'),
        ('t4', 'Sarah & Michael Jenkins', 'Toronto, Canada', 5, 'December 2025', 'Memorable stay for our anniversary', 'From the surprise flower petals in our room to the rejuvenating massage at the spa, everything was flawless. The location in 22 around Golagul made it so easy to get everywhere in the city.', 'Deluxe Room');
      `);
    }

    return NextResponse.json({
      success: true,
      message: 'PostgreSQL database verified and synced successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

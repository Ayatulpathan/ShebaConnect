import { Category } from '../models/Category.js';
import { Service } from '../models/Service.js';
import { logger } from './logger.js';

export const INITIAL_CATEGORIES = [
  {
    slug: 'ac-servicing',
    name: { en: 'AC Servicing and Repair', bn: 'এসি সার্ভিসিং ও মেরামত' },
    description: {
      en: 'Professional split & window air conditioner maintenance, jet wash cleaning, gas refilling, and cooling repair.',
      bn: 'দক্ষ কারিগর দ্বারা স্প্লিট ও উইন্ডো এসি সার্ভিসিং, জেট ওয়াশ ক্লিন, গ্যাস রিফিল এবং কুলিং সমস্যা সমাধান।',
    },
    icon: 'Wind',
    order: 1,
  },
  {
    slug: 'electrical',
    name: { en: 'Electrical Services', bn: 'ইলেকট্রিক্যাল সার্ভিস' },
    description: {
      en: 'Safe circuit repair, short circuit diagnosis, switchboard fitting, and wiring maintenance for homes and offices.',
      bn: 'সার্কিট মেরামত, শর্ট সার্কিট ট্রাবলশুটিং, সুইচবোর্ড ফিটিং এবং বাড়ি ও অফিসের ওয়ারিং মেরামত।',
    },
    icon: 'Zap',
    order: 2,
  },
  {
    slug: 'plumbing',
    name: { en: 'Plumbing', bn: 'প্লাম্বিং সার্ভিস' },
    description: {
      en: 'Pipe leakage repair, basin/sink unblocking, water motor installation, and sanitary fitting services.',
      bn: 'পাইপ লিকেজ মেরামত, বেসিন/সিঙ্ক জ্যাম পরিষ্কার, পানির মোটর স্থাপন এবং স্যানিটারি ফিটিংস।',
    },
    icon: 'Droplets',
    order: 3,
  },
  {
    slug: 'home-cleaning',
    name: { en: 'Home Cleaning', bn: 'বাড়ি পরিষ্কার পরিচ্ছন্নতা' },
    description: {
      en: 'Deep home cleaning, bathroom wash, kitchen degreasing, sofa cleaning, and carpet sanitization.',
      bn: 'সম্পূর্ণ বাসা ডিপ ক্লিনিং, বাথরুম ওয়াশ, কিচেন পরিষ্কার, সোফা ও কার্পেট স্যানিটাইজেশন।',
    },
    icon: 'Sparkles',
    order: 4,
  },
  {
    slug: 'appliance-repair',
    name: { en: 'Appliance Repair', bn: 'হোম অ্যাপ্লায়েন্স মেরামত' },
    description: {
      en: 'Refrigerator, washing machine, microwave oven, and water purifier servicing by certified technicians.',
      bn: 'রেফ্রিজারেটর, ওয়াশিং মেশিন, মাইক্রোওয়েভ ওভেন এবং ওয়াটার পিউরিফায়ার মেরামত।',
    },
    icon: 'Tv',
    order: 5,
  },
  {
    slug: 'carpentry',
    name: { en: 'Carpentry', bn: 'কাঠের কাজ (কার্পেন্ট্রি)' },
    description: {
      en: 'Furniture repair, door lock installation, hinge replacement, and customized wood craftsmanship.',
      bn: 'আসবাবপত্র মেরামত, দরজার লক পরিবর্তন, কব্জা লাগানো এবং নতুন কাঠের কাজ।',
    },
    icon: 'Hammer',
    order: 6,
  },
  {
    slug: 'painting',
    name: { en: 'Painting', bn: 'রং মিস্ত্রির কাজ' },
    description: {
      en: 'Interior & exterior wall painting, waterproof wall putty, weather coating, and enamel woodwork painting.',
      bn: 'অভ্যন্তরীণ ও বাইরের দেয়াল রং, ওয়েদার কোট, পুটিং এবং কাঠের এনামেল পেইন্টিং।',
    },
    icon: 'Brush',
    order: 7,
  },
  {
    slug: 'pest-control',
    name: { en: 'Pest Control', bn: 'পোকামাকড় দমন' },
    description: {
      en: 'Safe, odorless chemical treatment for cockroaches, bedbugs, termites, and mosquitoes.',
      bn: 'তেলাপোকা, ছারপোকা, উইপোকা ও মশার উপদ্রব থেকে নিরাপদ গন্ধহীন পেস্ট কন্ট্রোল সেবা।',
    },
    icon: 'Bug',
    order: 8,
  },
  {
    slug: 'appliance-installation',
    name: { en: 'Appliance Installation', bn: 'অ্যাপ্লায়েন্স ইনস্টলেশন' },
    description: {
      en: 'Mounting and installation of ceiling fans, geysers, TV wall brackets, and kitchen hoods.',
      bn: 'সিলিং ফ্যান, গিজার, টিভি ওয়াল মাউন্ট এবং কিচেন হুড নিখুঁতভাবে স্থাপন।',
    },
    icon: 'Wrench',
    order: 9,
  },
  {
    slug: 'general-maintenance',
    name: { en: 'General Home Maintenance', bn: 'সাধারণ গৃহস্থালী রক্ষণাবেক্ষণ' },
    description: {
      en: 'Curtain rod fixing, shelf mounting, tile grouting, and general handyman odd jobs.',
      bn: 'পর্দার রড ফিটিং, ওয়াল শেলফ লাগানো, টাইলস গ্রাউটিং ও টুকিটাকি ঘরোয়া কাজ।',
    },
    icon: 'Tool',
    order: 10,
  },
];

export const seedInitialMarketplace = async () => {
  try {
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) return;

    logger.info('🌱 Seeding initial 10 ShebaConnect marketplace categories...');

    for (const catData of INITIAL_CATEGORIES) {
      const category = await Category.create(catData);

      // Seed a sample default service for each category in BDT (৳)
      await Service.create({
        name: {
          en: `Standard ${catData.name.en}`,
          bn: `স্ট্যান্ডার্ড ${catData.name.bn}`,
        },
        slug: `standard-${catData.slug}`,
        category: category._id,
        description: catData.description,
        basePrice: 500, // ৳500 BDT starting price
        pricingType: 'STARTING_PRICE',
        estimatedDurationMinutes: 60,
        requirements: ['Electricity supply', 'Water access where applicable'],
        isActive: true,
      });
    }

    logger.info('✅ Initial marketplace categories and services seeded successfully.');
  } catch (error) {
    logger.error({ error }, 'Failed to seed initial marketplace data');
  }
};

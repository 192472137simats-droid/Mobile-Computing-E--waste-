/**
 * VESTIGE Prototype Demo State & Seed Utility
 * Provides realistic archival data, calculated metrics, and interactive flows
 * for testing Patron Bookings, Razorpay Payments, and Vendor Workshop Job Approvals/Denials.
 */

const SEEDED_FLAG_KEY = 'vestige_prototype_seeded_v2';

export const INITIAL_USER_BOOKINGS = [
  {
    id: 'rep-bk-001',
    brand: 'Apple',
    model: 'iPhone 11 Pro',
    deviceType: 'SMARTPHONE',
    status: 'COMPLETED',
    preferredDate: '2026-09-06',
    preferredTime: '11:00 AM',
    estimatedCost: 3500.0,
    vendorBusinessName: 'Aegis Diagnostics Atelier',
    vendorWhatsappNumber: '+919876543210',
    issueDescription: 'Cracked OLED Display & Battery Replacement (>30% degradation)',
    isPaid: false, // Ready for Razorpay payment in User Portal!
    submission: {
      brand: 'Apple',
      model: 'iPhone 11 Pro',
      estimatedRepairCost: 3500.0,
      engineScore: 78,
      engineRecommendation: 'REPAIR',
    },
  },
  {
    id: 'rep-bk-002',
    brand: 'Lenovo',
    model: 'ThinkPad T480',
    deviceType: 'LAPTOP',
    status: 'IN_PROGRESS',
    preferredDate: '2026-09-09',
    preferredTime: '02:30 PM',
    estimatedCost: 2400.0,
    vendorBusinessName: 'Heritage Tech Artisan Atelier',
    vendorWhatsappNumber: '+919876543213',
    issueDescription: 'Motherboard Logic Circuit Repair & USB-C Power Jack Replacement',
    isPaid: false, // Can pay diagnostic advance!
    submission: {
      brand: 'Lenovo',
      model: 'ThinkPad T480',
      estimatedRepairCost: 2400.0,
      engineScore: 65,
      engineRecommendation: 'REPAIR',
    },
  },
  {
    id: 'rep-bk-003',
    brand: 'Sony',
    model: 'WH-1000XM4 Headphones',
    deviceType: 'OTHER',
    status: 'COMPLETED',
    preferredDate: '2026-09-02',
    preferredTime: '04:00 PM',
    estimatedCost: 1800.0,
    vendorBusinessName: 'Aegis Diagnostics Atelier',
    vendorWhatsappNumber: '+919876543210',
    issueDescription: 'Swivel Hinge Fracture & Acoustic Seal Replacement',
    isPaid: true, // Already paid with archival receipt
    receiptId: 'VSTG-PAY-882190',
    submission: {
      brand: 'Sony',
      model: 'WH-1000XM4',
      estimatedRepairCost: 1800.0,
      engineScore: 82,
      engineRecommendation: 'REPAIR',
    },
  },
];

export const INITIAL_USER_RECYCLING = [
  {
    id: 'REC-90142A',
    vendorBusinessName: 'Aegis Circular Logistics & Recovery',
    deviceType: 'SMARTPHONE',
    brand: 'Samsung & Xiaomi',
    model: 'Galaxy S9 & Redmi Note 7',
    pickupAddress: 'Flat 304, Heritage Apartments, 12th Cross, Indiranagar, Bengaluru',
    pickupDate: '2026-09-05',
    pickupTime: '10:00 AM',
    deviceCount: 2,
    status: 'COMPLETED',
    pointsAwarded: 100,
    createdAt: '2026-09-05T10:00:00.000Z',
  },
  {
    id: 'REC-90143B',
    vendorBusinessName: 'EcoRecycle India Dismantlers',
    deviceType: 'LAPTOP',
    brand: 'Dell',
    model: 'Inspiron 15 (2014 Legacy)',
    pickupAddress: 'Flat 304, Heritage Apartments, 12th Cross, Indiranagar, Bengaluru',
    pickupDate: '2026-09-10',
    pickupTime: '11:30 AM',
    deviceCount: 1,
    status: 'SCHEDULED',
    pointsAwarded: 50,
    createdAt: '2026-09-08T08:00:00.000Z',
  },
];

export const INITIAL_VENDOR_REPAIRS = [
  {
    id: 'rep-vnd-001',
    userName: 'Devi Sharma',
    userEmail: 'devi.sharma@example.com',
    userPhone: '+919876543220',
    brand: 'Apple',
    model: 'iPhone 12 Pro Max',
    deviceType: 'SMARTPHONE',
    status: 'PENDING', // Ready for Accept / Decline!
    preferredDate: '2026-09-11',
    preferredTime: '11:30 AM',
    estimatedCost: 4200.0,
    issueDescription: 'Cracked Super Retina OLED & Unresponsive Touch Digitizer after concrete impact',
    createdAt: '2026-09-08T07:15:00.000Z',
  },
  {
    id: 'rep-vnd-002',
    userName: 'Karan Verma',
    userEmail: 'karan.v@example.com',
    userPhone: '+919876543221',
    brand: 'Dell',
    model: 'XPS 15 9500',
    deviceType: 'LAPTOP',
    status: 'IN_PROGRESS', // Ready for Mark Completed!
    preferredDate: '2026-09-09',
    preferredTime: '02:00 PM',
    estimatedCost: 2800.0,
    issueDescription: 'Dual Fan Bearing Noise, Thermal Throttling & Liquid Metal Repaste required',
    createdAt: '2026-09-07T14:30:00.000Z',
  },
  {
    id: 'rep-vnd-003',
    userName: 'Pooja Iyer',
    userEmail: 'pooja.iyer@example.com',
    userPhone: '+919876543222',
    brand: 'OnePlus',
    model: 'OnePlus 9 Pro',
    deviceType: 'SMARTPHONE',
    status: 'ACCEPTED', // Ready for Start Repair!
    preferredDate: '2026-09-10',
    preferredTime: '03:45 PM',
    estimatedCost: 1950.0,
    issueDescription: 'Warp Charge Port loose pins and intermittent fast charge disconnection',
    createdAt: '2026-09-08T06:00:00.000Z',
  },
  {
    id: 'rep-vnd-004',
    userName: 'Archival Patron',
    userEmail: 'user@vestige.internal',
    userPhone: '+919876543210',
    brand: 'Apple',
    model: 'iPhone 11 Pro',
    deviceType: 'SMARTPHONE',
    status: 'COMPLETED',
    preferredDate: '2026-09-06',
    preferredTime: '11:00 AM',
    estimatedCost: 3500.0,
    issueDescription: 'Cracked OLED Display & Battery Replacement (>30% degradation)',
    createdAt: '2026-09-06T09:00:00.000Z',
  },
];

export const INITIAL_VENDOR_RECYCLING = [
  {
    id: 'REC-VND-01',
    userName: 'Vikram Mehta',
    userPhone: '+919876543225',
    pickupAddress: 'Flat 304, Heritage Apartments, 12th Cross, Indiranagar, Bengaluru',
    pickupDate: '2026-09-10',
    pickupTime: '10:00 AM',
    brand: 'Samsung & Xiaomi',
    model: 'Galaxy S9 & Redmi Note 7',
    deviceCount: 2,
    deviceType: 'SMARTPHONE',
    status: 'PENDING', // Ready for Accept / Decline!
  },
  {
    id: 'REC-VND-02',
    userName: 'Sneha Roy',
    userPhone: '+919876543226',
    pickupAddress: '45 Lavelle Road, Shanthala Nagar, Bengaluru',
    pickupDate: '2026-09-09',
    pickupTime: '03:30 PM',
    brand: 'HP Pavilion',
    model: 'dv6 Notebook (Legacy Intel Core 2)',
    deviceCount: 1,
    deviceType: 'LAPTOP',
    status: 'SCHEDULED', // Ready for Confirm Intake!
  },
];

export function ensurePrototypeDataSeeded() {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const isSeeded = localStorage.getItem(SEEDED_FLAG_KEY);
  if (isSeeded) return;

  try {
    // 1. User Bookings
    if (!localStorage.getItem('vestige_user_bookings')) {
      localStorage.setItem('vestige_user_bookings', JSON.stringify(INITIAL_USER_BOOKINGS));
    }

    // 2. User Recycling
    if (!localStorage.getItem('vestige_recycling_requests')) {
      localStorage.setItem('vestige_recycling_requests', JSON.stringify(INITIAL_USER_RECYCLING));
    }

    // 3. User Rewards Balance (250 PTS prototype grant)
    if (!localStorage.getItem('vestige_reward_account')) {
      localStorage.setItem(
        'vestige_reward_account',
        JSON.stringify({
          balance: 250,
          lifetimeEarned: 350,
          lifetimeRedeemed: 100,
        })
      );
    }

    // 4. Vendor Repairs
    if (!localStorage.getItem('vestige_vendor_repairs')) {
      localStorage.setItem('vestige_vendor_repairs', JSON.stringify(INITIAL_VENDOR_REPAIRS));
    }

    // 5. Vendor Recycling
    if (!localStorage.getItem('vestige_vendor_recycling')) {
      localStorage.setItem('vestige_vendor_recycling', JSON.stringify(INITIAL_VENDOR_RECYCLING));
    }

    // 6. Vendor Accreditation Status (VERIFIED by default for demo)
    if (!localStorage.getItem('vestige_vendor_verified')) {
      localStorage.setItem('vestige_vendor_verified', 'true');
    }

    localStorage.setItem(SEEDED_FLAG_KEY, 'true');
  } catch (e) {
    console.warn('Could not seed prototype data:', e);
  }
}

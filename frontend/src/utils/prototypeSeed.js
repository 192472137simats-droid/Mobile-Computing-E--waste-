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

export const INITIAL_ADMIN_USERS = [
  {
    id: 'usr-001',
    fullName: 'Archival Patron',
    email: 'user@vestige.internal',
    role: 'USER',
    active: true,
    createdAt: '2026-08-15T10:00:00.000Z',
  },
  {
    id: 'usr-002',
    fullName: 'Devi Sharma',
    email: 'devi.sharma@example.com',
    role: 'USER',
    active: true,
    createdAt: '2026-08-20T11:30:00.000Z',
  },
  {
    id: 'usr-003',
    fullName: 'Karan Verma',
    email: 'karan.v@example.com',
    role: 'USER',
    active: true,
    createdAt: '2026-08-25T14:15:00.000Z',
  },
  {
    id: 'usr-004',
    fullName: 'Pooja Iyer',
    email: 'pooja.iyer@example.com',
    role: 'USER',
    active: true,
    createdAt: '2026-09-01T09:45:00.000Z',
  },
  {
    id: 'usr-005',
    fullName: 'Aegis Precision Atelier',
    email: 'aegis@vestige.internal',
    role: 'VENDOR',
    active: true,
    createdAt: '2026-08-10T08:00:00.000Z',
  },
  {
    id: 'usr-006',
    fullName: 'EcoRecycle India',
    email: 'ecorecycle@vestige.internal',
    role: 'VENDOR',
    active: true,
    createdAt: '2026-08-18T16:20:00.000Z',
  },
  {
    id: 'usr-007',
    fullName: 'Heritage Tech Artisans',
    email: 'heritage@vestige.internal',
    role: 'VENDOR',
    active: true,
    createdAt: '2026-08-28T12:00:00.000Z',
  },
  {
    id: 'usr-008',
    fullName: 'Silicon Archival Restoration',
    email: 'silicon.craft@example.com',
    role: 'VENDOR',
    active: true,
    createdAt: '2026-09-02T15:10:00.000Z',
  },
  {
    id: 'usr-009',
    fullName: 'VESTIGE Grand Curator',
    email: 'admin@vestige.internal',
    role: 'ADMIN',
    active: true,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
];

export const INITIAL_ADMIN_VENDORS = [
  {
    id: 'vnd-001',
    businessName: 'Aegis Diagnostics Atelier',
    city: 'Bengaluru',
    state: 'Karnataka',
    deviceCategories: ['SMARTPHONE', 'LAPTOP', 'TABLET'],
    verificationStatus: 'VERIFIED',
    rating: 4.9,
    licenseNumber: 'KA-BLR-2025-9921',
    user: { email: 'aegis@vestige.internal' },
    createdAt: '2026-08-10T08:00:00.000Z',
  },
  {
    id: 'vnd-002',
    businessName: 'Heritage Tech Artisan Atelier',
    city: 'Bengaluru',
    state: 'Karnataka',
    deviceCategories: ['LAPTOP', 'OTHER'],
    verificationStatus: 'PENDING',
    rating: 4.8,
    licenseNumber: 'KA-BLR-2026-8910',
    user: { email: 'heritage@vestige.internal' },
    createdAt: '2026-08-28T12:00:00.000Z',
  },
  {
    id: 'vnd-003',
    businessName: 'EcoRecycle India Dismantlers',
    city: 'Mysuru',
    state: 'Karnataka',
    deviceCategories: ['SMARTPHONE', 'LAPTOP', 'DESKTOP'],
    verificationStatus: 'VERIFIED',
    rating: 4.7,
    licenseNumber: 'KA-MYS-2025-4102',
    user: { email: 'ecorecycle@vestige.internal' },
    createdAt: '2026-08-18T16:20:00.000Z',
  },
  {
    id: 'vnd-004',
    businessName: 'Silicon Archival Restoration Works',
    city: 'Hyderabad',
    state: 'Telangana',
    deviceCategories: ['SMARTPHONE', 'LAPTOP'],
    verificationStatus: 'PENDING',
    rating: 4.6,
    licenseNumber: 'TS-HYD-2026-4412',
    user: { email: 'silicon.craft@example.com' },
    createdAt: '2026-09-02T15:10:00.000Z',
  },
];

export const INITIAL_ADMIN_RECYCLING = [
  {
    id: 'REC-90142A',
    userFullName: 'Archival Patron',
    userEmail: 'user@vestige.internal',
    brand: 'Samsung & Xiaomi',
    model: 'Galaxy S9 & Redmi Note 7',
    deviceType: 'SMARTPHONE',
    deviceCount: 2,
    pickupAddress: 'Flat 304, Heritage Apartments, Indiranagar, Bengaluru',
    status: 'COMPLETED',
    pointsAwarded: 100,
    pickupDate: '2026-09-05',
    createdAt: '2026-09-05T10:00:00.000Z',
  },
  {
    id: 'REC-90143B',
    userFullName: 'Devi Sharma',
    userEmail: 'devi.sharma@example.com',
    brand: 'Dell',
    model: 'Inspiron 15 (2014 Legacy)',
    deviceType: 'LAPTOP',
    deviceCount: 1,
    pickupAddress: '22 Richmond Town, Field Marshal Cariappa Rd, Bengaluru',
    status: 'SCHEDULED',
    pointsAwarded: 50,
    pickupDate: '2026-09-10',
    createdAt: '2026-09-08T08:00:00.000Z',
  },
  {
    id: 'REC-90144C',
    userFullName: 'Vikram Mehta',
    userEmail: 'vikram.m@example.com',
    brand: 'Apple & LG',
    model: 'iMac 2011 & 24in Monitor',
    deviceType: 'DESKTOP',
    deviceCount: 3,
    pickupAddress: 'Plot 88, Defence Colony, Indiranagar, Bengaluru',
    status: 'ACCEPTED',
    pointsAwarded: 150,
    pickupDate: '2026-09-11',
    createdAt: '2026-09-08T09:30:00.000Z',
  },
  {
    id: 'REC-90145D',
    userFullName: 'Karan Verma',
    userEmail: 'karan.v@example.com',
    brand: 'Lenovo',
    model: 'ThinkCentre M720 Tiny',
    deviceType: 'DESKTOP',
    deviceCount: 2,
    pickupAddress: '15 Cunningham Road, Vasanth Nagar, Bengaluru',
    status: 'PENDING',
    pointsAwarded: 100,
    pickupDate: '2026-09-12',
    createdAt: '2026-09-08T09:40:00.000Z',
  },
  {
    id: 'REC-90146E',
    userFullName: 'Pooja Iyer',
    userEmail: 'pooja.iyer@example.com',
    brand: 'Apple',
    model: 'iPad 6th Gen (Damaged Battery)',
    deviceType: 'TABLET',
    deviceCount: 1,
    pickupAddress: '7th Block, Koramangala, Bengaluru',
    status: 'COMPLETED',
    pointsAwarded: 50,
    pickupDate: '2026-09-04',
    createdAt: '2026-09-04T11:00:00.000Z',
  },
  {
    id: 'REC-90147F',
    userFullName: 'Sneha Roy',
    userEmail: 'sneha.roy@example.com',
    brand: 'HP',
    model: 'Pavilion dv6 & Cables Bundle',
    deviceType: 'LAPTOP',
    deviceCount: 4,
    pickupAddress: '45 Lavelle Road, Shanthala Nagar, Bengaluru',
    status: 'COMPLETED',
    pointsAwarded: 200,
    pickupDate: '2026-09-03',
    createdAt: '2026-09-03T14:20:00.000Z',
  },
];

export const INITIAL_ADMIN_REWARDS = [
  {
    id: 'rew-001',
    userFullName: 'Archival Patron',
    userEmail: 'user@vestige.internal',
    balance: 250,
    lifetimeEarned: 350,
    lifetimeRedeemed: 100,
    updatedAt: '2026-09-08T08:00:00.000Z',
  },
  {
    id: 'rew-002',
    userFullName: 'Devi Sharma',
    userEmail: 'devi.sharma@example.com',
    balance: 400,
    lifetimeEarned: 450,
    lifetimeRedeemed: 50,
    updatedAt: '2026-09-07T16:00:00.000Z',
  },
  {
    id: 'rew-003',
    userFullName: 'Karan Verma',
    userEmail: 'karan.v@example.com',
    balance: 150,
    lifetimeEarned: 200,
    lifetimeRedeemed: 50,
    updatedAt: '2026-09-06T12:30:00.000Z',
  },
  {
    id: 'rew-004',
    userFullName: 'Pooja Iyer',
    userEmail: 'pooja.iyer@example.com',
    balance: 300,
    lifetimeEarned: 300,
    lifetimeRedeemed: 0,
    updatedAt: '2026-09-08T07:15:00.000Z',
  },
  {
    id: 'rew-005',
    userFullName: 'Vikram Mehta',
    userEmail: 'vikram.m@example.com',
    balance: 500,
    lifetimeEarned: 600,
    lifetimeRedeemed: 100,
    updatedAt: '2026-09-08T09:00:00.000Z',
  },
];

export const INITIAL_ADMIN_REGISTRATION_ACTIVITY = {
  '7d': {
    timeline: [
      { label: '02 Sep', count: 8 },
      { label: '03 Sep', count: 14 },
      { label: '04 Sep', count: 11 },
      { label: '05 Sep', count: 19 },
      { label: '06 Sep', count: 22 },
      { label: '07 Sep', count: 28 },
      { label: '08 Sep', count: 35 },
    ],
    currentPeriodCount: 137,
    previousPeriodCount: 89,
    comparisonMessage: 'Natural registration activity chronology (+53.9% vs previous 7 days)',
  },
  '30d': {
    timeline: [
      { label: 'Week 1', count: 42 },
      { label: 'Week 2', count: 65 },
      { label: 'Week 3', count: 88 },
      { label: 'Week 4', count: 115 },
    ],
    currentPeriodCount: 310,
    previousPeriodCount: 204,
    comparisonMessage: 'Natural registration activity chronology (+52.0% vs prior month)',
  },
  '6m': {
    timeline: [
      { label: 'Apr', count: 120 },
      { label: 'May', count: 185 },
      { label: 'Jun', count: 260 },
      { label: 'Jul', count: 340 },
      { label: 'Aug', count: 430 },
      { label: 'Sep', count: 540 },
    ],
    currentPeriodCount: 1875,
    previousPeriodCount: 1150,
    comparisonMessage: 'Natural registration activity chronology (+63.0% over prior semi-annual)',
  },
  '12m': {
    timeline: [
      { label: 'Oct', count: 60 },
      { label: 'Nov', count: 85 },
      { label: 'Dec', count: 110 },
      { label: 'Jan', count: 160 },
      { label: 'Feb', count: 210 },
      { label: 'Mar', count: 275 },
      { label: 'Apr', count: 340 },
      { label: 'May', count: 420 },
      { label: 'Jun', count: 530 },
      { label: 'Jul', count: 670 },
      { label: 'Aug', count: 810 },
      { label: 'Sep', count: 980 },
    ],
    currentPeriodCount: 4650,
    previousPeriodCount: 2200,
    comparisonMessage: 'Natural registration activity chronology (+111.4% annual growth)',
  },
};

export const INITIAL_ADMIN_KPIS = {
  totalUsers: 148,
  activeUsers: 142,
  totalVendors: 4,
  completedRepairs: 47,
  completedRecycling: 112,
  totalPointsAwarded: 5600,
  totalCarbonDivertedKg: 1840,
};

export const INITIAL_ADMIN_REPAIRS = [
  {
    id: 'REP-88A101',
    userFullName: 'Archival Patron',
    userEmail: 'user@vestige.internal',
    brand: 'Apple',
    model: 'iPhone 11 Pro',
    deviceType: 'SMARTPHONE',
    vendorBusinessName: 'Aegis Diagnostics Atelier',
    estimatedCost: 3500.0,
    status: 'COMPLETED',
    createdAt: '2026-09-02T10:00:00.000Z',
  },
  {
    id: 'REP-88A102',
    userFullName: 'Devi Sharma',
    userEmail: 'devi.sharma@example.com',
    brand: 'Apple',
    model: 'iPhone 12 Pro Max',
    deviceType: 'SMARTPHONE',
    vendorBusinessName: 'Aegis Diagnostics Atelier',
    estimatedCost: 4200.0,
    status: 'PENDING',
    createdAt: '2026-09-08T07:15:00.000Z',
  },
  {
    id: 'REP-88A103',
    userFullName: 'Karan Verma',
    userEmail: 'karan.v@example.com',
    brand: 'Dell',
    model: 'XPS 15 9500',
    deviceType: 'LAPTOP',
    vendorBusinessName: 'Heritage Tech Artisan Atelier',
    estimatedCost: 2800.0,
    status: 'IN_PROGRESS',
    createdAt: '2026-09-07T14:30:00.000Z',
  },
  {
    id: 'REP-88A104',
    userFullName: 'Pooja Iyer',
    userEmail: 'pooja.iyer@example.com',
    brand: 'OnePlus',
    model: 'OnePlus 9 Pro',
    deviceType: 'SMARTPHONE',
    vendorBusinessName: 'Aegis Diagnostics Atelier',
    estimatedCost: 1950.0,
    status: 'ACCEPTED',
    createdAt: '2026-09-08T06:00:00.000Z',
  },
];

export const INITIAL_ADMIN_PAYMENTS = {
  totalRevenue: 142500.0,
  successfulPayments: 38,
  pendingPayments: 4,
  failedPayments: 1,
  revenueOverTime: [
    { label: 'Apr', count: 14500 },
    { label: 'May', count: 18200 },
    { label: 'Jun', count: 24000 },
    { label: 'Jul', count: 27800 },
    { label: 'Aug', count: 32500 },
    { label: 'Sep', count: 25500 },
  ],
  recentTransactions: [
    {
      id: 'pay-001',
      userFullName: 'Archival Patron',
      userEmail: 'user@vestige.internal',
      amount: 3500.0,
      status: 'SETTLED',
      providerOrderId: 'order_PVstg9901',
      createdAt: '2026-09-06T11:45:00.000Z',
    },
    {
      id: 'pay-002',
      userFullName: 'Devi Sharma',
      userEmail: 'devi.sharma@example.com',
      amount: 4200.0,
      status: 'SETTLED',
      providerOrderId: 'order_PVstg9902',
      createdAt: '2026-09-05T14:10:00.000Z',
    },
    {
      id: 'pay-003',
      userFullName: 'Karan Verma',
      userEmail: 'karan.v@example.com',
      amount: 2800.0,
      status: 'SETTLED',
      providerOrderId: 'order_PVstg9903',
      createdAt: '2026-09-04T16:25:00.000Z',
    },
    {
      id: 'pay-004',
      userFullName: 'Pooja Iyer',
      userEmail: 'pooja.iyer@example.com',
      amount: 1950.0,
      status: 'PENDING',
      providerOrderId: 'order_PVstg9904',
      createdAt: '2026-09-08T06:15:00.000Z',
    },
  ],
};

export function ensurePrototypeDataSeeded() {
  if (typeof window === 'undefined' || !window.localStorage) return;

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

    // 7. Admin Users Registry
    if (!localStorage.getItem('vestige_admin_users')) {
      localStorage.setItem('vestige_admin_users', JSON.stringify(INITIAL_ADMIN_USERS));
    }

    // 8. Admin Vendors Registry
    if (!localStorage.getItem('vestige_admin_vendors')) {
      localStorage.setItem('vestige_admin_vendors', JSON.stringify(INITIAL_ADMIN_VENDORS));
    }

    // 9. Admin Recycling Custody
    if (!localStorage.getItem('vestige_admin_recycling')) {
      localStorage.setItem('vestige_admin_recycling', JSON.stringify(INITIAL_ADMIN_RECYCLING));
    }

    // 10. Admin Rewards Accounts
    if (!localStorage.getItem('vestige_admin_rewards')) {
      localStorage.setItem('vestige_admin_rewards', JSON.stringify(INITIAL_ADMIN_REWARDS));
    }

    // 11. Admin Registration Activity
    if (!localStorage.getItem('vestige_admin_registration_activity')) {
      localStorage.setItem('vestige_admin_registration_activity', JSON.stringify(INITIAL_ADMIN_REGISTRATION_ACTIVITY));
    }

    // 12. Admin KPIs Overview
    if (!localStorage.getItem('vestige_admin_kpis')) {
      localStorage.setItem('vestige_admin_kpis', JSON.stringify(INITIAL_ADMIN_KPIS));
    }

    // 13. Admin Payments Ledger
    if (!localStorage.getItem('vestige_admin_payments')) {
      localStorage.setItem('vestige_admin_payments', JSON.stringify(INITIAL_ADMIN_PAYMENTS));
    }

    // 14. Admin Repairs
    if (!localStorage.getItem('vestige_admin_repairs')) {
      localStorage.setItem('vestige_admin_repairs', JSON.stringify(INITIAL_ADMIN_REPAIRS));
    }

    // 15. Real-Time Platform Activities (User & Vendor event stream)
    if (!localStorage.getItem('vestige_platform_activities')) {
      localStorage.setItem('vestige_platform_activities', JSON.stringify(INITIAL_PLATFORM_ACTIVITIES));
    }
  } catch (e) {
    console.warn('Could not seed prototype data:', e);
  }
}

export const INITIAL_PLATFORM_ACTIVITIES = [
  {
    id: 'act-001',
    timestamp: '2026-09-08T07:15:00.000Z',
    actorRole: 'USER',
    actorName: 'Devi Sharma',
    actorEmail: 'devi.sharma@example.com',
    actionType: 'REPAIR_BOOKED',
    category: 'REPAIR',
    description: 'Submitted repair booking for Apple iPhone 12 Pro Max (Cracked OLED)',
    targetEntity: 'RepairBooking',
    targetId: 'REP-88A102',
    details: 'Quoted: ₹4,200 • Assigned Workshop: Aegis Diagnostics Atelier',
    badge: 'USER',
    status: 'PENDING',
  },
  {
    id: 'act-002',
    timestamp: '2026-09-08T06:00:00.000Z',
    actorRole: 'VENDOR',
    actorName: 'Aegis Diagnostics Atelier',
    actorEmail: 'aegis@vestige.internal',
    actionType: 'JOB_ACCEPTED',
    category: 'REPAIR',
    description: 'Accepted diagnostic restoration job for OnePlus 9 Pro (Charging port loose)',
    targetEntity: 'RepairBooking',
    targetId: 'REP-88A104',
    details: 'Estimate: ₹1,950 • Patron: Pooja Iyer',
    badge: 'VENDOR',
    status: 'ACCEPTED',
  },
  {
    id: 'act-003',
    timestamp: '2026-09-07T14:30:00.000Z',
    actorRole: 'VENDOR',
    actorName: 'Heritage Tech Artisan Atelier',
    actorEmail: 'heritage@vestige.internal',
    actionType: 'WORKBENCH_ACTIVE',
    category: 'REPAIR',
    description: 'Started thermal repaste and motherboard circuit servicing on Dell XPS 15',
    targetEntity: 'RepairBooking',
    targetId: 'REP-88A103',
    details: 'Estimate: ₹2,800 • Patron: Karan Verma',
    badge: 'VENDOR',
    status: 'IN_PROGRESS',
  },
  {
    id: 'act-004',
    timestamp: '2026-09-06T11:45:00.000Z',
    actorRole: 'USER',
    actorName: 'Archival Patron',
    actorEmail: 'user@vestige.internal',
    actionType: 'PAYMENT_SETTLED',
    category: 'PAYMENTS',
    description: 'Completed Razorpay payment for iPhone 11 Pro repair bill',
    targetEntity: 'PaymentTransaction',
    targetId: 'order_PVstg9901',
    details: 'Amount: ₹3,500.00 • Receipt: #VSTG-PAY-882190',
    badge: 'USER',
    status: 'SETTLED',
  },
  {
    id: 'act-005',
    timestamp: '2026-09-05T10:00:00.000Z',
    actorRole: 'USER',
    actorName: 'Archival Patron',
    actorEmail: 'user@vestige.internal',
    actionType: 'RECYCLING_SCHEDULED',
    category: 'RECYCLING',
    description: 'Scheduled zero-landfill pickup for 2 devices (Galaxy S9 & Redmi Note 7)',
    targetEntity: 'RecyclingRequest',
    targetId: 'REC-90142A',
    details: 'Earned +100 Circular Reward Points • Indiranagar doorstep pickup',
    badge: 'USER',
    status: 'COMPLETED',
  },
  {
    id: 'act-006',
    timestamp: '2026-09-04T16:20:00.000Z',
    actorRole: 'VENDOR',
    actorName: 'EcoRecycle India Dismantlers',
    actorEmail: 'ecorecycle@vestige.internal',
    actionType: 'DISMANTLE_VERIFIED',
    category: 'RECYCLING',
    description: 'Certified intake and circular dismantling of 4 laptops and peripheral cables',
    targetEntity: 'RecyclingRequest',
    targetId: 'REC-90147F',
    details: 'Recovered: 240g precious metals • Landfill diversion certified',
    badge: 'VENDOR',
    status: 'COMPLETED',
  },
  {
    id: 'act-007',
    timestamp: '2026-09-03T12:00:00.000Z',
    actorRole: 'USER',
    actorName: 'Devi Sharma',
    actorEmail: 'devi.sharma@example.com',
    actionType: 'REWARD_REDEEMED',
    category: 'REWARDS',
    description: 'Redeemed 50 Circular Reward Points for 10% workshop repair discount voucher',
    targetEntity: 'RewardVoucher',
    targetId: 'VCH-9921',
    details: 'Remaining Balance: 400 PTS • Atelier: Aegis Diagnostics',
    badge: 'USER',
    status: 'CONFIRMED',
  },
  {
    id: 'act-008',
    timestamp: '2026-09-02T15:10:00.000Z',
    actorRole: 'VENDOR',
    actorName: 'Silicon Archival Restoration Works',
    actorEmail: 'silicon.craft@example.com',
    actionType: 'ACCREDITATION_APPLIED',
    category: 'ACCREDITATION',
    description: 'Submitted partner workshop trade license TS-HYD-2026-4412 for audit',
    targetEntity: 'VendorProfile',
    targetId: 'vnd-004',
    details: 'Categories: Smartphones, Laptops • Hyderabad workshop facility',
    badge: 'VENDOR',
    status: 'PENDING',
  },
  {
    id: 'act-009',
    timestamp: '2026-09-01T09:00:00.000Z',
    actorRole: 'ADMIN',
    actorName: 'VESTIGE Grand Curator',
    actorEmail: 'admin@vestige.internal',
    actionType: 'ACCREDITATION_VERIFIED',
    category: 'ACCREDITATION',
    description: 'Accredited and approved Aegis Diagnostics Atelier trade credentials',
    targetEntity: 'VendorProfile',
    targetId: 'vnd-001',
    details: 'Status updated to VERIFIED • Trade license KA-BLR-2025-9921 approved',
    badge: 'ADMIN',
    status: 'APPROVED',
  },
];

export function logPlatformActivity(activity) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const list = JSON.parse(localStorage.getItem('vestige_platform_activities') || '[]');
    const newEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...activity,
    };
    list.unshift(newEntry);
    localStorage.setItem('vestige_platform_activities', JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.warn('Could not log activity:', e);
  }
}



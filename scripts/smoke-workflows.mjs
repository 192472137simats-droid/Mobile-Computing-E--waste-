// Creates real demo records. Run only against a disposable or explicitly approved environment.
const baseUrl = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:8088').replace(/\/+$/, '');
const local = /^(localhost|127\.0\.0\.1)$/.test(new URL(baseUrl).hostname);
if (!process.argv.includes('--write')) {
  throw new Error('This check creates bookings and rewards. Pass --write to continue.');
}

const credentials = {
  user: [process.env.SMOKE_USER_EMAIL || (local && 'user@vestige.internal'), process.env.SMOKE_USER_PASSWORD || (local && 'User@123')],
  vendor: [process.env.SMOKE_VENDOR_EMAIL || (local && 'aegis@vestige.internal'), process.env.SMOKE_VENDOR_PASSWORD || (local && 'Vendor@123')],
  admin: [process.env.SMOKE_ADMIN_EMAIL || (local && 'admin@vestige.internal'), process.env.SMOKE_ADMIN_PASSWORD || (local && 'Admin@123')],
};
if (Object.values(credentials).some(([email, password]) => !email || !password)) {
  throw new Error('Set SMOKE_USER_*, SMOKE_VENDOR_*, and SMOKE_ADMIN_* credentials for nonlocal environments.');
}

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(`${method} ${path}: HTTP ${response.status} ${payload?.message || ''}`);
  }
  return payload?.data;
}

async function login([email, password], expectedRole) {
  const data = await request('/auth/login', { method: 'POST', body: { email, password, expectedRole } });
  if (!data?.token || data.profile?.role !== expectedRole) throw new Error(`${expectedRole} sign-in failed`);
  return data;
}

await request('/health/readiness');
const [user, vendor, admin] = await Promise.all([
  login(credentials.user, 'USER'), login(credentials.vendor, 'VENDOR'), login(credentials.admin, 'ADMIN'),
]);
const vendorId = vendor.profile.vendorProfile?.id;
if (!vendorId || vendor.profile.vendorProfile?.verificationStatus !== 'VERIFIED') {
  throw new Error('The smoke vendor must be verified before creating work.');
}
const marker = `SMOKE-${Date.now()}`;
const submission = await request('/devices/assess', {
  method: 'POST', token: user.token,
  body: {
    deviceType: 'SMARTPHONE', brand: 'Smoke Test', model: marker, deviceAgeYears: 2,
    condition: 'GOOD', knownIssues: ['battery'], estimatedRepairCost: 1200,
    originalValue: 15000, partAvailability: 'AVAILABLE',
  },
});
if (!submission?.id) throw new Error('Device assessment did not return an ID');

const preferredDate = new Date(Date.now() + 86_400_000 * 2).toISOString().slice(0, 10);
const repair = await request('/repairs', {
  method: 'POST', token: user.token,
  body: { vendorId, submissionId: submission.id, preferredDate, issueDescription: marker },
});
if (!repair?.id) throw new Error('Repair booking did not return an ID');
const vendorQueue = await request(`/repairs/vendor/${vendorId}`, { token: vendor.token });
if (!vendorQueue.some((item) => item.id === repair.id)) throw new Error('Repair absent from vendor queue');
for (const status of ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED']) {
  await request(`/repairs/${repair.id}/status`, {
    method: 'PATCH', token: vendor.token, body: { status, notes: marker },
  });
}
const myRepairs = await request('/repairs/my', { token: user.token });
if (!myRepairs.some((item) => item.id === repair.id && item.status === 'COMPLETED')) {
  throw new Error('Completed repair absent from user history');
}

const beforeBalance = await request('/rewards/balance', { token: user.token });
const recycling = await request('/recycling', {
  method: 'POST', token: user.token,
  body: { vendorId, submissionId: submission.id, pickupAddress: 'Smoke test address', pickupDate: preferredDate, deviceCount: 1 },
});
if (!recycling?.id) throw new Error('Recycling request did not return an ID');
const recyclingQueue = await request(`/recycling/vendor/${vendorId}`, { token: vendor.token });
if (!recyclingQueue.some((item) => item.id === recycling.id)) throw new Error('Recycling absent from vendor queue');
for (const status of ['ACCEPTED', 'COMPLETED']) {
  await request(`/recycling/${recycling.id}/status`, {
    method: 'PATCH', token: vendor.token, body: { status, notes: marker },
  });
}
const myRecycling = await request('/recycling/my', { token: user.token });
if (!myRecycling.some((item) => item.id === recycling.id && item.status === 'COMPLETED')) {
  throw new Error('Completed recycling absent from user history');
}
const afterBalance = await request('/rewards/balance', { token: user.token });
if (Number(afterBalance) <= Number(beforeBalance)) throw new Error('Recycling did not increase reward balance');
const allRepairs = await request('/repairs/all', { token: admin.token });
if (!allRepairs.some((item) => item.id === repair.id)) throw new Error('Admin cannot see completed repair');

console.log(`Workflow passed: ${marker} (assessment, repair, recycling, rewards, admin visibility).`);

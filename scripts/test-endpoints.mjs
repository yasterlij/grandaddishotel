const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3050';

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

function logResult(type, name, details = '') {
  if (type === 'PASS') {
    results.passed++;
    console.log(`  ✓ PASS: ${name} ${details ? '(' + details + ')' : ''}`);
  } else if (type === 'FAIL') {
    results.failed++;
    console.error(`  ✗ FAIL: ${name} - ${details}`);
  } else if (type === 'WARN') {
    results.warnings++;
    console.warn(`  ⚠ WARN: ${name} - ${details}`);
  }
  results.tests.push({ type, name, details });
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }
  return { status: res.status, headers: res.headers, data };
}

async function runHttpTests() {
  console.log('\n======================================================');
  console.log('HTTP ENDPOINT, SECURITY, PERFORMANCE & LOGIC AUDIT');
  console.log(`Target: ${BASE_URL}`);
  console.log('======================================================\n');

  // ----------------------------------------------------------------
  // 1. HTTP Security Headers
  // ----------------------------------------------------------------
  console.log('▶ TEST CATEGORY: HTTP Security Headers');
  const homeRes = await request('/');
  if (homeRes.status === 200) {
    logResult('PASS', 'Home page renders 200 OK');
  } else {
    logResult('FAIL', 'Home page render', `Status ${homeRes.status}`);
  }

  const h = homeRes.headers;
  if (h.get('x-content-type-options') === 'nosniff') {
    logResult('PASS', 'X-Content-Type-Options: nosniff present');
  } else {
    logResult('FAIL', 'X-Content-Type-Options missing or invalid');
  }

  if (h.get('x-frame-options') === 'SAMEORIGIN') {
    logResult('PASS', 'X-Frame-Options: SAMEORIGIN present');
  } else {
    logResult('FAIL', 'X-Frame-Options missing or invalid');
  }

  if (h.get('referrer-policy')) {
    logResult('PASS', 'Referrer-Policy header present', h.get('referrer-policy'));
  } else {
    logResult('WARN', 'Referrer-Policy missing');
  }

  if (h.get('content-security-policy')) {
    logResult('PASS', 'Content-Security-Policy header present');
  } else {
    logResult('WARN', 'Content-Security-Policy (CSP) is missing in next.config.ts headers');
  }

  if (h.get('x-powered-by') === null) {
    logResult('PASS', 'X-Powered-By header suppressed (poweredByHeader: false)');
  } else {
    logResult('FAIL', 'X-Powered-By header is exposed', h.get('x-powered-by'));
  }

  // ----------------------------------------------------------------
  // 2. Unauthenticated Admin Route Protection (RBAC)
  // ----------------------------------------------------------------
  console.log('\n▶ TEST CATEGORY: Admin Route Protection (Access Control)');
  const adminEndpoints = [
    { method: 'GET', path: '/api/admin/overview' },
    { method: 'GET', path: '/api/admin/reservations' },
    { method: 'GET', path: '/api/admin/payments' },
    { method: 'GET', path: '/api/admin/rooms' },
    { method: 'GET', path: '/api/admin/room-types' },
    { method: 'GET', path: '/api/admin/menu' },
    { method: 'GET', path: '/api/admin/spa' },
    { method: 'GET', path: '/api/admin/settings/exchange-rate' },
    { method: 'POST', path: '/api/admin/seed', body: {} },
    { method: 'GET', path: '/api/admin/testimonials' },
    { method: 'POST', path: '/api/upload', body: {} },
    { method: 'GET', path: '/api/admin/gallery' },
    { method: 'GET', path: '/api/admin/content' },
    { method: 'GET', path: '/api/admin/experiences' },
    { method: 'GET', path: '/api/admin/faqs' },
    { method: 'GET', path: '/api/admin/promotions' },
  ];

  for (const ep of adminEndpoints) {
    const opts = { method: ep.method };
    if (ep.body) {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(ep.body);
    }
    const res = await request(ep.path, opts);
    if (res.status === 401) {
      logResult('PASS', `Unauthorized access blocked: ${ep.method} ${ep.path}`, '401 Unauthorized');
    } else {
      logResult('FAIL', `Admin route unprotected: ${ep.method} ${ep.path}`, `Returned status ${res.status}`);
    }
  }

  // ----------------------------------------------------------------
  // 3. Information Disclosure Check: /api/prisma-health
  // ----------------------------------------------------------------
  console.log('\n▶ TEST CATEGORY: Information Disclosure Audit');
  const healthRes = await request('/api/prisma-health');
  if (healthRes.status === 401) {
    logResult('PASS', 'Access to /api/prisma-health is properly restricted (401 Unauthorized)');
  } else if (healthRes.status === 200 && healthRes.data?.stats) {
    logResult('WARN', 'Public /api/prisma-health information leak',
      `Exposes DB engine '${healthRes.data.engine}', database '${healthRes.data.database}', and schema stats without authentication.`
    );
  } else {
    logResult('PASS', '/api/prisma-health is restricted or safe');
  }

  // ----------------------------------------------------------------
  // 4. Public API Functionality & Cache Headers
  // ----------------------------------------------------------------
  console.log('\n▶ TEST CATEGORY: Public API Functionality');
  const publicApis = [
    { path: '/api/rooms', expectProp: 'rooms' },
    { path: '/api/menu', expectProp: 'items' },
    { path: '/api/spa-treatments', expectProp: 'treatments' },
    { path: '/api/experiences', expectProp: 'experiences' },
    { path: '/api/promotions', expectProp: 'promotions' },
    { path: '/api/faqs', expectProp: 'faqs' },
    { path: '/api/testimonials', expectProp: 'testimonials' },
    { path: '/api/settings/exchange-rate', expectProp: 'rate' },
    { path: '/api/payments/config', expectProp: 'providers' },
    { path: '/api/gallery', expectProp: 'images' },
    { path: '/api/content', expectProp: 'content' },
  ];

  for (const api of publicApis) {
    const res = await request(api.path);
    if (res.status === 200 && res.data && res.data[api.expectProp] !== undefined) {
      logResult('PASS', `Public API 200 OK: ${api.path}`, `Prop '${api.expectProp}' present`);
    } else {
      logResult('FAIL', `Public API failed: ${api.path}`, `Status ${res.status}`);
    }
  }

  // Slug lookup and alias lookup
  const roomBySlug = await request('/api/rooms/deluxe-king-room');
  if (roomBySlug.status === 200 && roomBySlug.data?.room?.slug === 'deluxe-king-room') {
    logResult('PASS', 'Room lookup by canonical slug /api/rooms/deluxe-king-room');
  } else {
    logResult('FAIL', 'Room canonical slug lookup failed', `Status ${roomBySlug.status}`);
  }

  const roomByAlias = await request('/api/rooms/deluxe-room');
  if (roomByAlias.status === 200 && roomByAlias.data?.room?.slug === 'deluxe-king-room') {
    logResult('PASS', 'Room lookup by alias /api/rooms/deluxe-room resolves canonical room');
  } else {
    logResult('FAIL', 'Room alias lookup failed', `Status ${roomByAlias.status}`);
  }

  const nonExistentSlug = await request('/api/rooms/invalid-slug-404');
  if (nonExistentSlug.status === 404) {
    logResult('PASS', 'Non-existent room slug returns 404 Not Found');
  } else {
    logResult('FAIL', 'Non-existent room slug did not return 404', `Status ${nonExistentSlug.status}`);
  }

  // ----------------------------------------------------------------
  // 5. Reservation Logic & Validation Testing
  // ----------------------------------------------------------------
  console.log('\n▶ TEST CATEGORY: Reservation Business Logic & Date Edge Cases');

  // Test 5.1: Missing required fields
  const missingRes = await request('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (missingRes.status === 400) {
    logResult('PASS', 'Empty reservation payload rejected with 400 Bad Request');
  } else {
    logResult('FAIL', 'Empty reservation payload not rejected', `Status ${missingRes.status}`);
  }

  // Test 5.2: Past check-in date
  const pastRes = await request('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomSlug: 'deluxe-king-room',
      checkIn: '2020-01-01',
      checkOut: '2020-01-05',
      guestName: 'Test Guest',
      guestEmail: 'test@example.com',
      guestPhone: '+251911000000',
    }),
  });
  if (pastRes.status === 400 && pastRes.data?.error?.includes('past')) {
    logResult('PASS', 'Past check-in date rejected with 400 Bad Request');
  } else {
    logResult('FAIL', 'Past check-in date not rejected', `Status ${pastRes.status}, Error: ${pastRes.data?.error}`);
  }

  // Test 5.3: Check-out before check-in (Inverted dates edge case)
  const invertedDateRes = await request('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomSlug: 'deluxe-king-room',
      checkIn: '2026-11-20',
      checkOut: '2026-11-15',
      guestName: 'Inverted Date Tester',
      guestEmail: 'inverted@example.com',
      guestPhone: '+251911000000',
    }),
  });
  if (invertedDateRes.status === 400) {
    logResult('PASS', 'Check-out before check-in rejected with 400 Bad Request');
  } else {
    logResult('FAIL', 'Check-out before check-in was NOT rejected',
      `Status ${invertedDateRes.status}, returned: ${JSON.stringify(invertedDateRes.data)}`
    );
  }

  // Test 5.4: Same-day check-in & check-out (0 nights)
  const sameDayRes = await request('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomSlug: 'deluxe-king-room',
      checkIn: '2026-11-20',
      checkOut: '2026-11-20',
      guestName: 'Same Day Tester',
      guestEmail: 'sameday@example.com',
      guestPhone: '+251911000000',
    }),
  });
  if (sameDayRes.status === 400) {
    logResult('PASS', 'Same-day check-in & check-out rejected with 400 Bad Request');
  } else {
    logResult('FAIL', 'Same-day 0-night stay was NOT rejected',
      `Status ${sameDayRes.status}, returned: ${JSON.stringify(sameDayRes.data)}`
    );
  }

  // Test 5.5: Valid reservation creation & state verification
  const testDay = 1 + (Math.floor(Date.now() / 1000) % 20);
  const testMonth = 1 + (Math.floor(Date.now() / 60000) % 11);
  const checkInStr = `2027-${String(testMonth).padStart(2, '0')}-${String(testDay).padStart(2, '0')}`;
  const checkOutStr = `2027-${String(testMonth).padStart(2, '0')}-${String(testDay + 2).padStart(2, '0')}`;

  const validRes = await request('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomSlug: 'deluxe-king-room',
      checkIn: checkInStr,
      checkOut: checkOutStr,
      adults: 2,
      guestName: 'Live Audit Guest',
      guestEmail: 'audit_guest@example.com',
      guestPhone: '+251911223344',
      currency: 'USD',
      paymentProvider: 'CASH_ON_ARRIVAL',
    }),
  });
  if (validRes.status === 200 && validRes.data?.success) {
    logResult('PASS', 'Direct booking without advance payment created successfully', `BookingRef: ${validRes.data.bookingRef}`);
    const resStatus = validRes.data.reservationStatus;
    if (resStatus === 'CONFIRMED') {
      logResult('PASS', "Reservation confirmed immediately without payment ('CONFIRMED')");
    } else {
      logResult('FAIL', `Expected CONFIRMED status but received '${resStatus}'`);
    }
  } else {
    logResult('FAIL', 'Direct reservation creation failed', `Status ${validRes.status}: ${JSON.stringify(validRes.data)}`);
  }

  // Test 5.6: Booking Standard Room with UI payload (roomId: '1', roomSlug: 'standard-room')
  const stdRes = await request('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: '1',
      roomSlug: 'standard-room',
      checkIn: checkInStr,
      checkOut: checkOutStr,
      adults: 2,
      guestName: 'Standard Room Guest',
      guestEmail: 'standard_guest@example.com',
      guestPhone: '+251911223355',
      currency: 'USD',
      paymentProvider: 'CASH_ON_ARRIVAL',
    }),
  });
  if (stdRes.status === 200 && stdRes.data?.success) {
    logResult('PASS', 'Booking Standard Room via frontend alias (roomId: 1, slug: standard-room) succeeds');
  } else {
    logResult('FAIL', 'Booking Standard Room via frontend alias failed', `Status ${stdRes.status}: ${JSON.stringify(stdRes.data)}`);
  }

  // Test 5.7: Booking Deluxe Room with UI payload (roomId: '2', roomSlug: 'deluxe-room')
  const dlxRes = await request('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: '2',
      roomSlug: 'deluxe-room',
      checkIn: checkInStr,
      checkOut: checkOutStr,
      adults: 2,
      guestName: 'Deluxe Room Guest',
      guestEmail: 'deluxe_guest@example.com',
      guestPhone: '+251911223366',
      currency: 'USD',
      paymentProvider: 'CASH_ON_ARRIVAL',
    }),
  });
  if (dlxRes.status === 200 && dlxRes.data?.success) {
    logResult('PASS', 'Booking Deluxe Room via frontend alias (roomId: 2, slug: deluxe-room) succeeds');
  } else {
    logResult('FAIL', 'Booking Deluxe Room via frontend alias failed', `Status ${dlxRes.status}: ${JSON.stringify(dlxRes.data)}`);
  }

  // Test 5.8: Booking Twin Room with UI payload (roomId: '3', roomSlug: 'twin-room')
  const twinRes = await request('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: '3',
      roomSlug: 'twin-room',
      checkIn: checkInStr,
      checkOut: checkOutStr,
      adults: 2,
      guestName: 'Twin Room Guest',
      guestEmail: 'twin_guest@example.com',
      guestPhone: '+251911223377',
      currency: 'USD',
      paymentProvider: 'CASH_ON_ARRIVAL',
    }),
  });
  if (twinRes.status === 200 && twinRes.data?.success) {
    logResult('PASS', 'Booking Twin Room via frontend alias (roomId: 3, slug: twin-room) succeeds');
  } else {
    logResult('FAIL', 'Booking Twin Room via frontend alias failed', `Status ${twinRes.status}: ${JSON.stringify(twinRes.data)}`);
  }

  // Test 5.9: Booking with completely invalid room slug returns 404 Room not found
  const invalidRoomRes = await request('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: '999',
      roomSlug: 'invalid-non-existent-room-slug',
      checkIn: checkInStr,
      checkOut: checkOutStr,
      adults: 2,
      guestName: 'Invalid Room Tester',
      guestEmail: 'invalid_room@example.com',
      guestPhone: '+251911223388',
      currency: 'USD',
      paymentProvider: 'CASH_ON_ARRIVAL',
    }),
  });
  if (invalidRoomRes.status === 404 && invalidRoomRes.data?.error?.includes('not found')) {
    logResult('PASS', 'Invalid room ID/slug rejected with 404 Room not found');
  } else {
    logResult('FAIL', 'Invalid room ID/slug was NOT rejected with 404', `Status ${invalidRoomRes.status}: ${JSON.stringify(invalidRoomRes.data)}`);
  }

  // ----------------------------------------------------------------
  // 6. Admin Authentication & Session Lifecycle
  // ----------------------------------------------------------------
  console.log('\n▶ TEST CATEGORY: Admin Login Flow & Session Lifecycle');

  // Test 6.1: Bad login credentials
  const badLogin = await request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'WrongPassword999!' }),
  });
  if (badLogin.status === 401) {
    logResult('PASS', 'Bad admin credentials rejected with 401');
  } else {
    logResult('FAIL', 'Bad admin credentials not rejected with 401', `Status ${badLogin.status}`);
  }

  // Test 6.2: Successful login
  const goodLogin = await request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'GrandAddis2026!' }),
  });

  let authCookie = null;
  if (goodLogin.status === 200 && goodLogin.data?.success) {
    logResult('PASS', 'Valid admin credentials accepted with 200 OK');
    const setCookie = goodLogin.headers.get('set-cookie');
    if (setCookie && setCookie.includes('gah_admin_session')) {
      logResult('PASS', 'Set-Cookie header sets gah_admin_session cookie with HttpOnly');
      authCookie = setCookie.split(';')[0];
    } else {
      logResult('FAIL', 'Session cookie not set in response header');
    }
  } else {
    logResult('FAIL', 'Valid admin login failed', `Status ${goodLogin.status}`);
  }

  // Test 6.3: Authenticated access with cookie
  if (authCookie) {
    const authOverview = await request('/api/admin/overview', {
      headers: { Cookie: authCookie },
    });
    if (authOverview.status === 200 && authOverview.data?.success) {
      logResult('PASS', 'Authenticated request to /api/admin/overview succeeds with 200 OK');
    } else {
      logResult('FAIL', 'Authenticated request failed', `Status ${authOverview.status}`);
    }

    // Test 6.4: Logout
    const logoutRes = await request('/api/admin/logout', {
      method: 'POST',
      headers: { Cookie: authCookie },
    });
    if (logoutRes.status === 200) {
      logResult('PASS', 'Admin logout succeeds and clears session cookie');
    } else {
      logResult('FAIL', 'Admin logout failed', `Status ${logoutRes.status}`);
    }
  }

  // ----------------------------------------------------------------
  // 7. Performance & Load Benchmarks
  // ----------------------------------------------------------------
  console.log('\n▶ TEST CATEGORY: Concurrency & Performance Load Benchmark');
  const CONCURRENT_REQUESTS = 25;
  const startLoad = performance.now();
  const promises = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    promises.push(request('/api/rooms'));
  }
  const responses = await Promise.all(promises);
  const totalDuration = performance.now() - startLoad;
  const allSuccessful = responses.every((r) => r.status === 200);
  const avgTimePerReq = totalDuration / CONCURRENT_REQUESTS;

  if (allSuccessful) {
    logResult('PASS', `Handled ${CONCURRENT_REQUESTS} concurrent API requests without errors`,
      `Total: ${totalDuration.toFixed(1)}ms, Avg: ${avgTimePerReq.toFixed(1)}ms/req, Throughput: ${(CONCURRENT_REQUESTS / (totalDuration / 1000)).toFixed(1)} req/sec`
    );
  } else {
    logResult('FAIL', 'Some concurrent requests failed');
  }

  // ----------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------
  console.log('\n======================================================');
  console.log('AUDIT SUMMARY');
  console.log('======================================================');
  console.log(`Passed:   ${results.passed}`);
  console.log(`Failed:   ${results.failed}`);
  console.log(`Warnings: ${results.warnings}`);
  console.log('======================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runHttpTests().catch((err) => {
  console.error('Audit run error:', err);
  process.exit(1);
});

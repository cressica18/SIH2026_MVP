import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('End-to-End SIH Demo Path Flow Test', () => {
  let farmerToken: string;
  let buyerToken: string;
  let logisticsToken: string;
  let adminToken: string;

  const farmerPhone = '+91 98231 44521'; // Ramesh Patil
  const buyerPhone = '+91 99801 88301';  // Sahyadri Agro
  const logisticsPhone = '+91 98224 55198'; // Kailash Shinde
  const adminPhone = '+91 99999 99999';

  beforeAll(async () => {
    // 1. Authenticate Farmer
    await request(app).post('/api/auth/otp/send').send({ phone: farmerPhone });
    const farmerRes = await request(app).post('/api/auth/otp/verify').send({ phone: farmerPhone, otp: '123456' });
    farmerToken = farmerRes.body.tokens.accessToken;

    // 2. Authenticate Buyer
    await request(app).post('/api/auth/otp/send').send({ phone: buyerPhone });
    const buyerRes = await request(app).post('/api/auth/otp/verify').send({ phone: buyerPhone, otp: '123456' });
    buyerToken = buyerRes.body.tokens.accessToken;

    // 3. Authenticate Logistics
    await request(app).post('/api/auth/otp/send').send({ phone: logisticsPhone });
    const logRes = await request(app).post('/api/auth/otp/verify').send({ phone: logisticsPhone, otp: '123456' });
    logisticsToken = logRes.body.tokens.accessToken;

    // 4. Authenticate Admin
    await request(app).post('/api/auth/otp/send').send({ phone: adminPhone });
    const adminRes = await request(app).post('/api/auth/otp/verify').send({ phone: adminPhone, otp: '123456' });
    adminToken = adminRes.body.tokens.accessToken;
  });

  it('1. Farmer creates anonymous crop listing', async () => {
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        crop: 'Tomatoes',
        variety: 'Organic Hybrid',
        quantityKg: 1500,
        priceExpected: 25,
      });

    expect(res.status).toBe(201);
    expect(res.body.crop).toBe('Tomatoes');
    expect(res.body.anonSellerId).toBe('FARM-88214');
    expect(res.body.farmerRealName).toBeUndefined(); // Scrubbed
  });

  it('2. Buyer discovers listing and places order', async () => {
    // Fetch listings for buyer
    const listingsRes = await request(app)
      .get('/api/listings')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(listingsRes.status).toBe(200);
    const tomatoesListing = listingsRes.body.listings.find((l: any) => l.crop === 'Tomatoes');
    expect(tomatoesListing).toBeDefined();

    // Place order
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        listingId: tomatoesListing.id,
        crop: tomatoesListing.crop,
        variety: tomatoesListing.variety,
        quantityKg: 1000,
        agreedPricePerKg: 25,
        deliveryAddress: 'Plot 44, Food Park MIDC, Pune',
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.status).toBe('pending');
    expect(orderRes.body.identityRevealed).toBe(false);
  });

  it('3. Farmer confirms order and reveals mutual identities', async () => {
    const ordersRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${farmerToken}`);

    const pendingOrder = ordersRes.body.orders.find((o: any) => o.status === 'pending' && o.crop === 'Tomatoes');
    expect(pendingOrder).toBeDefined();

    const confirmRes = await request(app)
      .patch(`/api/orders/${pendingOrder.id}/status`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ status: 'confirmed' });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.status).toBe('confirmed');
    expect(confirmRes.body.identityRevealed).toBe(true);
  });

  it('4. Logistics carrier creates pool and dispatches carrier', async () => {
    const ordersRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${logisticsToken}`);

    const confirmedOrder = ordersRes.body.orders.find((o: any) => o.status === 'confirmed' && o.crop === 'Tomatoes');
    expect(confirmedOrder).toBeDefined();

    // Create pool
    const poolRes = await request(app)
      .post('/api/logistics/pools')
      .set('Authorization', `Bearer ${logisticsToken}`)
      .send({ orderIds: [confirmedOrder.id] });

    expect(poolRes.status).toBe(201);
    const poolId = poolRes.body.id;

    // Dispatch pool
    const dispatchRes = await request(app)
      .patch(`/api/logistics/pools/${poolId}`)
      .set('Authorization', `Bearer ${logisticsToken}`)
      .send({ status: 'in_transit' });

    expect(dispatchRes.status).toBe(200);
    expect(dispatchRes.body.status).toBe('in_transit');

    // Deliver pool
    const deliverRes = await request(app)
      .patch(`/api/logistics/pools/${poolId}`)
      .set('Authorization', `Bearer ${logisticsToken}`)
      .send({ status: 'delivered' });

    expect(deliverRes.status).toBe(200);
    expect(deliverRes.body.status).toBe('delivered');
  });

  it('5. Buyer settles delivered order and rates farmer', async () => {
    const ordersRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`);

    const deliveredOrder = ordersRes.body.orders.find((o: any) => o.status === 'delivered' && o.crop === 'Tomatoes');
    expect(deliveredOrder).toBeDefined();

    // Settle order
    const settleRes = await request(app)
      .patch(`/api/orders/${deliveredOrder.id}/status`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ status: 'settled' });

    expect(settleRes.status).toBe(200);
    expect(settleRes.body.status).toBe('settled');

    // Rate farmer
    const rateRes = await request(app)
      .post('/api/reputation/events')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        orderId: deliveredOrder.id,
        targetUserId: deliveredOrder.anonSellerId,
        eventType: 'buyer_rating',
        scoreImpact: 5,
      });

    expect(rateRes.status).toBe(201);
    expect(rateRes.body).toHaveProperty('updatedScore');
  });

  it('6. Farmer files safety report and Admin resolves it', async () => {
    const reportRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        category: 'Underpricing & Cartel',
        description: 'Mandi sub-agent demanded cash kickback before vehicle entry.',
        isAnonymous: true,
        reportedEntityName: 'Mandi Sub-Broker X',
      });

    expect(reportRes.status).toBe(201);
    const reportId = reportRes.body.report.id;

    // Admin triages report
    const adminRes = await request(app)
      .patch(`/api/reports/admin/${reportId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'resolved',
        resolutionNotes: 'Issued notice to Mandi Marketing Board; sub-broker credential suspended.',
      });

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.report.status).toBe('resolved');
  });
});

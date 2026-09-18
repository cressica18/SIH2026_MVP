import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { Order } from '../types.js';

export function getOrders(req: Request, res: Response): void {
  res.json({ orders: store.orders, total: store.orders.length });
}

export function getOrder(req: Request, res: Response): void {
  const { id } = req.params;
  const order = store.orders.find((o) => o.id === id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json(order);
}

export function createOrder(req: Request, res: Response): void {
  const newOrder: Order = req.body;
  if (!newOrder.listingId || !newOrder.quantityKg) {
    res.status(400).json({ error: 'listingId and quantityKg are required' });
    return;
  }
  newOrder.id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  newOrder.status = 'confirmed';
  newOrder.identityRevealed = true;
  newOrder.createdAt = new Date().toISOString();
  store.orders.unshift(newOrder);

  // Update listing status
  const listing = store.listings.find((l) => l.id === newOrder.listingId);
  if (listing) {
    listing.quantityKg = Math.max(0, listing.quantityKg - newOrder.quantityKg);
    listing.status = listing.quantityKg <= 0 ? 'matched' : 'active';
  }

  res.status(201).json(newOrder);
}

export function updateOrder(req: Request, res: Response): void {
  const { id } = req.params;
  const idx = store.orders.findIndex((o) => o.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  store.orders[idx] = { ...store.orders[idx], ...req.body };
  res.json(store.orders[idx]);
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCosts, calculateComparison, calculateReview } from './logic.mjs';

const example = { price: 100, ingredients: 35, packaging: 5, platform: 30, other: 5, orders: 100 };

test('source scenario produces the documented contribution and break-even values', () => {
  const costs = calculateCosts(example);
  const comparison = calculateComparison(costs, { discount: 10, photoCost: 200, uplift: 20 });
  assert.equal(costs.unit, 25);
  assert.equal(costs.weekly, 2500);
  assert.equal(comparison.discountTotal, 1800);
  assert.equal(comparison.photoTotal, 2800);
  assert.ok(Math.abs(comparison.discountBreakEven - 66.6666667) < 0.001);
  assert.equal(comparison.photoBreakEven, 8);
});

test('review keeps raw change separate from benchmark-adjusted result', () => {
  const review = calculateReview(calculateCosts(example), { observedOrders: 112, benchmarkGrowth: 8, photoCost: 200 });
  assert.equal(review.after, 2600);
  assert.equal(review.rawChange, 100);
  assert.equal(review.benchmark, 2700);
  assert.equal(review.adjusted, -100);
});

test('missing costs and invalid plans cannot silently become zero', () => {
  assert.throws(() => calculateCosts({ ...example, platform: '' }));
  assert.throws(() => calculateCosts({ ...example, orders: 1.5 }));
  assert.throws(() => calculateComparison(calculateCosts(example), { discount: -1, photoCost: 200, uplift: 20 }));
});

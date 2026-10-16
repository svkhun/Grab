export function calculateCosts({ price, ingredients, packaging, platform, other, orders }) {
  const values = [price, ingredients, packaging, platform, other, orders];
  if (values.some(value => value === '' || value === null || !Number.isFinite(Number(value)))) {
    throw new Error('กรุณากรอกต้นทุนให้ครบทุกช่อง ต้นทุนที่ยังไม่ทราบต้องไม่ถูกนับเป็นศูนย์');
  }
  const [p, i, k, f, o, q] = values.map(Number);
  if (p <= 0 || [i, k, f, o].some(value => value < 0) || !Number.isInteger(q) || q <= 0) {
    throw new Error('ราคาขายต้องมากกว่า 0 ต้นทุนต้องไม่ติดลบ และจำนวนออเดอร์ต้องเป็นจำนวนเต็มบวก');
  }
  const variableCost = i + k + f + o;
  const unit = p - variableCost;
  return { price: p, variableCost, unit, orders: q, weekly: unit * q };
}

export function calculateComparison(costs, { discount, photoCost, uplift }) {
  const values = [discount, photoCost, uplift];
  if (values.some(value => value === '' || value === null || !Number.isFinite(Number(value)))) {
    throw new Error('กรุณากรอกส่วนลดและงบทดลองให้ครบ');
  }
  const [d, b, u] = values.map(Number);
  if (d < 0 || b < 0 || u < 0 || u > 100) {
    throw new Error('ส่วนลดและงบทดลองต้องไม่ติดลบ และอัตราเพิ่มของออเดอร์ต้องอยู่ระหว่าง 0–100%');
  }
  const projectedOrders = costs.orders * (1 + u / 100);
  const discountedUnit = costs.unit - d;
  const discountTotal = projectedOrders * discountedUnit;
  const photoTotal = projectedOrders * costs.unit - b;
  return {
    projectedOrders,
    discountedUnit,
    discountTotal,
    photoTotal,
    discountDelta: discountTotal - costs.weekly,
    photoDelta: photoTotal - costs.weekly,
    discountBreakEven: costs.unit > 0 && discountedUnit > 0 ? (costs.unit / discountedUnit - 1) * 100 : null,
    photoBreakEven: costs.unit > 0 ? Math.ceil(b / costs.unit) : null,
  };
}

export function calculateReview(costs, { observedOrders, benchmarkGrowth, photoCost }) {
  const values = [observedOrders, benchmarkGrowth, photoCost];
  if (values.some(value => value === '' || value === null || !Number.isFinite(Number(value)))) {
    throw new Error('กรุณากรอกออเดอร์ที่สังเกตได้และค่ากลุ่มเปรียบเทียบ');
  }
  const [observed, growth, spend] = values.map(Number);
  if (!Number.isInteger(observed) || observed < 0 || growth < -100 || spend < 0) {
    throw new Error('ออเดอร์ต้องเป็นจำนวนเต็มไม่ติดลบ และตัวเลขอื่นต้องอยู่ในช่วงที่ถูกต้อง');
  }
  const after = observed * costs.unit - spend;
  const benchmark = costs.orders * (1 + growth / 100) * costs.unit;
  return { before: costs.weekly, after, rawChange: after - costs.weekly, benchmark, adjusted: after - benchmark };
}

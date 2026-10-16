import { calculateCosts, calculateComparison, calculateReview } from './logic.mjs';

const $ = id => document.getElementById(id);
const money = value => `${value < 0 ? '−' : ''}฿${Math.abs(value).toLocaleString('th-TH', { maximumFractionDigits: 1 })}`;
const signedMoney = value => `${value >= 0 ? '+' : '−'}฿${Math.abs(value).toLocaleString('th-TH', { maximumFractionDigits: 1 })}`;
let activeStep = 1;
let quizPassed = false;
let selectedDecision = '';
let planApproved = false;

function inputs() {
  return {
    price: $('price').value,
    ingredients: $('ingredients').value,
    packaging: $('packaging').value,
    platform: $('platform').value,
    other: $('other').value,
    orders: $('orders').value,
  };
}

function readCosts() { return calculateCosts(inputs()); }

function compareInputs() {
  return { discount: $('discount').value, photoCost: $('photo-cost').value, uplift: $('uplift').value };
}

function showStep(step) {
  if (step > 1) {
    try { readCosts(); $('cost-error').textContent = ''; }
    catch (error) { $('cost-error').textContent = error.message; step = 1; }
  }
  activeStep = step;
  document.querySelectorAll('.stage').forEach((section, index) => section.classList.toggle('hidden', index !== step - 1));
  document.querySelectorAll('.step').forEach((button, index) => {
    button.classList.toggle('active', index === step - 1);
    button.classList.toggle('complete', index < step - 1);
    if (index === step - 1) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  updateAll();
  document.querySelector('.mission').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateSnapshot() {
  try {
    const costs = readCosts();
    $('snapshot-unit').textContent = money(costs.unit);
    $('snapshot-status').textContent = `จากราคาขาย ${money(costs.price)} และต้นทุนผันแปร ${money(costs.variableCost)}`;
    $('snapshot-orders').textContent = costs.orders.toLocaleString('th-TH');
    $('snapshot-weekly').textContent = money(costs.weekly);
    $('cost-error').textContent = '';
  } catch (error) {
    $('snapshot-unit').textContent = '—';
    $('snapshot-status').textContent = 'กรุณายืนยันต้นทุนให้ครบ';
    $('snapshot-orders').textContent = '—';
    $('snapshot-weekly').textContent = '—';
    if (activeStep === 1) $('cost-error').textContent = error.message;
  }
}

function updateComparison() {
  try {
    const costs = readCosts();
    const result = calculateComparison(costs, compareInputs());
    $('compare-error').textContent = costs.unit <= 0 ? 'เงินเหลือต่อออเดอร์ไม่เป็นบวก ควรตรวจสอบต้นทุนก่อนเริ่มแผนทดลอง' : '';
    $('uplift-value').textContent = `+${$('uplift').value}%`;
    $('baseline-total').textContent = money(costs.weekly);
    $('baseline-unit').textContent = money(costs.unit);
    $('discount-total').textContent = money(result.discountTotal);
    $('photo-total').textContent = money(result.photoTotal);
    $('discount-delta').textContent = signedMoney(result.discountDelta);
    $('photo-delta').textContent = signedMoney(result.photoDelta);
    $('discount-break-even').textContent = result.discountBreakEven === null ? 'ไม่คุ้ม' : `${result.discountBreakEven.toLocaleString('th-TH', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
    $('photo-break-even').textContent = result.photoBreakEven === null ? 'ยังคำนวณไม่ได้' : `${result.photoBreakEven.toLocaleString('th-TH')} ออเดอร์`;
  } catch (error) {
    $('compare-error').textContent = error.message;
    for (const id of ['baseline-total', 'baseline-unit', 'discount-total', 'photo-total', 'discount-delta', 'photo-delta', 'discount-break-even', 'photo-break-even']) $(id).textContent = '—';
  }
}

function updateReview() {
  try {
    const costs = readCosts();
    const review = calculateReview(costs, {
      observedOrders: $('observed-orders').value,
      benchmarkGrowth: $('benchmark').value,
      photoCost: $('photo-cost').value,
    });
    $('review-error').textContent = '';
    $('review-before').textContent = money(review.before);
    $('review-after').textContent = money(review.after);
    $('review-adjusted').textContent = signedMoney(review.adjusted);
    $('review-before-detail').textContent = `${costs.orders} ออเดอร์ × ${money(costs.unit)}`;
    $('review-after-detail').textContent = `${$('observed-orders').value} ออเดอร์ × ${money(costs.unit)} − ${money(Number($('photo-cost').value))}`;
    $('review-benchmark-detail').textContent = `คาดจากกลุ่มเปรียบเทียบ ${money(review.benchmark)}`;
    $('review-interpretation').textContent = review.adjusted <= 0
      ? 'ผลหลังเทียบกลุ่มเปรียบเทียบไม่เป็นบวก ควรตรวจสอบเพิ่มเติมก่อนขยายแผน ตัวอย่างหนึ่งร้านยังบอกเหตุและผลไม่ได้'
      : 'ผลหลังเทียบกลุ่มเปรียบเทียบเป็นบวกในตัวอย่างนี้ แต่หนึ่งร้านยังบอกเหตุและผลไม่ได้ ควรทดสอบกับกลุ่มเปรียบเทียบที่เหมาะสม';
  } catch (error) {
    $('review-error').textContent = error.message;
    for (const id of ['review-before', 'review-after', 'review-adjusted']) $(id).textContent = '—';
  }
}

function updateAll() { updateSnapshot(); updateComparison(); updateReview(); }

document.querySelectorAll('.step').forEach(button => button.addEventListener('click', () => showStep(Number(button.dataset.step))));
document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => showStep(Number(button.dataset.back))));
document.querySelectorAll('#stage-1 input, #stage-2 input, #stage-4 input').forEach(input => input.addEventListener('input', updateAll));
$('go-compare').addEventListener('click', () => showStep(2));
$('go-practice').addEventListener('click', () => {
  try { calculateComparison(readCosts(), compareInputs()); showStep(3); }
  catch (error) { $('compare-error').textContent = error.message; }
});

document.querySelectorAll('.quiz-option').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.quiz-option').forEach(option => option.classList.remove('selected', 'wrong'));
  const correct = button.dataset.answer === '33.3';
  button.classList.add(correct ? 'selected' : 'wrong');
  quizPassed = correct;
  $('quiz-feedback').className = `quiz-feedback ${correct ? 'correct' : 'incorrect'}`;
  $('quiz-feedback').textContent = correct
    ? 'ถูกต้อง: 20 ÷ 15 − 1 = 33.3% นี่คือยอดเพิ่มขั้นต่ำที่ต้องการ ไม่ใช่การคาดการณ์ยอดขาย'
    : 'ลองอีกครั้ง: นำเงินเหลือเดิมหารด้วยเงินเหลือหลังลดราคา แล้วลบ 1';
}));

$('approve-plan').addEventListener('click', () => {
  try {
    const costs = readCosts();
    const { photoCost } = compareInputs();
    calculateComparison(costs, compareInputs());
    if (!quizPassed) throw new Error('ตอบโจทย์ฝึกให้ถูกก่อนอนุมัติ หรือเลือกข้ามเพื่อดูผลตัวอย่าง');
    if (costs.unit <= 0) throw new Error('เงินเหลือต่อออเดอร์ต้องมากกว่า 0 ก่อนอนุมัติแผน');
    const cap = Number($('spend-cap').value);
    if ($('spend-cap').value === '' || !Number.isFinite(cap) || cap < Number(photoCost)) throw new Error('เพดานใช้จ่ายต้องไม่น้อยกว่างบทดลองรูปที่เลือก');
    $('plan-error').textContent = '';
    planApproved = true;
    showStep(4);
  } catch (error) { $('plan-error').textContent = error.message; }
});
$('skip-plan').addEventListener('click', () => { planApproved = false; showStep(4); });

document.querySelectorAll('[data-decision]').forEach(button => button.addEventListener('click', () => {
  selectedDecision = button.dataset.decision;
  document.querySelectorAll('[data-decision]').forEach(option => option.classList.toggle('selected', option === button));
  $('review-saved').textContent = '';
}));
$('save-review').addEventListener('click', () => {
  if (!selectedDecision) { $('review-saved').textContent = 'เลือกว่าจะทำต่อ ปรับแผน หรือหยุดก่อนบันทึก'; return; }
  try {
    const costs = readCosts();
    const review = calculateReview(costs, { observedOrders: $('observed-orders').value, benchmarkGrowth: $('benchmark').value, photoCost: $('photo-cost').value });
    localStorage.setItem('margin-missions-review', JSON.stringify({ decision: selectedDecision, note: $('decision-note').value.trim(), adjusted: review.adjusted, savedAt: new Date().toISOString() }));
    $('review-saved').textContent = 'บันทึกในเบราว์เซอร์นี้แล้ว ไม่มีการส่งข้อมูลไปยังเซิร์ฟเวอร์';
  } catch (error) { $('review-saved').textContent = error.message; }
});

$('download-plan').addEventListener('click', () => {
  try {
    const costs = readCosts();
    const review = calculateReview(costs, { observedOrders: $('observed-orders').value, benchmarkGrowth: $('benchmark').value, photoCost: $('photo-cost').value });
    const lines = [
      'Margin Missions | Synthetic prototype summary',
      'All values are examples or user-entered scenarios. No live store action was taken.',
      '',
      `Unit contribution: ${money(costs.unit)}`,
      `Weekly baseline orders: ${costs.orders}`,
      `Example action: improve one menu photo for 7 days`,
      `Photo test cost: ${money(Number($('photo-cost').value))}`,
      `Owner spending cap: ${money(Number($('spend-cap').value))}`,
      `Plan approved locally: ${planApproved ? 'yes' : 'no'}`,
      `Observed scenario orders: ${$('observed-orders').value}`,
      `Comparison group growth assumption: ${$('benchmark').value}%`,
      `Benchmark-adjusted gap: ${signedMoney(review.adjusted)}`,
      `Owner decision: ${selectedDecision || 'not selected'}`,
      `Note: ${$('decision-note').value.trim() || 'none'}`,
      '',
      'One shop-week cannot prove causality. Validate tax, co-funding, fees and actual costs before a real decision.',
    ];
    const blob = new Blob(['\ufeff', lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'margin-missions-sample-summary.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) { $('review-error').textContent = error.message; }
});

updateAll();

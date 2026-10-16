import { calculateCosts, calculateComparison, calculateReview } from './logic.mjs';
import { getLanguage, initialLanguage, setLanguage, t } from './i18n.mjs';

const $ = id => document.getElementById(id);
const locale = () => getLanguage() === 'th' ? 'th-TH' : 'en-US';
const number = (value, options = {}) => Number(value).toLocaleString(locale(), options);
const money = value => `${value < 0 ? '−' : ''}฿${number(Math.abs(value), { maximumFractionDigits: 1 })}`;
const signedMoney = value => `${value >= 0 ? '+' : '−'}฿${number(Math.abs(value), { maximumFractionDigits: 1 })}`;
let activeStep = 1;
let quizPassed = false;
let selectedDecision = '';
let planApproved = false;
let quizMessage = 'quizPrompt';
let planMessage = '';
let savedMessage = '';

function refreshTransientMessages() {
  $('quiz-feedback').textContent = t(quizMessage);
  $('plan-error').textContent = planMessage ? t(planMessage) : '';
  $('review-saved').textContent = savedMessage ? t(savedMessage) : '';
}

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
    catch (error) { $('cost-error').textContent = t(error.message); step = 1; }
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
    $('snapshot-status').textContent = t('snapshotFrom', { price: money(costs.price), cost: money(costs.variableCost) });
    $('snapshot-orders').textContent = number(costs.orders);
    $('snapshot-weekly').textContent = money(costs.weekly);
    $('cost-error').textContent = '';
  } catch (error) {
    $('snapshot-unit').textContent = '—';
    $('snapshot-status').textContent = t('snapshotMissing');
    $('snapshot-orders').textContent = '—';
    $('snapshot-weekly').textContent = '—';
    if (activeStep === 1) $('cost-error').textContent = t(error.message);
  }
}

function updateComparison() {
  try {
    const costs = readCosts();
    const result = calculateComparison(costs, compareInputs());
    $('compare-error').textContent = costs.unit <= 0 ? t('nonPositiveUnit') : '';
    $('uplift-value').textContent = `+${$('uplift').value}%`;
    $('baseline-total').textContent = money(costs.weekly);
    $('baseline-unit').textContent = money(costs.unit);
    $('discount-total').textContent = money(result.discountTotal);
    $('photo-total').textContent = money(result.photoTotal);
    $('discount-delta').textContent = signedMoney(result.discountDelta);
    $('photo-delta').textContent = signedMoney(result.photoDelta);
    $('discount-break-even').textContent = result.discountBreakEven === null ? t('notViable') : `${number(result.discountBreakEven, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
    $('photo-break-even').textContent = result.photoBreakEven === null ? t('cannotCalculate') : t('ordersCount', { count: number(result.photoBreakEven) });
  } catch (error) {
    $('compare-error').textContent = t(error.message);
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
    $('review-before-detail').textContent = t('reviewBeforeDetail', { orders: number(costs.orders), unit: money(costs.unit) });
    $('review-after-detail').textContent = t('reviewAfterDetail', { orders: number($('observed-orders').value), unit: money(costs.unit), spend: money(Number($('photo-cost').value)) });
    $('review-benchmark-detail').textContent = t('benchmarkExpected', { amount: money(review.benchmark) });
    $('review-interpretation').textContent = t(review.adjusted <= 0 ? 'reviewNegative' : 'reviewPositive');
  } catch (error) {
    $('review-error').textContent = t(error.message);
    for (const id of ['review-before', 'review-after', 'review-adjusted']) $(id).textContent = '—';
    for (const id of ['review-before-detail', 'review-after-detail', 'review-benchmark-detail']) $(id).textContent = '—';
    $('review-interpretation').textContent = t(error.message);
  }
}

function updateAll() { updateSnapshot(); updateComparison(); updateReview(); }

document.querySelectorAll('.step').forEach(button => button.addEventListener('click', () => showStep(Number(button.dataset.step))));
document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => showStep(Number(button.dataset.back))));
document.querySelectorAll('#stage-1 input, #stage-2 input, #stage-4 input').forEach(input => input.addEventListener('input', updateAll));
$('go-compare').addEventListener('click', () => showStep(2));
$('go-practice').addEventListener('click', () => {
  try { calculateComparison(readCosts(), compareInputs()); showStep(3); }
  catch (error) { $('compare-error').textContent = t(error.message); }
});

document.querySelectorAll('.quiz-option').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.quiz-option').forEach(option => option.classList.remove('selected', 'wrong'));
  const correct = button.dataset.answer === '33.3';
  button.classList.add(correct ? 'selected' : 'wrong');
  quizPassed = correct;
  $('quiz-feedback').className = `quiz-feedback ${correct ? 'correct' : 'incorrect'}`;
  quizMessage = correct ? 'quizCorrect' : 'quizIncorrect';
  refreshTransientMessages();
}));

$('approve-plan').addEventListener('click', () => {
  try {
    const costs = readCosts();
    const { photoCost } = compareInputs();
    calculateComparison(costs, compareInputs());
    if (!quizPassed) throw new Error('quizRequired');
    if (costs.unit <= 0) throw new Error('positiveUnitRequired');
    const cap = Number($('spend-cap').value);
    if ($('spend-cap').value === '' || !Number.isFinite(cap) || cap < Number(photoCost)) throw new Error('capTooLow');
    planMessage = '';
    refreshTransientMessages();
    planApproved = true;
    showStep(4);
  } catch (error) { planMessage = error.message; refreshTransientMessages(); }
});
$('skip-plan').addEventListener('click', () => { planApproved = false; showStep(4); });

document.querySelectorAll('[data-decision]').forEach(button => button.addEventListener('click', () => {
  selectedDecision = button.dataset.decision;
  document.querySelectorAll('[data-decision]').forEach(option => option.classList.toggle('selected', option === button));
  savedMessage = '';
  refreshTransientMessages();
}));
$('save-review').addEventListener('click', () => {
  if (!selectedDecision) { savedMessage = 'decisionRequired'; refreshTransientMessages(); return; }
  try {
    const costs = readCosts();
    const review = calculateReview(costs, { observedOrders: $('observed-orders').value, benchmarkGrowth: $('benchmark').value, photoCost: $('photo-cost').value });
    localStorage.setItem('margin-missions-review', JSON.stringify({ decision: selectedDecision, note: $('decision-note').value.trim(), adjusted: review.adjusted, savedAt: new Date().toISOString() }));
    savedMessage = 'reviewSaved';
    refreshTransientMessages();
  } catch (error) { savedMessage = error.message; refreshTransientMessages(); }
});

$('download-plan').addEventListener('click', () => {
  try {
    const costs = readCosts();
    const review = calculateReview(costs, { observedOrders: $('observed-orders').value, benchmarkGrowth: $('benchmark').value, photoCost: $('photo-cost').value });
    const lines = [
      t('downloadTitle'),
      t('downloadCaveat'),
      '',
      t('downloadUnit', { value: money(costs.unit) }),
      t('downloadBaseline', { value: number(costs.orders) }),
      t('downloadAction'),
      t('downloadPhotoCost', { value: money(Number($('photo-cost').value)) }),
      t('downloadCap', { value: money(Number($('spend-cap').value)) }),
      t('downloadApproved', { value: t(planApproved ? 'yes' : 'no') }),
      t('downloadObserved', { value: number($('observed-orders').value) }),
      t('downloadGrowth', { value: $('benchmark').value }),
      t('downloadGap', { value: signedMoney(review.adjusted) }),
      t('downloadDecision', { value: selectedDecision ? t(`decision${selectedDecision[0].toUpperCase()}${selectedDecision.slice(1)}`) : t('notSelected') }),
      t('downloadNote', { value: $('decision-note').value.trim() || t('none') }),
      '',
      t('downloadFinal'),
    ];
    const blob = new Blob(['\ufeff', lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'margin-missions-sample-summary.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) { $('review-error').textContent = t(error.message); }
});

document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => {
  setLanguage(button.dataset.lang);
  updateAll();
  refreshTransientMessages();
}));

setLanguage(initialLanguage());
updateAll();
refreshTransientMessages();

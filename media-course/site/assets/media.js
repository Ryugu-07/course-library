'use strict';
(() => {
  const lab = document.getElementById('sampling-lab');
  if (!lab) return;
  const night = lab.querySelector('#night-response');
  const other = lab.querySelector('#other-response');
  function update() {
    const a = Number(night.value), b = Number(other.value);
    const na = 200 * a / 100, nb = 800 * b / 100;
    const count = na + nb;
    const unhappy = na * .7 + nb * .2;
    const estimate = 100 * unhappy / count;
    lab.querySelector('#night-value').textContent = a + '%';
    lab.querySelector('#other-value').textContent = b + '%';
    lab.querySelector('#sample-estimate').textContent = estimate.toFixed(1) + '%';
    lab.querySelector('#sample-fill').style.width = estimate + '%';
    const comparison = Math.abs(estimate - 30) < 1e-9 ? '与总体相同' : `比总体${estimate > 30 ? '高' : '低'} ${Math.abs(estimate - 30).toFixed(1)} 个百分点`;
    lab.querySelector('#sample-detail').textContent = `预计回应 ${count} 人：夜班组 ${na} 人，其他组 ${nb} 人。按组内固定比例计算，预计不满意 ${Number(unhappy.toFixed(1))} 人；样本比例${comparison}。`;
  }
  night.addEventListener('input', update);
  other.addEventListener('input', update);
  lab.querySelector('#equal-response').addEventListener('click', () => { night.value = 50; other.value = 50; update(); });
  update();
})();

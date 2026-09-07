(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../research-renderer.js'));
  else {
    var lib = factory(root.ResearchLab);
    root.CourseLearning.register('research-physics', lib.mount);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core) {
  'use strict';
  const blue = '#497ec5', red = '#c65c3d';
  const grid = (a, b, n, fn) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });
  const line = (label, points, color = blue) => ({ label, color, points });
  function dimer(u) {
    const r = Math.hypot(u, 4), exchange = 8 / (r + u);
    return { energy: -exchange, exchange, double: (1 - u / r) / 2 };
  }
  const dispersion = (g, k) => 2 * Math.hypot(g - 1, 2 * Math.sqrt(g) * Math.sin(k / 2));
  function coherent(p, alpha, time, averaged) {
    const weights = [(1 - p) / 2, p, (1 - p) / 2], energies = [0, 1, alpha];
    let value = 1 / 3;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      const a = (energies[i] - energies[j]) * time;
      const factor = averaged ? (Math.abs(a) < 1e-8 ? 1 - a * a / 6 : Math.sin(a) / a) : Math.cos(a);
      value += 2 / 3 * Math.sqrt(weights[i] * weights[j]) * factor;
    }
    return value;
  }
  function steady(omega, delta) {
    const d = 1 + 2 * omega * omega + 4 * delta * delta;
    const x = -4 * delta * omega / d, y = 2 * omega / d, z = -(1 + 4 * delta * delta) / d;
    return { x, y, z, excited: omega * omega / d, purity: (1 + x * x + y * y + z * z) / 2 };
  }
  function gff(delta, z, order) {
    const a = 2 * delta;
    if (order === undefined) return 1 + Math.pow(z, a) + Math.pow(z / (1 - z), a);
    let coefficient = 1, sum = 1;
    for (let n = 1; n <= order; n++) { coefficient *= (a + n - 1) * z / n; sum += coefficient; }
    return 1 + Math.pow(z, a) * (1 + sum);
  }
  const crossing = (delta, z, order) => Math.pow(1 - z, 2 * delta) * gff(delta, z, order) - Math.pow(z, 2 * delta) * gff(delta, 1 - z, order);
  const amplitude = (g, contact, c) => g * g * (1 - 2 / (1 - c) - 2 / (1 + c)) + contact;
  const configs = {
    hubbard: {
      title: '双占据与交换能量', predict: '增大 U/t 后，双占据和交换间隔是否按同一幂次下降？',
      scope: '两个格点、两个费米子、U≥0。精确结果只属于二聚体；4t²/U 是强耦合近似，不是晶格相图。',
      controls: [['u', '排斥比 U/t', 0, 16, 0.25, 4]],
      compute(v) {
        const n = dimer(v.u), approximate = v.u > 0 ? 4 / v.u : null;
        return { numeric: { ...n, approximate }, rows: [['基态 E/t', n.energy], ['单重—三重间隔 J/t', n.exchange], ['全系统双占据概率 D', n.double], ['强耦合近似 4/u', approximate === null ? 'U=0 时不可用' : approximate]],
          chart: { title: '精确间隔与强耦合近似', xlabel: '排斥比 U/t', ylabel: '能量 / t', series: [line('二聚体精确 J/t', grid(0, 16, 128, u => dimer(u).exchange)), line('4/u（仅从 u=2 起画）', grid(2, 16, 112, u => 4 / u), red)], marker: [v.u, n.exchange] },
          text: '双占据是全系统的概率，每格平均值还要除以 2。强耦合近似在弱排斥处失准，U=0 时不得除零。' };
      }
    },
    critical: {
      title: '有限动量与临界尺度', predict: '在 g=1 将链长加倍，最低允许动量能量是否约减半？',
      scope: '横场 Ising 自由费米子色散；标记是偶宇称扇区反周期动量 π/L 的单准粒子尺度，不是完整自旋链的首激发隙。',
      controls: [['g', '横场比 h/J', 0.25, 1.75, 0.05, 1], ['length', '偶数链长 L', 8, 128, 8, 32]],
      validate(v) { if (v.length % 2) throw Error('此边界扇区要求偶数链长'); },
      compute(v) {
        const kmin = Math.PI / v.length, finiteScale = dispersion(v.g, kmin), bulkGap = 2 * Math.abs(v.g - 1);
        return { numeric: { kmin, finiteScale, bulkGap, scaled: v.length * finiteScale }, rows: [['最低动量 π/L', kmin], ['选定准粒子尺度 δL/J', finiteScale], ['热力学准粒子隙 Δ∞/J', bulkGap], ['L δL/J', v.length * finiteScale]],
          chart: { title: '色散与最低动量标记', xlabel: '无量纲动量 k', ylabel: '准粒子能量 / J', series: [line('当前横场的色散', grid(0, Math.PI, 180, k => dispersion(v.g, k))), line('临界 g=1 参照', grid(0, Math.PI, 180, k => dispersion(1, k)), red)], marker: [kmin, finiteScale] },
          text: '圆圈标出 k=π/L。临界处该尺度按 1/L 下降；完整周期自旋谱还须比较奇偶扇区与激发数约束。' };
      }
    },
    eth: {
      title: '退相位、平均与复现', predict: '长窗平均接近 1/3 后，窗末瞬时概率还会重新接近初值吗？',
      scope: '三个无简并能级的幺正演化，只验证投影概率和时间积分。没有环境、宏观极限或 ETH 检验。',
      controls: [['p', '中间能级权重 p', 0, 1, 0.05, 0.5], ['alpha', '第三能级比 α', 1.1, 3, 0.1, 2], ['windows', '观察窗 T/(2π)', 1, 10, 1, 4]],
      compute(v) {
        const duration = 2 * Math.PI * v.windows, initial = coherent(v.p, v.alpha, 0, false), end = coherent(v.p, v.alpha, duration, false), average = coherent(v.p, v.alpha, duration, true);
        return { numeric: { duration, initial, end, average, diagonal: 1 / 3 }, rows: [['观察时间（ℏ/E_ref）', duration], ['初始投影概率', initial], ['窗末投影概率', end], ['有限窗时间平均', average], ['无限窗对角平均', 1 / 3]],
          chart: { title: '投影概率与累计平均', xlabel: '时间 τ（ℏ/E_ref）', ylabel: '概率', series: [line('瞬时投影概率', grid(0, duration, 600, t => coherent(v.p, v.alpha, t, false))), line('从零起的累计平均', grid(0, duration, 600, t => coherent(v.p, v.alpha, t, true)), red), line('对角系综 1/3', [[0, 1 / 3], [duration, 1 / 3]], '#20876c')] },
          text: '该投影的每个能量对角元都为 1/3；这个特殊性质不证明热化。α=2 时每 2π 精确复现，时间平均仍可等于 1/3。' };
      }
    },
    open: {
      title: '驱动衰减的稳态', predict: '增强连续驱动，激发概率会超过 1/2 吗？改变失谐符号会改变什么？',
      scope: '旋波与 Markov 模型，只有向下衰减 γ>0，无纯退相位、无热激发；计算固定点，不模拟多体耗散相变。',
      controls: [['omega', '驱动 Ω/γ', 0, 4, 0.1, 1], ['delta', '失谐 Δ/γ', -3, 3, 0.1, 0]],
      compute(v) {
        const n = steady(v.omega, v.delta);
        return { numeric: n, rows: [['激发人口 pe', n.excited], ['Bloch x', n.x], ['Bloch y', n.y], ['Bloch z', n.z], ['稳态纯度', n.purity]],
          chart: { title: '激发人口的驱动饱和', xlabel: '驱动 Ω/γ', ylabel: '激发概率', series: [line('当前失谐', grid(0, 4, 100, o => steady(o, v.delta).excited)), line('共振 Δ=0', grid(0, 4, 100, o => steady(o, 0).excited), red)], marker: [v.omega, n.excited] },
          text: '稳态仍有发射。失谐变号使 x 反号而人口不变；单看激发率不能重构全部相干。' };
      }
    },
    correlator: {
      title: '高斯关联与 Ward 残差', predict: 'a>0 时哪个方向的涨落更大？丢掉显式破缺项会怎样？',
      scope: '零维的两个高斯变量，m>0、|a|<1。检验源导数与旋转变量代换，不模拟传播、紫外发散或自发破缺。',
      controls: [['mass', '约束强度 m', 0.5, 2, 0.1, 1], ['anisotropy', '各向异性 a', -0.8, 0.8, 0.05, 0.5]],
      compute(v) {
        const m2 = v.mass * v.mass, cx = 1 / (m2 * (1 + v.anisotropy)), cy = 1 / (m2 * (1 - v.anisotropy));
        const difference = cx - cy, breaking = -2 * v.anisotropy * m2 * cx * cy, residual = difference - breaking;
        return { numeric: { cx, cy, difference, breaking, residual }, rows: [['Cx=〈x²〉', cx], ['Cy=〈y²〉', cy], ['直接差 Cx−Cy', difference], ['显式破缺项', breaking], ['完整 Ward 残差', residual]],
          chart: { title: '两个方向的高斯方差', xlabel: '各向异性 a', ylabel: '无量纲方差', series: [line('Cx', grid(-0.8, 0.8, 80, a => 1 / (m2 * (1 + a)))), line('Cy', grid(-0.8, 0.8, 80, a => 1 / (m2 * (1 - a))), red)], marker: [v.anisotropy, cx] },
          text: 'a≠0 时方差不同是预期行为。完整恒等式的破缺项补偿差值；浮点残差接近零不等于验证所有场论 Ward 恒等式。' };
      }
    },
    bootstrap: {
      title: 'Crossing 与截断误差', predict: '中心 z=1/2 残差总为零，这是否足以证明整个近似正确？',
      scope: '已知一维 GFF 函数的二项式幂级数截断。不是共形块截断、谱界优化或真实临界指数求解。',
      controls: [['delta', '外部缩放维数 Δ', 0.25, 1.5, 0.25, 0.5], ['order', '二项式截断阶 N', 0, 24, 1, 6], ['z', '检查位置 z', 0.1, 0.9, 0.05, 0.25]],
      compute(v) {
        const exact = gff(v.delta, v.z), truncated = gff(v.delta, v.z, v.order), exactResidual = crossing(v.delta, v.z), residual = crossing(v.delta, v.z, v.order);
        return { numeric: { exact, truncated, exactResidual, residual }, rows: [['精确 GFF 函数', exact], ['幂级数截断值', truncated], ['精确 crossing 残差', exactResidual], ['截断 crossing 残差', residual]],
          chart: { title: 'Crossing 区间残差', xlabel: '交比 z', ylabel: '带运动学幂的残差', series: [line('幂级数截断', grid(0.1, 0.9, 160, z => crossing(v.delta, z, v.order))), line('精确 GFF', grid(0.1, 0.9, 160, z => crossing(v.delta, z)), red)], marker: [v.z, residual] },
          text: '残差关于中心反对称，因此中心零值没有排除力。提高阶数改善本区间近似，但有限网格不构成严格连续区间证书。' };
      }
    },
    amplitude: {
      title: '交换极点与接触自由度', predict: '加入常数接触项能改变有限角度振幅，但能消除交换极点吗？',
      scope: '四维形式标量树级模型，s=1，ĝ=g/√s 无量纲；φ³不提供稳定非微扰真空。图避开无质量前后向极点，不输出实验截面。',
      controls: [['coupling', '缩放耦合 ĝ', 0.2, 2, 0.1, 1], ['contact', '接触项 λ', -2, 2, 0.25, 0], ['cosine', '角度余弦 cosθ', -0.9, 0.9, 0.05, 0]],
      compute(v) {
        const s = 1, t = -(1 - v.cosine) / 2, u = -(1 + v.cosine) / 2, exchange = amplitude(v.coupling, 0, v.cosine), total = exchange + v.contact;
        return { numeric: { s, t, u, exchange, total, residue: v.coupling * v.coupling }, rows: [['s（能量平方单位）', s], ['t', t], ['u', u], ['交换部分', exchange], ['含接触项总振幅', total], ['归一化 s 道留数 ĝ²', v.coupling * v.coupling]],
          chart: { title: '有限角度的树级振幅', xlabel: '角度余弦 cosθ', ylabel: '无量纲振幅 A', series: [line('总振幅', grid(-0.9, 0.9, 180, c => amplitude(v.coupling, v.contact, c))), line('仅交换部分', grid(-0.9, 0.9, 180, c => amplitude(v.coupling, 0, c)), red)], marker: [v.cosine, total] },
          text: '振幅不是概率。接触项整体平移曲线却不改变简单极点留数；这里固定了 A=−M 的共同符号约定。' };
      }
    },
    higher: {
      title: 'Wilson 环路与面积律', predict: '面积与周长同样增长吗？在哪个方形边长上两条参照恰好相等？',
      scope: '二维欧氏开放平面 Z₂ 模型，面通量独立。周长曲线是同系数的人为参照，不是另一相的模拟；不覆盖周期拓扑或四维禁闭。',
      controls: [['beta', '面权重 β', 0.1, 2, 0.05, 0.55], ['length', '方形边长 ℓ（格）', 1, 10, 1, 2]],
      compute(v) {
        const plaquette = Math.tanh(v.beta), area = v.length * v.length, perimeter = 4 * v.length, sigma = -Math.log(plaquette);
        const wilson = Math.pow(plaquette, area), perimeterReference = Math.pow(plaquette, perimeter);
        return { numeric: { plaquette, area, perimeter, sigma, wilson, perimeterReference }, rows: [['单面平均通量', plaquette], ['面积 A（面数）', area], ['周长 P（边数）', perimeter], ['每面衰减系数 σ', sigma], ['精确独立面 Wilson 平均', wilson], ['同系数周长参照', perimeterReference]],
          chart: { title: '面积律与周长参照', xlabel: '方形边长 ℓ（格）', ylabel: 'Wilson 平均 / 参照值', series: [line('精确面积律', grid(1, 10, 9, l => Math.pow(plaquette, l * l))), line('同系数周长参照', grid(1, 10, 9, l => Math.pow(plaquette, 4 * l)), red)], marker: [v.length, wilson] },
          text: '内边出现两次而抵消，将边界 Wilson 乘积变成区域面通量乘积。只有本模型的独立性才允许再把平均分解为乘积。' };
      }
    }
  };
  return core.create('research-physics', configs);
});

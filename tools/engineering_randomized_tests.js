#!/usr/bin/env node
"use strict";

const path = require("path");

const LABS = path.join(__dirname, "..", "course-shared", "labs");
const load = (name) => require(path.join(LABS, name + ".js"));
const labs = {
  power: load("auto-power-converter-ripple"),
  motor: load("auto-motor-dq"),
  plc: load("auto-plc-scan"),
  safety: load("auto-safety-proof-test"),
  learning: load("auto-learning-gate"),
  twin: load("auto-digital-twin"),
  capstone: load("auto-capstone-ledger"),
  thermal: load("materials-thermal-optical-budgets"),
  lpbf: load("materials-lpbf-energy-window"),
  structural: load("materials-structural-indices"),
  battery: load("materials-battery-ragone-ledger"),
  surrogate: load("materials-ai-surrogate-validation"),
  pareto: load("materials-selection-pareto-ledger"),
  tolerance: load("mech-tolerance-stackup"),
  forming: load("mech-forming-strain-limit"),
  machining: load("mech-machining-cutting-ledger"),
  additive: load("mech-additive-build-proxy"),
  material: load("mech-material-selection"),
  order: load("mech-frontier-order-tracking"),
  shaft: load("mech-system-shaft-ledger")
};

let seed = 0x5eed1234;
let checks = 0;
let cases = 0;

function random() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 4294967296;
}

function between(low, high) {
  return low + (high - low) * random();
}

function integer(low, high) {
  return Math.floor(between(low, high + 1));
}

function pick(values) {
  return values[integer(0, values.length - 1)];
}

function check(condition, message) {
  checks += 1;
  if (!condition) throw new Error("check " + checks + ": " + message);
}

function near(left, right, tolerance) {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= (tolerance === undefined ? 1e-9 : tolerance) * scale;
}

function runFamily(name, test) {
  for (let index = 0; index < 300; index += 1) {
    test(index);
    cases += 1;
  }
  console.log("PASS " + name + " (300 randomized cases)");
}

runFamily("auto power converter", () => {
  const config = { vin: between(5, 60), duty: between(0.1, 0.9), inductanceUh: between(20, 300), frequencyKhz: between(20, 300), capacitanceUf: between(47, 680), loadA: between(0.02, 8), cycles: integer(4, 12) };
  const result = labs.power.analyze(config);
  check(near(result.vout, config.vin * config.duty), "buck voltage");
  check(near(result.boundary, result.ripple / 2), "CCM boundary");
  check(near(result.lowCurrent + result.highCurrent, 2 * config.loadA), "ripple symmetry");
  check(result.ripple >= 0 && result.voltageRipple >= 0, "nonnegative ripple");
});

runFamily("auto motor dq", () => {
  const config = { polePairs: integer(1, 8), fluxWb: between(0.02, 0.2), ldMh: between(0.1, 1.5), lqMh: between(0.1, 1.5), resistance: between(0.02, 0.5), speed: between(0, 300), vdc: between(24, 96), id: between(-20, 10), iq: between(-20, 20), maxCurrent: between(2, 25) };
  const result = labs.motor.analyze(config);
  check(near(result.torque, result.magnetTorque + result.reluctanceTorque), "torque decomposition");
  check(near(result.current, Math.hypot(config.id, config.iq)), "current norm");
  check(near(result.voltage, Math.hypot(result.voltageD, result.voltageQ)), "voltage norm");
  check(result.currentLimited === (result.current > config.maxCurrent + 1e-10), "current flag");
  check(result.voltageLimited === (result.voltage > result.voltageMax + 1e-10), "voltage flag");
});

runFamily("auto PLC scan", () => {
  const config = { scanMs: between(6, 60), inputBusMs: between(0.1, 8), logicMs: between(0.5, 30), outputBusMs: between(0.1, 8), jitterMs: between(0, 8), pulseStartMs: between(0, 160), pulseWidthMs: between(0.5, 60), scans: integer(4, 12) };
  const result = labs.plc.run(config);
  check(result.rows.length === config.scans, "scan row count");
  check(near(result.pathMs, config.inputBusMs + config.logicMs + config.outputBusMs), "path sum");
  check(result.minimumInterval <= result.averagePeriod + 1e-12 && result.averagePeriod <= result.maximumInterval + 1e-12, "period bounds");
  check(near(result.theoreticalWorstResponse, result.maximumInterval + result.pathMs), "worst response");
  check(result.missed === (result.sampledCount === 0), "miss flag");
});

runFamily("auto safety proof test", () => {
  const config = { lambdaD: between(1e-8, 1e-4), diagnosticCoverage: between(0, 0.999), testHours: between(24, 43800), targetPfd: between(1e-4, 1e-2) };
  const result = labs.safety.analyze(config);
  check(near(result.lambdaDU, (1 - config.diagnosticCoverage) * config.lambdaD), "undetected rate");
  check(near(result.pfd, result.lambdaDU * config.testHours / 2), "PFD approximation");
  check(result.meetsExampleTarget === (result.pfd <= config.targetPfd), "target flag");
  check(result.points.length === 3 && result.points[2].pfd >= result.points[0].pfd, "proof-test sweep");
});

runFamily("auto learning gate", () => {
  const config = { x0: between(-2, 2), trainRadius: between(0.5, 1.5), sigmaLimit: between(0.05, 1), learnedGain: between(0.1, 2), safeGain: between(0.1, 2), residualScale: between(0.01, 0.2), uMax: between(0.3, 2), steps: integer(6, 20) };
  const result = labs.learning.analyze(config);
  check(result.gated.rows.length === config.steps && result.ungated.rows.length === config.steps, "trajectory length");
  check(result.gated.gateCount >= 0 && result.gated.gateCount <= config.steps, "gate count");
  check(result.gated.rows.every((row) => Math.abs(row.action) <= config.uMax + 1e-9), "bounded action");
  check(result.initialInRegion === (Math.abs(config.x0) <= config.trainRadius && result.initialSigma <= config.sigmaLimit), "initial gate");
});

runFamily("auto digital twin", () => {
  const samples = integer(12, 24);
  const config = { samples: samples, driftStart: integer(3, samples - 1), driftRate: between(0, 0.6), syncEvery: integer(1, 8), syncGain: between(0, 0.8), threshold: between(0.1, 2), persistence: integer(1, 5), noiseAmp: between(0, 0.4), gainMismatch: between(-0.1, 0.1) };
  const result = labs.twin.run(config);
  check(result.rows.length === samples, "twin row count");
  check(result.rows.every((row) => near(row.residual, row.measurement - row.prediction)), "residual definition");
  check(result.falseAlarms >= 0 && result.missedAfterDrift >= 0, "alarm counts");
  check(result.firstDetection === -1 || result.firstDetection >= config.driftStart, "detection boundary");
  check((result.firstDetection === -1 && !Number.isFinite(result.detectionDelay)) || result.detectionDelay === result.firstDetection - config.driftStart, "delay convention");
});

runFamily("auto capstone ledger", () => {
  const ambient = between(0, 35);
  const target = between(ambient + 5, Math.min(100, ambient + 55));
  const duration = between(20, 60);
  const disturbanceStart = between(0, duration * 0.4);
  const disturbanceEnd = between(disturbanceStart + 0.1, duration);
  const config = { target: target, ambient: ambient, tauNom: between(2, 40), gainNom: between(0.5, 8), tauRatio: between(0.5, 2), gainRatio: between(0.5, 1.5), kp: between(0.005, 0.2), ki: between(0, 0.08), uMax: between(0.2, 1.5), disturbance: between(0, 2), disturbanceStart: disturbanceStart, disturbanceEnd: disturbanceEnd, safetyLimit: between(target + 0.1, 120), duration: duration, dt: between(0.05, 0.5) };
  const result = labs.capstone.run(config);
  check(result.nominal.rows.length === Math.round(duration / config.dt) + 1, "nominal ledger length");
  check(result.nominal.rows.length === result.stress.rows.length, "paired ledgers");
  check(result.stress.saturationFraction >= 0 && result.stress.saturationFraction <= 1, "saturation fraction");
  check(result.safe === (result.stress.maxTemperature <= config.safetyLimit), "safety flag");
  check(result.robustnessDeviation >= 0, "robustness deviation");
});

runFamily("materials thermal-optical", () => {
  const config = { areaM2: between(0.001, 2), heatW: between(0, 1e5), layer1ThicknessMm: between(0, 50), layer1K: between(0.05, 500), layer2ThicknessMm: between(0, 50), layer2K: between(0.05, 500), interfaceRpp: between(0, 0.1), alpha1PerM: between(0, 1e4), alpha2PerM: between(0, 1e4) };
  const result = labs.thermal.thermalOpticalLedger(config);
  check(near(result.thermal.totalResistanceKPerW, result.thermal.layer1ResistanceKPerW + result.thermal.interfaceResistanceKPerW + result.thermal.layer2ResistanceKPerW), "thermal series sum");
  check(near(result.thermal.temperatureRiseK, config.heatW * result.thermal.totalResistanceKPerW), "temperature rise");
  check(result.optical.transmission >= 0 && result.optical.transmission <= 1, "transmission bounds");
  check(near(result.optical.absorbedFraction, 1 - result.optical.transmission), "optical balance");
});

runFamily("materials LPBF", () => {
  const config = { powerW: between(50, 800), speedMmPerS: between(100, 3000), hatchMm: between(0.03, 0.3), layerMm: between(0.01, 0.1), packingFraction: between(0.2, 1) };
  const result = labs.lpbf.lpbfLedger(config);
  const proxies = result.proxies;
  check(near(result.energyDensityJPerMm3, config.powerW / (config.speedMmPerS * config.hatchMm * config.layerMm)), "energy density");
  check([proxies.lackOfFusionProxy, proxies.keyholeProxy, proxies.consolidationProxy].every((value) => value >= 0 && value <= 1), "proxy bounds");
  check(near(proxies.consolidationProxy, (1 - proxies.lackOfFusionProxy) * (1 - proxies.keyholeProxy)), "consolidation coupling");
});

runFamily("materials structural indices", () => {
  const config = { mode: pick(Object.keys(labs.structural.MODES)), requiredTempC: between(-100, 900), manufacturingMin: between(0, 1), orientationQuality: between(0.05, 1) };
  const result = labs.structural.structuralLedger(config);
  check(result.rows.length === labs.structural.MATERIALS.length, "material rows");
  check(result.eligibleRows.every((row) => row.eligible), "eligible ledger");
  check(result.selected === null || result.eligibleRows.some((row) => row.material.id === result.selected), "selected is eligible");
  check(result.rows.every((row) => row.effective.retention > 0 && row.effective.retention <= 1), "orientation retention");
});

runFamily("materials battery ledger", () => {
  const config = { standardVoltageV: between(3, 4.5), temperatureK: between(250, 350), electrons: integer(1, 4), reactionQuotient: between(0.1, 10), currentA: between(0, 100), internalResistanceMOhm: between(0, 15), nominalCapacityAh: between(1, 200), massKg: between(0.2, 20), cycles: between(0, 5000), fadeCoeffPerSqrtCycle: between(0, 0.01) };
  const result = labs.battery.batteryLedger(config);
  check(near(result.loadedVoltageV, result.reversibleVoltageV - result.ohmicDropV), "loaded voltage");
  check(near(result.energyWh, result.loadedVoltageV * result.effectiveCapacityAh), "energy");
  check(near(result.powerW, result.loadedVoltageV * config.currentA), "power");
  check(result.fadeProxy >= 0 && result.fadeProxy <= 0.95, "fade clamp");
  check(result.workingPointProxy.indexOf("rectangular") === 0, "working-point label");
});

runFamily("materials surrogate validation", () => {
  const result = labs.surrogate.surrogateLedger({ queryX: random(), queryY: random() });
  check(result.dataset.length === labs.surrogate.INITIAL_DATA.length, "dataset copy");
  check(result.prediction.estimate >= 0 && result.prediction.estimate <= 1, "prediction bounds");
  check(result.validation.rmse >= 0 && result.validation.maxAbsoluteError >= 0, "validation errors");
  check(result.hull.length >= 3, "convex hull");
  check(result.next && result.next.x >= 0 && result.next.x <= 1 && result.next.y >= 0 && result.next.y <= 1, "active point domain");
});

runFamily("materials Pareto selection", () => {
  const weights = [random(), random(), random(), random()];
  const config = { minStrengthMPa: between(0, 400), minTempC: between(-50, 150), maxCostUSDPerKg: between(20, 150), minManufacture: between(0, 0.6), weightStrength: weights[0], weightStiffness: weights[1], weightCost: weights[2], weightCarbon: weights[3] };
  const result = labs.pareto.selectionLedger(config);
  check(result.rows.length === labs.pareto.MATERIALS.length, "Pareto rows");
  check(near(Object.values(result.weights).reduce((sum, value) => sum + value, 0), 1), "normalized weights");
  check(result.winner === null || result.rows.some((row) => row.material.id === result.winner && row.eligible), "winner eligible");
  check(result.paretoIds.every((id) => result.rows.some((row) => row.material.id === id && row.eligible)), "Pareto eligibility");
});

runFamily("mech tolerance stack", () => {
  const config = { scale: between(0.5, 1.5), datumOffset: between(-0.3, 0.3) };
  const result = labs.tolerance.model(config);
  const zeroDatum = labs.tolerance.model({ scale: config.scale, datumOffset: 0 });
  check(near(result.nominal, zeroDatum.nominal + config.datumOffset), "datum shift");
  check(near(result.worstMax - result.nominal, result.nominal - result.worstMin), "worst symmetry");
  check(result.rssThreeSigma <= result.worstHalf + 1e-12, "RSS no wider than extrema");
  check(result.yieldProbability >= 0 && result.yieldProbability <= 1, "yield probability");
});

runFamily("mech forming", () => {
  const config = { length: between(105, 170), width: between(40, 60), springback: between(0, 0.25) };
  const result = labs.forming.model(config);
  check(near(result.epsLength + result.epsWidth + result.epsThickness, 0), "log-strain volume conservation");
  check(near(result.volumeRatio, 1), "volume ratio");
  check(near(result.bendAfter, result.bendBefore * (1 - config.springback)), "springback");
  check(result.thickness > 0 && result.forceProxy >= 0, "physical signs");
});

runFamily("mech machining", () => {
  const config = { speed: between(20, 220), rake: between(0, 20), friction: between(0.2, 0.9), chip: between(0.05, 0.4), width: between(1, 8), shearStress: between(300, 800) };
  const result = labs.machining.model(config);
  check(result.shearAngleDeg > 0 && result.shearAngleDeg < 90, "shear angle");
  check(result.chipRatio > 0 && result.chipThickness > 0, "chip geometry");
  check(result.cuttingForce > 0 && result.shearForce > 0, "force signs");
  check(near(result.power, result.cuttingForce * config.speed / 60), "cutting power");
  check(result.toolLife > 0, "Taylor life");
});

runFamily("mech additive build", () => {
  const config = { orientation: between(0, 90), layerHeight: between(0.03, 0.1), overhang: between(15, 60), power: between(150, 300) };
  const result = labs.additive.model(config);
  check(result.layers === Math.ceil(result.effectiveHeight / config.layerHeight), "layer count");
  check(near(result.buildHours, result.buildMinutes / 60), "build units");
  check(result.supportFraction >= 0 && result.supportFraction <= 1, "support fraction");
  check(result.zStrengthProxy >= 0.7 && result.zStrengthProxy <= 1, "z-strength proxy");
  check(result.supportNeeded === (result.supportFraction > 0), "support flag");
});

runFamily("mech material selection", () => {
  const config = { case: pick(["tieStiff", "tieStrength", "beamStiff", "beamStrength"]), minE: between(0, 80), minStrength: between(0, 300), serviceTemp: between(0, 120), process: "machining" };
  const result = labs.material.model(config);
  check(result.rows.length === labs.material.MATERIALS.length, "selection rows");
  check(result.eligible.every((row) => row.eligible), "eligible list");
  check(result.best === null || result.eligible.includes(result.best), "best eligibility");
  check(result.best === null || result.eligible.every((row) => result.best.index >= row.index - 1e-12), "best index");
});

runFamily("mech order tracking", () => {
  const config = { rpm: between(600, 3600), sampleRate: 128, duration: pick([0.25, 0.5, 0.75, 1]), window: pick(["rect", "hann"]) };
  const result = labs.order.model(config);
  check(result.sampleCount === Math.round(config.sampleRate * config.duration), "sample count");
  check(result.samples.length === result.sampleCount && result.weights.length === result.sampleCount, "signal ledger");
  check(result.spectrum.length === Math.floor(result.sampleCount / 2) + 1, "one-sided spectrum");
  check(result.dominant && result.dominant.frequency >= 0 && result.dominant.frequency <= result.nyquist, "dominant frequency");
  check(result.aliasComponents.every((row) => row.observedFrequency >= 0 && row.observedFrequency <= result.nyquist), "alias bounds");
});

runFamily("mech shaft ledger", () => {
  const config = { diameter: between(18, 45), length: between(0.35, 0.8), torque: between(100, 600), force: between(500, 3500), rpm: between(500, 10000) };
  const result = labs.shaft.model(config);
  const diameterM = config.diameter / 1000;
  const expectedStiffness = 48 * result.material.E * 1e9 * Math.PI * Math.pow(diameterM, 4) / 64 / Math.pow(config.length, 3);
  check(near(result.vonMises, Math.hypot(result.bendingStress, Math.sqrt(3) * result.shearStress)), "von Mises");
  check(near(result.stiffness, expectedStiffness), "simply supported stiffness");
  check(near(result.criticalRpm, 60 * result.criticalHz), "critical rpm");
  check(result.reliability >= 0 && result.reliability <= 1, "reliability");
  check(result.allPass === result.evidence.every((row) => row.pass), "evidence verdict");
});

console.log("TOTAL PASS " + cases + " randomized cases, " + checks + " independent property checks, seed=0x5eed1234");

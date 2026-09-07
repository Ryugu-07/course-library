#!/usr/bin/env node
"use strict";
// Compare browser numerical code with the independently generated NumPy export.
// Optional path lets CI check exports for other supported t / sigma settings.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const lab = require("../course-shared/labs/heat-inverse-project.js");
const reference = JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname,"../course-shared/projects/heat-inverse/benchmark-default.json"),"utf8"));
const actual = lab.buildBenchmark(reference.config.time_s,reference.config.noise_sigma_K);
let checked=0,maxAbsoluteError=0;
function compare(a,b,location) {
  if(typeof b === "number") {
    assert.ok(Number.isFinite(a),location+" nonfinite/missing");
    const error=Math.abs(a-b);maxAbsoluteError=Math.max(maxAbsoluteError,error);
    assert.ok(error<=2e-10*Math.max(1,Math.abs(b)),location+`: ${a} != ${b}`);checked++;
  } else if(Array.isArray(b)) {
    assert.equal(a.length,b.length,location+" length");b.forEach((v,i)=>compare(a[i],v,location+"/"+i));
  } else if(b && typeof b === "object") Object.keys(b).forEach(key=>compare(a[key],b[key],location+"/"+key));
  else assert.equal(a,b,location);
}
compare(actual.fitted,reference.fitted,"fitted");
compare(actual.metrics,reference.metrics,"metrics");
for (const split of ["train","validation"]) {
  reference.splits[split].forEach((row,i)=>{
    // The reference also exports reconstructions for training/validation; the UI
    // keeps only their raw trajectories. Compare every raw field independently.
    const expected={...row};delete expected.estimators;delete expected.x_m;
    compare(actual.splits[split][i],expected,split+"/"+i);
  });
}
for (const scenario of reference.config.test_scenarios) reference.splits.test[scenario].forEach((row,i)=>{
  const expected={...row};delete expected.x_m;
  compare(actual.splits.test[scenario][i],expected,"test/"+scenario+"/"+i);
});
compare(lab.x,reference.splits.test.smooth[0].x_m,"sensor coordinates");
assert.throws(()=>lab.fitLearned(actual.splits.validation),/Training trajectories only/);
assert.throws(()=>lab.generate("train",1,.02,"high-frequency"),/Invalid split/);
// Analytic no-noise inverse, including the high-frequency shift, tests the
// physical model independently of the fixture values.
for(const t of [.5,1,1.5]) for(const row of lab.generate("test",t,0,"high-frequency"))
  compare(lab.reconstruct(row.observed_K,t,"least_squares"),row.coefficients_K,"noise-free inverse");
console.log(JSON.stringify({status:"PASS",time_s:reference.config.time_s,sigma_K:reference.config.noise_sigma_K,numericComparisons:checked,maxAbsoluteError},null,2));

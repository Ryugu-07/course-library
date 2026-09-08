"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const lib=require('../course-shared/labs/research-co2-observations.js'),ref=require('./fixtures/co2-numpy.json');let count=0;
function near(a,b,t=2e-9){count++;assert.ok(Number.isFinite(a)&&Math.abs(a-b)<t*Math.max(1,Math.abs(b)),`${a} != ${b}`);}
const base=path.join(__dirname,'../course-shared/projects/co2-observations'),manifest=require(base+'/manifest.json');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(base+'/co2_mm_mlo_2026-08-05.txt')).digest('hex'),manifest.sha256);count++;
const raw=fs.readFileSync(base+'/co2_mm_mlo_2026-08-05.txt','utf8').split('\n').filter(s=>s.trim()&&!s.startsWith('#')).map(s=>s.trim().split(/\s+/).map(Number)).filter(r=>r[0]>=1990&&r[0]<=2021);
assert.equal(raw.length,lib.data.records.length);count++;
for(let i=0;i<raw.length;i++)for(const [j,k] of ['year','month','decimal_year','average','deseasonalized','days','daily_std','monthly_unc'].entries())near(raw[i][j],lib.data.records[i][k],1e-14);
for(const v of ref.cases){const r=lib.fitSeries(lib.data.records,v.start,v.model,v.lag,v.days);
 for(const k of ['n','p','testN','iidSE','hacSE','trainRMSE','testRMSE','lag1','pairCount'])near(r[k],v[k]);
 r.beta.forEach((x,i)=>near(x,v.beta[i]));r.cov.forEach((row,i)=>row.forEach((x,j)=>near(x,v.cov[i][j])));
}
// Exact linear data with a missing calendar month: fit coefficients, no false residual noise.
const X=[[1,0],[1,1],[1,3],[1,4]],q=lib.qrFit(X,[2,5,11,14]);near(q.beta[0],2);near(q.beta[1],3);q.residuals.forEach(x=>near(x,0));
// Calendar HAC must distinguish a true gap from two adjacent stored rows.
const f=lib.qrFit(X,[2,6,10,15]),calendar=lib.covariance(X,f,[0,1,3,4],1),compressed=lib.covariance(X,f,[0,1,2,3],1);
count++;assert.ok(Math.abs(calendar[1][1]-compressed[1][1])>.001);
// Changes to held-out observations cannot alter fitted coefficients or standard errors.
const changed=lib.data.records.map(r=>r.year>=2020?{...r,average:r.average+10}:r),a=lib.fitSeries(lib.data.records),b=lib.fitSeries(changed);
a.beta.forEach((x,i)=>near(x,b.beta[i],1e-13));near(a.hacSE,b.hacSE,1e-13);count++;assert.ok(b.testRMSE>a.testRMSE+5);
// Quality flags exclude a row rather than interpreting a negative uncertainty as a weight.
const quality=lib.data.records.map(r=>r.year===2010&&r.month===1?{...r,monthly_unc:-.99,quality:'interpolated_or_unknown'}:r);
const c=lib.fitSeries(quality);near(c.n,a.n-1);near(c.excluded,1);near(c.pairCount,a.pairCount-1);
for(const row of lib.data.records.filter(r=>r.year===2020))for(const water of [0,.5,3,4])near(lib.dryAir(row.average*(1-water/100),water),row.average,1e-13);
for(const topic of lib.topics){lib.compute(topic);count++;for(const control of lib.configs[topic].controls)for(const value of [control[2],control[3]]){lib.compute(topic,{[control[0]]:value});count++;}}
assert.throws(()=>lib.qrFit([[1,1],[1,1],[1,1]],[0,1,2]));assert.throws(()=>lib.dryAir(400,100));count+=2;
console.log(`PASS ${count} CO2 checks: original-source bytes, ${ref.cases.length} independent full-matrix fits, missing months and physical units`);

"""Reproduce the course subset from the checked-in, unmodified NOAA snapshot."""
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT/'course-shared/projects/co2-observations'
source = DATA/'co2_mm_mlo_2026-08-05.txt'
manifest = json.loads((DATA/'manifest.json').read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest() == manifest['sha256']
fields = ['year', 'month', 'decimal_year', 'average', 'deseasonalized', 'days', 'daily_std', 'monthly_unc']
records = []
for line in source.read_text().splitlines():
    if not line.strip() or line.startswith('#'):
        continue
    values = line.split()
    assert len(values) == 8
    if 1990 <= int(values[0]) <= 2021:
        row = dict(zip(fields, map(float, values)))
        for f in ['year','month','days']:
            row[f] = int(row[f])
        row['month_id'] = row['year']*12+row['month']-1
        row['quality'] = 'reported' if row['days'] >= 0 and row['daily_std'] >= 0 and row['monthly_unc'] >= 0 else 'interpolated_or_unknown'
        records.append(row)
assert len(records) == 384
assert all(b['month_id']-a['month_id']==1 for a,b in zip(records,records[1:]))
bundle = {'source_sha256': manifest['sha256'], 'unit': manifest['unit'], 'records': records}
(DATA/'subset.json').write_text(json.dumps(bundle, ensure_ascii=False, indent=2)+'\n')
with (DATA/'subset.csv').open('w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fields+['month_id','quality'])
    writer.writeheader()
    writer.writerows(records)
payload = json.dumps(bundle, ensure_ascii=False, separators=(',',':'))
(DATA/'data.js').write_text('(function(root){"use strict";const data='+payload+';if(typeof module==="object"&&module.exports)module.exports=data;else root.CourseCO2Data=data;})(typeof globalThis!=="undefined"?globalThis:this);\n')
print(f'PASS: {len(records)} unchanged monthly rows, source SHA-256 {manifest["sha256"]}')

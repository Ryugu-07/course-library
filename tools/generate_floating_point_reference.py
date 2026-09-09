"""Build finite input-grid references independently at 80 decimal digits."""
from pathlib import Path
import json, re, mpmath as mp
mp.mp.dps=130
ROOT=Path(__file__).resolve().parents[1]
def split(y):
 y=mp.mpf(mp.nstr(y,80))
 hi=float(y);lo=float(y-mp.mpf(hi))
 return {'hi':hi,'lo':lo,'decimal':mp.nstr(y,65)}
rows=[]
for q in range(-64,-3):
 x=float(mp.power(10,mp.mpf(q)/4));z=mp.mpf(x)
 row={'exponent':q/4,'x':x}
 row['sqrt']=split((mp.sqrt(1+z)-1)/z)
 row['cos']=split(1-mp.cos(z))
 row['derivative']=split(mp.diff(mp.exp,mp.mpf(1)))
 row['finiteDifference']=split((mp.exp(1+z)-mp.exp(1-z))/(2*z))
 row['truncation']=float(abs(mp.sinh(z)/z-1))
 rows.append(row)
payload={'digits':80,'working_digits':130,'input':'binary64-rounded 10^(q/4), q=-64,...,-4','rows':rows}
(ROOT/'tools/fixtures/floating-point-reference.json').write_text(json.dumps(payload,indent=2)+'\n')

js=ROOT/'course-shared/labs/floating-point-error.js'
content=js.read_text()
updated,count=re.subn(r' const REFERENCE=.*?;\n',lambda _: ' const REFERENCE='+json.dumps(rows,separators=(',',':'))+';\n',content,count=1)
assert count==1
js.write_text(updated)
print('Built 61 scales × 4 independent 80-digit references')

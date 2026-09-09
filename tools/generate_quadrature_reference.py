"""Offline, deterministic 100-digit integral references (mpmath is not needed at runtime)."""
from pathlib import Path
import json
import re
import mpmath as mp

ROOT = Path(__file__).resolve().parents[1]
mp.mp.dps = 100
values = {
    "smooth": mp.sin(1) + mp.mpf(1) / 3,
    "peak": (mp.atan(7) + mp.atan(13)) / 20,
    "bump": mp.mpf(4) / 693,
}
refs = {}
for key, value in values.items():
    hi = float(value)
    lo = float(value - mp.mpf(hi))
    refs[key] = {"hi": hi, "lo": lo, "text": mp.nstr(value, 65)}
fixture = ROOT / "tools/fixtures/quadrature-reference.json"
fixture.write_text(json.dumps(refs, indent=2) + "\n")
lab = ROOT / "course-shared/labs/quadrature-ode.js"
text = lab.read_text()
payload = "    // REFERENCE_DATA_START\n    var INTEGRAL_REFERENCES = " + json.dumps(refs, ensure_ascii=False) + ";\n    Object.keys(INTEGRAL_REFERENCES).forEach(function(k){Object.freeze(INTEGRAL_REFERENCES[k]);});\n    Object.freeze(INTEGRAL_REFERENCES);\n    // REFERENCE_DATA_END"
text, count = re.subn(r"    // REFERENCE_DATA_START.*?    // REFERENCE_DATA_END", lambda _: payload, text, flags=re.S)
assert count == 1
lab.write_text(text)
print("3 integral references generated with 100 working digits")

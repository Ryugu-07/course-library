# Moduli families: fixed examples

Ten fixed records accompany the two experiments in graduate mathematics bridge 23. Four compare weights 1 and 2 at the origin and a nonzero point. Six compare degree −1, 0 and 1 line bundles on P¹ with zero and selected nonzero sections, at map degree 3 and weight 2.

The records retain raw helper values, complete displayed tables, and every sampled chart point. The first chart uses the unit circle as a real slice of the complex multiplicative group; it is not the whole group. The second uses a continuous lift of the transition-function phase. A nonzero global section can vanish at a point. Global family automorphisms and fiber stabilizers are distinct quantities.

`factorsThroughNonzeroOpen` is true only when the selected section exists and is nowhere vanishing in this example family. It does not follow merely from the global automorphism group being μ_w. An unavailable nonzero section has no associated object or automorphism group; the zero section remains valid even for negative degree.

The general equivalence between nowhere-vanishing pairs and μ_w torsors is proved in the lesson by root frames, associated lines, arrows and base change. A finite set of numerical examples is not a proof for arbitrary schemes. The lesson and checker fix the base field to C and positive integer weights.

Run `python tools/check_moduli_families.py` from the repository root to recompute supported UI cases and helper boundaries, replay the fixed records, and verify deliberate mutations. The source SHA-256 in the JSON binds these observations to the delivered experiment implementation.

# Earth-system visual atlas plan

Each numbered lecture receives two original, reproducible SVG figures in addition to its interactive lab.

## Visual grammar

- **Spatial figure:** map, cutaway, profile, observing geometry, or network layout.
- **Process figure:** causal chain, material/energy flow, state comparison, or model loop.
- Every SVG must include `<title>` and `<desc>`, a visible legend when color carries meaning, and a white presentation background.
- Warm/cool colors mean physical direction or sign, not good/bad. Dashed arrows mean inferred, delayed, or uncertain pathways and must be explained.
- Maps are schematic equirectangular teaching maps, not navigation products. Captions must state when geometry is not to scale.
- Figures use the shared `svgkit.py`; generated assets live in `earth-course/images/` and source scripts stay here.

## Page inventory

| Page | Spatial figure | Process figure |
|---|---|---|
| 01 | `system-reservoir-map.svg` | `system-timescale-ladder.svg` |
| 02 | `deep-time-clock.svg` | `stratigraphy-dating.svg` |
| 03 | `earth-interior-cutaway.svg` | `seismic-ray-shadow.svg` |
| 04 | `plate-global-map.svg` | `plate-boundary-sections.svg` |
| 05 | `rock-cycle-landscape.svg` | `magma-differentiation.svg` |
| 06 | `critical-zone-section.svg` | `soil-weathering-front.svg` |
| 07 | `watershed-hydrology.svg` | `aquifer-cross-section.svg` |
| 08 | `cryosphere-components.svg` | `glacier-mass-balance.svg` |
| 09 | `coastal-sediment-cell.svg` | `sea-level-shore-response.svg` |
| 10 | `earth-energy-budget.svg` | `greenhouse-height.svg` |
| 11 | `atmospheric-circulation.svg` | `cyclone-force-balance.svg` |
| 12 | `cloud-atlas.svg` | `precipitation-mechanisms.svg` |
| 13 | `global-ocean-currents.svg` | `overturning-circulation.svg` |
| 14 | `enso-three-states.svg` | `monsoon-seasonal-engine.svg` |
| 15 | `carbon-cycle-landscape.svg` | `ocean-carbon-pumps.svg` |
| 16 | `biosphere-biomes.svg` | `nitrogen-cycle.svg` |
| 17 | `paleoclimate-archives.svg` | `proxy-age-depth.svg` |
| 18 | `forcing-pathways.svg` | `aerosol-cloud-effects.svg` |
| 19 | `climate-feedback-loops.svg` | `climate-response-timescales.svg` |
| 20 | `model-hierarchy.svg` | `earth-system-grid-column.svg` |
| 21 | `observing-system.svg` | `remote-sensing-spectrum.svg` |
| 22 | `assimilation-cycle.svg` | `inverse-problem-resolution.svg` |
| 23 | `attribution-fingerprints.svg` | `event-attribution-worlds.svg` |
| 24 | `hazard-processes.svg` | `plate-hazard-belts.svg` |
| 25 | `compound-extremes.svg` | `flood-drought-watershed.svg` |
| 26 | `climate-action-portfolio.svg` | `adaptation-risk-chain.svg` |
| 27 | `planetary-climate-comparison.svg` | `habitable-zone-context.svg` |
| 28 | `digital-twin-architecture.svg` | `watershed-observation-network.svg` |

## Source-design baseline

The figures are redrawn teaching schematics rather than copied artwork. Their visual categories and scientific labels are checked against USGS Earth interior, plate and water-cycle teaching material; NOAA ocean, atmosphere and ENSO education material; NASA energy-budget, carbon-cycle and observing-system material; and IPCC AR6 forcing, feedback, attribution and risk figures. Exact source URLs and access dates belong in `earth-course/SOURCES.md`.

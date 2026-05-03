# Boston Restaurant Opening Corpus

This corpus describes the structure of permits, licenses, and inspections required to open an independent food-service establishment in the City of Boston, Massachusetts. It is intended as ground-truth source material for Mise. Where exact fees or processing times vary or change frequently, ranges and "verify with agency" caveats are noted — Mise should reflect those caveats in `warnings` rather than invent specifics.

## Key agencies

- **Boston Inspectional Services Department (ISD)** — building permits, occupancy, sign permits, plan review, and (in coordination with BPHC) food establishment permits. Located at 1010 Massachusetts Ave, Boston.
- **Boston Public Health Commission (BPHC) — Environmental Health** — food code enforcement, food establishment permit issuance, inspections, ServSafe verification.
- **Boston Licensing Board** — Common Victualler (CV) License (required to serve food on premises), Entertainment licenses, and the local approval step for alcohol licenses.
- **Massachusetts Alcoholic Beverages Control Commission (ABCC)** — state-level approval for any liquor license (beer & wine, all-alcohol, etc.).
- **Boston Fire Department (BFD)** — fire/life safety inspection, hood suppression certification, occupant load sign-off.
- **Boston Zoning Board of Appeal (ZBA)** — required if the proposed use is not as-of-right under the neighborhood's zoning subdistrict.
- **Massachusetts Department of Revenue (DOR)** — sales tax registration, meals tax registration.
- **IRS** — Employer Identification Number (EIN).
- **MA Department of Unemployment Assistance** and **Workers' Compensation insurance carrier** — required before hiring W-2 employees.

## Typical phased flow

### Phase 1 — Setup (entity and pre-construction)

1. **Form a legal entity** (LLC most common). File with the MA Secretary of the Commonwealth. Fee ~$500. Timeline: same day to 1 week online.
2. **Get an EIN** from the IRS. Free. Same-day online.
3. **Register with MA DOR** for sales tax and meals tax (Boston has a 0.75% local meals tax option in addition to the 6.25% state meals tax, totaling 7%).
4. **Open a business bank account.**
5. **Confirm zoning** with ISD or a zoning attorney. Restaurant uses are not as-of-right in every Boston subdistrict; some require Conditional Use approval from the ZBA, which adds 3-6 months and a community process. **Verify before signing a lease.**
6. **Engage an architect or designer** familiar with Boston restaurant build-outs. Required for plan review submission.
7. **ServSafe Food Protection Manager certification** — at least one certified manager is required to be on-site during operations. ~$150, 1-2 day course + exam.
8. **Allergen Awareness training** (MA-specific) — required for the certified manager.

### Phase 2 — Build-out (permits and construction)

9. **ISD Plan Review** — submit architectural plans, equipment list, plumbing, mechanical, and electrical drawings. Required before any construction. Typical fee scales with project value; review takes 2-6 weeks for a straightforward fit-out, longer for change-of-use.
10. **Building Permit** (issued by ISD after plan review).
11. **Plumbing, Electrical, Gas Permits** — separate sub-permits, typically pulled by licensed trades.
12. **Hood and Suppression System** — installation and BFD certification of the Ansul (or equivalent) suppression system over cooking equipment.
13. **Sign Permit** — required for any exterior signage. Separate ISD process.
14. **Grease trap / interceptor** — Boston Water and Sewer Commission (BWSC) review for kitchens that produce significant FOG (fats, oils, grease).

### Phase 3 — Pre-opening (licenses and inspections)

15. **Common Victualler License** — required to serve food on premises. Issued by the Boston Licensing Board. Application requires proof of premises (lease), plot plan, abutter notification, hearing. Fee on the order of a few hundred dollars; timeline 4-8 weeks including hearing.
16. **Food Establishment Permit** — issued by BPHC after a successful pre-opening health inspection. Annual fee scales with seating; small establishment fees are typically a few hundred dollars.
17. **Health Inspection (pre-opening)** — BPHC inspector verifies hand sinks, three-bay sink, refrigeration temps, surface finishes, ServSafe certificate posted, etc.
18. **Fire Inspection** — BFD verifies suppression system, exits, occupant load posted, fire extinguisher servicing.
19. **Building / Occupancy Inspection** — final ISD sign-off, leading to Certificate of Occupancy.
20. **Beer & Wine or All-Alcohol License** (if applicable) — local approval from Boston Licensing Board, then ABCC final approval. **This is the longest item in any liquor-serving project: typically 12-20 weeks total**, and it is gated by abutter notification, a public hearing, and (for most Boston neighborhoods) license availability under the city's quota. Beer & wine licenses are slightly easier to obtain than all-alcohol in most neighborhoods. Common pitfalls: a previous tenant's license does NOT automatically transfer to a new operator without a separate transfer petition; proximity within 500 feet of a school or church can require additional review or be a basis for objection.
21. **Workers' Comp insurance** — required before any W-2 hire.
22. **General Liability + Property insurance** — required by most landlords before occupancy and by ABCC for liquor licensees (Liquor Liability minimums apply).

## Neighborhood notes

- **Dorchester** — large Vietnamese, Cape Verdean, Haitian, and Irish restaurant communities. Fields Corner and the Dot Ave corridor are dense with food businesses. Some sections fall within Main Streets districts that may have façade design review. Several blocks are within 500 ft of K-12 schools or churches — material to liquor license applications.
- **East Boston** — heavy Latin American (Salvadoran, Colombian, Mexican) presence. Bilingual application support sometimes available through neighborhood business associations.
- **Chinatown** — dense, often older buildings with grease/ventilation challenges; expect longer plan review.
- **North End** — historic district overlay can require additional design review for signage and exterior changes.
- **Allston/Brighton, Jamaica Plain, South End** — competitive markets with active community process; abutter objections to liquor licenses are common.

## Language and inclusion notes

City of Boston offers translated materials in Spanish, Haitian Creole, Vietnamese, Mandarin/Cantonese, Portuguese, and Cabo Verdean Creole for many forms, but **the underlying permit applications and the in-person hearings before the Licensing Board are conducted in English.** Operators often bring a bilingual friend, family member, or paid interpreter. Some community organizations (e.g., VietAID in Dorchester for Vietnamese, the Allston Brighton CDC, JPNDC) provide application support.

## Common pitfalls

- Signing a lease before confirming zoning is the single most expensive mistake. Always confirm "restaurant" or "fast-food restaurant" use is allowed (or factor in 3-6 months for a ZBA process) before committing rent.
- Assuming a previous tenant's licenses transfer. They do not transfer automatically. Each new operator must apply.
- Underestimating ABCC timelines. Plan 12-20 weeks from a complete local application to ABCC final approval.
- Skipping ServSafe certification until the last minute. Without a posted certified manager, the Food Establishment Permit will not be issued.
- Missing abutter notification deadlines. Failing to properly notify abutters can void a hearing and reset the clock.
- Hood / suppression issues discovered at final inspection. Pre-test before BFD arrives.

## Verification note

Specific fees, processing times, and procedural steps change. Mise should present this information as guidance, recommend the user confirm with the relevant agency, and add a `warnings` entry whenever a user-specific situation (zoning, license availability, school/church proximity) cannot be resolved from this corpus alone.

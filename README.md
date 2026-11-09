# DBG — human family campaign (p25)

Live URL: https://westurner22-dad.github.io/dbg/

**Backend setup is still required; live currently stops at a connection lobby, with no AI fallback. This is not yet ready for cross-phone family play.** See [SHARED_SETUP.md](SHARED_SETUP.md) for the exact Firebase owner actions and [firebase-dbg-rules.fragment.json](firebase-dbg-rules.fragment.json) for the separate DBG-only rules fragment. Never replace or modify `bog4/` rules/data.

- Four human-owned seats in default room `turner-family`; empty seats remain empty.
- Existing `dbg_live1` cultivators migrate into a claimed seat; local backup `dbg_live1_before_family`. Free-play `dbg_p1` and demo `dbg_demo5` are untouched.
- Real America/Los_Angeles calendar. First XP day: Monday November 9, 2026. Before then: creation and browsing only.
- Monday–Friday: solo current-realm XP, at most one level per day. Earlier modes remain loot/gold-only. Saturday–Sunday: human-commanded co-op advancement after +5 levels.
- Boss state uses conditional writes and polling; one to four humans supported. An absent human’s turn waits; no AI takes over. A started battle roster is fixed.
- Browser anonymous identity owns a seat. Keep site data; clearing it loses access. No recovery UI is implemented.
- Optional solo compressed demo: https://westurner22-dad.github.io/dbg/#demo — retains demo AI and easy tuning, isolated from live.
- P24 fixes retained, including mobile boss scrolling, starting common arm/leg gear, portrait requests, purchasing fixes, and ten-wave harder Hold the Line.

## Verification
Two independent browser contexts were tested against an isolated UID/ETag mock backend, including Firebase-style removal of null/empty values. Tests cover migration, one/two-human boss rosters and synchronized commands, rejected seat theft, individual weekday XP, and shared-map turns. These are not a deployed Firebase integration test. Production permissions currently deny DBG access and public Firebase Auth configuration is missing.

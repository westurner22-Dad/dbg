# DBG prototype — Phase 1
Open `index.html` in any browser (static files only: index.html + logic.js; no backend, saves to localStorage).
Headless test: `node test.js`.
Playtest: in Hold the Line, the top-right timer runs per round; "Export round-time log (CSV)" downloads every round's seconds with device info.


## p24 live campaign

Play: https://westurner22-dad.github.io/dbg/

- Campaign first XP day: November 9, 2026, America/Los_Angeles. Before that date, create and browse only.
- Live browser-local save: `dbg_live1`; no migration or overwrite of `dbg_p1` or demo saves.
- Monday–Friday: one level after the current mode’s 100-XP goal. Saturday–Sunday: advancement co-op after +5 levels. Missed days do not grant catch-up XP.
- This static build has local saves and three AI companion seats; it does **not** synchronize human players, have accounts, cloud saves, or a family join link. Each player can create an independent cultivator in their own browser.
- Optional compressed demo: https://westurner22-dad.github.io/dbg/#demo (`dbg_demo5`, easy tuning retained there only).
- Hold the Line: maximum ten waves per watch.

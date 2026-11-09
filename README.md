# DBG — shared human family campaign (p26)

Play: https://westurner22-dad.github.io/dbg/
Explicit family link: https://westurner22-dad.github.io/dbg/?room=tf12877be47dce189748041f6d97cdf8c3

- Four human-owned seats. Open the same link, choose an empty seat, and create a cultivator. Empty seats remain empty; live never creates AI cultivators.
- REST storage under `dbg/v1/rooms/<long-room-code>` only. No Firebase Auth, API key, sign-in, or billing setup is used.
- This is a trusted-family room capability, not authenticated accounts. The client rejects taking an occupied seat and uses conditional writes to prevent claim races. Anyone who knows the room code and deliberately bypasses the client can modify room data.
- Browser-local `dbg_client1` identifies the seat owner. Keep site data and use the same browser/device; no account recovery or cross-device identity transfer UI exists.
- Existing `dbg_live1` characters migrate when choosing an empty seat, with backup `dbg_live1_before_family`. `dbg_p1` and `dbg_demo5` are untouched.
- Pacific calendar: first XP day Monday November 9, 2026. Creation/browsing only before launch. Weekdays solo with at most one level per weekday; weekends human-commanded co-op after +5 levels.
- Boss party sizes 1–4. Join family battle from the shared roster, including as a helper from another realm. Absent humans' turns wait; never AI takeover. New seat rosters regroup into a new battle.
- Shared Nascent board retains troop quantity, Generals and movement-phase controls. Claim family seats before the first Nascent map starts: its roster is fixed at creation. Existing seated players reaching Nascent later can take turns.
- P24 fixes retained. Optional compressed solo demo: https://westurner22-dad.github.io/dbg/#demo — isolated `dbg_demo5`, demo AI and easier tuning only there.

See [SHARED_SETUP.md](SHARED_SETUP.md) for operation/security notes. The rules fragment is a reference only; the separate DBG room permissions are already configured. Never replace existing project rules or touch `bog4/`.

## p27 reserved seat 1 and seat art
- Seat 1 is reserved for Wes. Only a browser that opened his private reserved link (token kept in `/workspace/dbg/FAMILY_SEAT1.txt`, never committed; the client holds only its SHA-256) can claim it. The shared family link shows seat 1 as reserved and offers seats 2–4. Wes is in the same family room and plays weekend bosses with everyone.
- Like other seats, this protection is client-side (trusted family model).
- Cosmetic: seats 2–4 always show a big blue novelty item in the main hand in every live sprite view; real equipped weapon stats are unchanged. Seat 1 always shows the real equipped gear. Demo/free play are unaffected.

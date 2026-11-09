# Human-only family campaign: backend setup required

The live build has NO AI companions. It deliberately stops at a connection lobby until Firebase is authorized. Do not call it ready to play until a real two-device test succeeds.

The existing Firebase endpoint returns HTTP 401 Permission denied for `dbg/family/seats`. No writes were attempted to that service; no `bog4/` data or rules were changed.

A Firebase project owner needs to:
1. Enable Firebase Authentication's Anonymous sign-in provider (leave existing providers alone).
2. Obtain the public Firebase web API key for this project and put it in `dbg-config.js` as `apiKey`. This is public application configuration, NOT a service-account private key or database secret. Do not add admin credentials to this static website.
3. Review `firebase-dbg-rules.fragment.json`. Merge its `dbg` child under the existing database `rules` root, preserving every other child (especially `bog4`) unchanged. This file is a fragment, NOT a replacement database rules document. It uses anonymous Auth UID ownership to protect taken seats and current-turn writes.
4. Redeploy and verify two actual authenticated browsers: claim separate seats, reject an attempt to overwrite a taken seat, and exchange boss commands. Mock transport tests are not proof of deployed Firebase permissions.

Intended family URL once configured: https://westurner22-dad.github.io/dbg/
Default room: `turner-family`. Optional additional room: `?room=your-room-code`.

Each person opens the same room and chooses an empty seat. Existing `dbg_live1` characters migrate on claim; a local `dbg_live1_before_family` backup is retained. New characters are created after choosing a seat. Other saves (`dbg_p1`, `dbg_demo5`) are unchanged.

The anonymous identity stored on that browser owns its seat. Clearing site data or switching browser/device loses that identity; no cross-device recovery UI is implemented. Anyone who knows the room link can claim a still-empty seat. Use Join family battle in the shared roster to help even from a different realm. A started boss roster is fixed; opening an advancement fight after the seat roster changes starts a regrouped party. absent humans' turns wait for them, never for AI. Battles resume after refresh. Network state polls every 1.5 seconds and uses ETag conditional writes.

Weekend battle UI is human-commanded; HP scales for one to four participants. Every seated human commands their own turn. Weekday modes remain solo. The shared Nascent map skips empty/lower-realm turns and automates only Comrade Ruin, not cultivators. Claim the family seats before the first Nascent map starts: the map roster is currently fixed at creation, so a brand-new seat joining after that is not placed on the existing board. Existing seated players reaching Nascent later can take their turns.

Current tests use an explicitly injected local test transport with UID/ETag ownership enforcement. It is never enabled by the production configuration. Production has no test endpoint and does not fall back to local-only fake multiplayer.

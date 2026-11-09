# Shared family campaign — no Auth required

Default room: `tf12877be47dce189748041f6d97cdf8c3`
Family URL: https://westurner22-dad.github.io/dbg/
Explicit room URL: https://westurner22-dad.github.io/dbg/?room=tf12877be47dce189748041f6d97cdf8c3

The Firebase project already grants room-wide unauthenticated read/write when the DBG room code is at least 24 characters. No Firebase Auth provider, API key, billing change, or anonymous account is needed. Do not modify any existing `bog4/`, games or chat rules/data.

`dbg-config.js` specifies the database URL, separate DBG prefix and default long room. The client uses ordinary REST requests with no auth query/token. An optional `?room=` selects another long room, but the family should all use the same link.

Each browser generates a random local identifier (`dbg_client1`). Seat claims read the current owner and use Firebase ETag conditional PUTs. Occupied seats cannot be replaced through the normal client, and concurrent claims cannot silently overwrite one another. This is not server-enforced authentication: anyone who knows the room code and bypasses the client can read/write/delete that room. The baked-in room code is visible in the public client. Use only for a trusted family campaign, not sensitive information.

Create by choosing an empty seat. Existing `dbg_live1` characters migrate on claim; local backup `dbg_live1_before_family` is retained. Keep this browser's site data: clearing it loses the owner identifier. No recovery or device-transfer UI is implemented.

One to four human cultivators fight weekend bosses. Each commands only their own turns. Use Join family battle from the roster to help from another realm. Started parties are snapshots; after a new seat joins, regroup by reopening the advancement fight. Network updates poll every 1.5 seconds while visible. Offline humans' turns wait, never AI substitutes.

The shared Nascent roster is fixed at map creation; claim family seats before that map begins. Lower-realm members' turns are skipped until they reach Nascent. Only Comrade Ruin's map turns are automated.

Exact JSON state is preserved in `_json` alongside metadata because Realtime Database removes empty containers/null fields used by the combat engines. No BoG schema or saves are migrated.

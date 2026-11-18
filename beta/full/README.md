# Full-world 3D beta 0.5.0 — 2026-11-18

Entry: `beta/full/index.html`. The existing beta arena links here; the stable entry and server are unchanged.

This is the first integration milestone, **not a complete 3D port**. It imports canonical game data, simulation and UI, and replaces the world renderer with native WebGL geometry (software fallback). No production API calls or account mutations are enabled. Test progress uses `homow_beta_full_v1`; it does not read or replace the stable save. Shared UI preferences still use the existing settings keys.

## Rebuild and verify

From the repository root:

```sh
python3 beta/full/build.py
node --test beta/full/full.test.cjs
npm test
python3 -m http.server 8000
```

Open http://localhost:8000/beta/full/ . Build regenerates `index.html` and `client.js` from canonical sources, with explicit checks for changed integration points. Do not edit generated files directly. No stable source or generated `homow.html` is modified.

## Controls

WASD/arrows move relative to the camera; left click/Space attacks; Q uses a potion, R a skill, Shift dashes, E interacts, I opens inventory, B opens advancement, M opens the atlas, H mounts. Right drag rotates the camera; wheel zooms. Walking faces movement; normal attacks face the pointer without enemy correction. Skills currently retain canonical targeting and require further work.

## Parity and actual verification

| Original system | Beta equivalent | State | Verification |
|---|---|---|---|
| 12 clusters, 141 enemies, 190 resource nodes, 3 dungeons | Exact canonical World data | Connected | Counts and save schema tests |
| Movement, collision, level barriers, monster AI | Canonical simulation | Connected | House collision test; existing canonical tests |
| Inventory, equipment, talents, merchant windows | Canonical UI and callbacks | Connected | Runtime smoke opens inventory and advancement; full transaction playtest pending |
| Ordinary melee and ranged attacks | Beta directional adapter, canonical damage/cooldowns/loot | Implemented | Miss behind cursor, hit in cone, mana/projectile direction tests |
| Skills | Canonical skills | Partial | Canonical tests; manual targeting still pending |
| Regions, buildings, walls, resources, NPCs, monsters | 3D primitives with screen culling | Partial | Software renderer executes all 12 clusters; visual review pending |
| Dungeon entrance, gates, chest, exit | Canonical actions with 3D markers | Connected, unverified end to end | Canonical tests; complete dungeon playthrough pending |
| Equipment-dependent character and all enemy identities | Existing beta hero plus initial monster families | Incomplete | Models are placeholders for several families; visual equipment parity pending |
| Saves | Canonical schema, separate beta storage key | Isolated | Serialization compatibility and no stable-save writes |
| Online, existing accounts, PvP, groups, ratings | Not connected | Not ready | No network/account claims; server remains unchanged |
| Settings, localization, music | Canonical modules | Partial | Settings boot; 3D render resolution applied; shadows/texture controls need parity |
| Performance | Existing probe and culling | Unmeasured | No browser FPS, ping or long-session memory measurements |

The runtime smoke test uses a mocked canvas/DOM and software 3D. It does not verify browser GPU output, actual FPS, button layout or full playability. The published stable version remains 6.37.2; only this beta has version 0.5.0.

Next milestones: visual browser playtest, all equipment/monster model families and combat effects, directional skills, complete menu/quest/dungeon playthrough, then a beta-specific server protocol for directional attacks and shared accounts without changing stable behavior.

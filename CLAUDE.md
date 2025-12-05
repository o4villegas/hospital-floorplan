# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

3D hospital floor plan visualization showing Hurricane Matilda (Category 3) damage assessment. Built with React 19, Three.js, and deployed to Cloudflare Workers. The application renders 66 patient rooms, 9 hallways, and utility rooms with interactive damage layer visualization following IICRC S500 standards.

## Domain Context

**IICRC S500 Standards**: The Institute of Inspection Cleaning and Restoration Certification (IICRC) S500 is the industry standard for water damage restoration. This app visualizes **Category 3** water damage (contaminated/black water from storm surge), which requires the most aggressive remediation protocols.

**Two Damage Zones** (independent toggles, building starts clean):
1. **Floor Damage** (Red `#DC2626`) - Floor overlay, 80 scattered puddles, and 24" wall base wicking band. Represents 3-6" standing flood water affecting vinyl flooring over concrete.
2. **Ceiling/Roof Damage** (Green `#22C55E`) - Ceiling overlay, 50 scattered stains, wall top bands (2ft at top of walls), and drip marks. Represents roof penetrations from wind-driven rain.

**Assessment Workflow**: Users toggle two independent damage layers. Building starts clean with no damage visible. Each toggle includes a collapsible "Details" panel showing Materials and Damage information per IICRC S500 standards.

## Development Commands

```bash
# Start development server (exposes to WSL by default via Vite)
npm run dev

# Build and preview locally
npm run preview

# Type check and build without deploying
npm run check

# Lint
npm run lint

# Deploy to Cloudflare Workers
npm run deploy
```

## Architecture

### Stack
- **Frontend**: React 19 + Three.js (InstancedMesh for performance)
- **Backend**: Hono on Cloudflare Workers
- **Styling**: Tailwind CSS
- **Build**: Vite with @cloudflare/vite-plugin

### Key Files
```
src/react-app/
├── App.tsx                    # Main app, state management
├── components/
│   ├── Scene.tsx              # Three.js scene, instanced meshes, 2 damage layer groups
│   ├── Sidebar.tsx            # Two equal-weight toggles with Details panels
│   └── LegendOverlay.tsx      # Color-coded damage legend
├── hooks/
│   └── useLayers.ts           # Two independent toggles (floorDamage, ceilingDamage)
└── data/
    ├── roomData.ts            # Room definitions, DAMAGE_COLORS, BUILDING constants
    └── annotations.ts         # 4 strategic info markers
src/worker/
└── index.ts                   # Hono API: GET /api/stats
capture.mjs                    # Playwright visual test script
```

### Key Patterns

**Two Damage Layer Groups**: The scene organizes damage into 2 independently toggleable groups (building starts clean):
- `floorDamage` (Red): Floor overlay plane, 80 scattered puddles, wall base wicking band (24" height)
- `ceilingDamage` (Green): Ceiling overlay plane, 50 scattered stains, wall top bands (2ft at top of walls), drip marks on all walls

**Layer Visibility**: Two independent toggles with no master toggle. Each group's visibility controlled directly by `layers.floorDamage` and `layers.ceilingDamage`.

**InstancedMesh Rendering**: Uses Three.js `InstancedMesh` for walls, floors, fixtures to render 80+ rooms efficiently.

**Camera Control**: Default isometric view (45°) with 180° horizontal swing and ~78° vertical range (top-down to near-horizontal). Spherical coordinates in `sphericalRef` control orbit. Scroll to zoom (100-600 units).

**Color System**:
- Floor damage: Red (`#DC2626`) - floor overlay, puddles, wall base
- Ceiling damage: Green (`#22C55E`) - ceiling overlay, stains, wall top bands, drips
- Building surfaces: White/light gray (recessive)

**Room Data Generation**: `roomData.ts` generates rooms programmatically with:
- `getLeakSeverity()`: Deterministic severity based on position (exterior + roof penetration zones)
- `getCeilingMaterial()`: Drop-tile vs drywall based on building section
- `getDemolitionRequirements()`: Category 3 demo list based on damage

**IICRC S500 Material Notes**: `Sidebar.tsx` contains `DAMAGE_DETAILS` constant with material and damage information for each toggle:
- Floor Damage: Vinyl sheet over concrete, Cat 3 penetration, 24" wall base wicking
- Ceiling/Roof Damage: Drop tiles/drywall, roof leak damage, wall drip marks from water intrusion
- All language follows IICRC S500 terminology (e.g., "Category 3", "antimicrobial treatment")

## WSL Development

This repository is accessed from Windows via WSL. **Always expose dev servers to the network** so they can be accessed from Windows browsers:

```bash
npm run dev -- --host
```

Use the **Network URL** (e.g., `http://172.x.x.x:5173/`) to access from Windows.

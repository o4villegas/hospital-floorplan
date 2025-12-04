# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

3D hospital floor plan visualization showing Hurricane Matilda (Category 3) damage assessment. Built with React 19, Three.js, and deployed to Cloudflare Workers. The application renders 66 patient rooms, 9 hallways, and utility rooms with interactive damage layer visualization following IICRC S500 standards.

## Domain Context

**IICRC S500 Standards**: The Institute of Inspection Cleaning and Restoration Certification (IICRC) S500 is the industry standard for water damage restoration. This app visualizes **Category 3** water damage (contaminated/black water from storm surge), which requires the most aggressive remediation protocols.

**Three Damage Zones**:
1. **Floor Damage** (Red) - 3-6" standing flood water affecting vinyl flooring over concrete. Water trapped beneath vinyl requires substrate inspection and antimicrobial treatment.
2. **Wall Damage** (Orange) - Moisture wicking in drywall up to 24" from flood level. Cavity insulation and drywall base require demolition per Category 3 protocols.
3. **Ceiling Damage** (Yellow) - Roof penetrations from wind-driven rain causing leaks. Drop tiles/drywall and above-ceiling insulation affected.

**Assessment Workflow**: Users toggle damage layers to visualize affected areas, click rooms for detailed IICRC-compliant material notes, and review demolition requirements. The DetailPanel provides material-specific remediation guidance.

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
├── App.tsx                    # Main app, state management for room selection
├── components/
│   ├── Scene.tsx              # Three.js scene, instanced meshes, raycasting
│   ├── Sidebar.tsx            # Layer toggles, statistics, room selection
│   ├── DetailPanel.tsx        # IICRC S500 compliant room damage details
│   └── LegendOverlay.tsx      # Color-coded damage legend
├── hooks/
│   └── useLayers.ts           # 3 damage layer toggles (floor/wall/ceiling)
└── data/
    ├── roomData.ts            # Room definitions, DAMAGE_COLORS, BUILDING constants
    └── annotations.ts         # 4 strategic info markers
src/worker/
└── index.ts                   # Hono API: GET /api/stats
```

### Key Patterns

**Three Damage Layer Groups**: The scene organizes damage into 3 toggleable groups:
- `floorDamage`: Flood water plane, floor damage overlays, fixture damage markers
- `wallDamage`: Wall wicking bands (24" moisture height)
- `ceilingDamage`: Ceiling leak stains, roof damage, above-ceiling infrastructure (HVAC/pipes), annotation sprites

**InstancedMesh Rendering**: Uses Three.js `InstancedMesh` for walls, floors, ceilings, fixtures, and damage overlays to render 80+ rooms efficiently.

**Room Selection**: Click detection via raycasting against invisible hitbox meshes in `roomMeshesRef`. Selected room data populates Sidebar and DetailPanel.

**Camera Control**: Default isometric view (45°) with 180° horizontal swing and ~78° vertical range (top-down to near-horizontal). Spherical coordinates in `sphericalRef` control orbit. Scroll to zoom (100-600 units).

**Color System** (alarm-style for visibility):
- Floor damage: Red family (`#DC2626`)
- Wall damage: Orange family (`#F97316`)
- Ceiling damage: Yellow/Amber family (`#FBBF24`)
- Building surfaces: White/light gray (recessive)

**Room Data Generation**: `roomData.ts` generates rooms programmatically with:
- `getLeakSeverity()`: Deterministic severity based on position (exterior + roof penetration zones)
- `getCeilingMaterial()`: Drop-tile vs drywall based on building section
- `getDemolitionRequirements()`: Category 3 demo list based on damage

**IICRC S500 Material Notes**: `DetailPanel.tsx` contains hardcoded remediation guidance:
- `MATERIAL_NOTES` object: Material-specific restoration notes for `vinyl-concrete`, `drywall-insulated`, `drop-tile`, and `drywall` ceiling types
- `ABOVE_CEILING_NOTE`: Standard text for HVAC and pipe insulation inspection
- All language follows IICRC S500 terminology (e.g., "Category 3", "antimicrobial treatment", "porous materials")

## WSL Development

This repository is accessed from Windows via WSL. **Always expose dev servers to the network** so they can be accessed from Windows browsers:

```bash
npm run dev -- --host
```

Use the **Network URL** (e.g., `http://172.x.x.x:5173/`) to access from Windows.

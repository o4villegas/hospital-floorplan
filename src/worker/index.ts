import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/stats", (c) => {
	return c.json({
		building: "Hospital Wing - Hurricane Matilda Damage Assessment",
		hurricane: {
			name: "Matilda",
			category: 3,
			date: "2024"
		},
		damage: {
			floodDepth: "3-6 inches",
			affectedRooms: 66,
			affectedHallways: 9,
			fixtures: {
				toilets: 66,
				sinks: 70,
				cabinets: 10,
				mechanicalEquipment: 4
			}
		},
		damageTypes: [
			{ type: "Flooring", description: "Vinyl sheet over concrete - water trapped", color: "#3b82f6" },
			{ type: "Walls", description: "Drywall + cavity insulation - moisture wicking 0-24\"", color: "#f97316" },
			{ type: "Ceiling", description: "Drop tiles + drywall - water stains from roof leaks", color: "#92400e" },
			{ type: "Fixtures", description: "Sinks, toilets, cabinets - water contact damage", color: "#ef4444" },
			{ type: "Above-Ceiling", description: "HVAC ducts, hydronic pipes, insulation - roof leak damage", color: "#7c3aed" }
		]
	});
});

export default app;

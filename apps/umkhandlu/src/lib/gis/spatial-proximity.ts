const EARTH_RADIUS_METRES = 6_371_008.8;

export type Wgs84Point = {
	lat: number;
	lng: number;
};

type Position = [number, number];
type GeoJSONGeometry = {
	type: string;
	coordinates?: unknown;
	geometries?: unknown;
};

export function isValidWgs84Point(point: Wgs84Point): boolean {
	return (
		Number.isFinite(point.lat) &&
		Number.isFinite(point.lng) &&
		point.lat >= -90 &&
		point.lat <= 90 &&
		point.lng >= -180 &&
		point.lng <= 180
	);
}

function projectPosition(position: unknown, origin: Wgs84Point): Position | null {
	if (
		!Array.isArray(position) ||
		position.length < 2 ||
		typeof position[0] !== "number" ||
		typeof position[1] !== "number" ||
		!Number.isFinite(position[0]) ||
		!Number.isFinite(position[1]) ||
		position[0] < -180 ||
		position[0] > 180 ||
		position[1] < -90 ||
		position[1] > 90
	) {
		return null;
	}

	const originLat = (origin.lat * Math.PI) / 180;
	const deltaLng = ((position[0] - origin.lng + 540) % 360) - 180;
	return [
		(EARTH_RADIUS_METRES * deltaLng * Math.PI * Math.cos(originLat)) / 180,
		(EARTH_RADIUS_METRES * (position[1] - origin.lat) * Math.PI) / 180,
	];
}

function lineWithinRadius(
	coordinates: unknown,
	origin: Wgs84Point,
	radiusMetres: number,
): boolean {
	if (!Array.isArray(coordinates)) return false;
	const points = coordinates.map((position) => projectPosition(position, origin));
	const validPoints = points.filter(
		(point): point is Position => point !== null,
	);
	if (validPoints.length !== points.length) return false;

	if (validPoints.length === 1) {
		return Math.hypot(validPoints[0][0], validPoints[0][1]) <= radiusMetres;
	}

	for (let i = 1; i < validPoints.length; i++) {
		const [x1, y1] = validPoints[i - 1];
		const [x2, y2] = validPoints[i];
		const dx = x2 - x1;
		const dy = y2 - y1;
		const lengthSquared = dx * dx + dy * dy;
		const fraction =
			lengthSquared === 0
				? 0
				: Math.max(0, Math.min(1, -(x1 * dx + y1 * dy) / lengthSquared));
		if (Math.hypot(x1 + fraction * dx, y1 + fraction * dy) <= radiusMetres) {
			return true;
		}
	}
	return false;
}

function ringContainsOrigin(ring: unknown, origin: Wgs84Point): boolean {
	if (!Array.isArray(ring)) return false;
	const points = ring.map((position) => projectPosition(position, origin));
	const validPoints = points.filter(
		(point): point is Position => point !== null,
	);
	if (validPoints.length !== points.length || points.length < 3) return false;
	let inside = false;

	for (let i = 0, j = validPoints.length - 1; i < validPoints.length; j = i++) {
		const [xi, yi] = validPoints[i];
		const [xj, yj] = validPoints[j];
		if ((yi > 0) !== (yj > 0) && 0 < ((xj - xi) * -yi) / (yj - yi) + xi) {
			inside = !inside;
		}
	}
	return inside;
}

function polygonWithinRadius(
	rings: unknown,
	origin: Wgs84Point,
	radiusMetres: number,
): boolean {
	if (!Array.isArray(rings) || !Array.isArray(rings[0])) return false;
	const outerContains = ringContainsOrigin(rings[0], origin);
	const insideHole = rings.slice(1).some((ring) => ringContainsOrigin(ring, origin));
	if (outerContains && !insideHole) return true;
	return rings.some((ring) => lineWithinRadius(ring, origin, radiusMetres));
}

function coordinatesWithinRadius(
	type: string,
	coordinates: unknown,
	origin: Wgs84Point,
	radiusMetres: number,
): boolean {
	switch (type) {
		case "Point": {
			const point = projectPosition(coordinates, origin);
			return point !== null && Math.hypot(point[0], point[1]) <= radiusMetres;
		}
		case "MultiPoint":
			return (
				Array.isArray(coordinates) &&
				coordinates.some((position) =>
					coordinatesWithinRadius("Point", position, origin, radiusMetres),
				)
			);
		case "LineString":
			return lineWithinRadius(coordinates, origin, radiusMetres);
		case "MultiLineString":
			return (
				Array.isArray(coordinates) &&
				coordinates.some((line) =>
					lineWithinRadius(line, origin, radiusMetres),
				)
			);
		case "Polygon":
			return polygonWithinRadius(coordinates, origin, radiusMetres);
		case "MultiPolygon":
			return (
				Array.isArray(coordinates) &&
				coordinates.some((polygon) =>
					polygonWithinRadius(polygon, origin, radiusMetres),
				)
			);
		default:
			return false;
	}
}

export function isGeometryWithinRadius(
	geometry: unknown,
	origin: Wgs84Point,
	radiusMetres: number,
): boolean {
	if (
		!isValidWgs84Point(origin) ||
		!Number.isFinite(radiusMetres) ||
		radiusMetres < 0
	) {
		return false;
	}
	if (!geometry || typeof geometry !== "object") return false;

	const candidate = geometry as GeoJSONGeometry;
	if (candidate.type === "GeometryCollection") {
		return (
			Array.isArray(candidate.geometries) &&
			candidate.geometries.some((item) =>
				isGeometryWithinRadius(item, origin, radiusMetres),
			)
		);
	}
	return coordinatesWithinRadius(
		candidate.type,
		candidate.coordinates,
		origin,
		radiusMetres,
	);
}

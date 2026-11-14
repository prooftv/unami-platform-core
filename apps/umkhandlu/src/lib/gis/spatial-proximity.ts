const EARTH_RADIUS_METRES = 6_371_008.8;

export type Wgs84Point = {
	lat: number;
	lng: number;
};

export type Wgs84Bounds = {
	west: number;
	south: number;
	east: number;
	north: number;
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

export function isValidWgs84Bounds(bounds: Wgs84Bounds): boolean {
	return (
		Number.isFinite(bounds.west) &&
		Number.isFinite(bounds.south) &&
		Number.isFinite(bounds.east) &&
		Number.isFinite(bounds.north) &&
		bounds.west >= -180 &&
		bounds.east <= 180 &&
		bounds.south >= -90 &&
		bounds.north <= 90 &&
		bounds.west <= bounds.east &&
		bounds.south <= bounds.north
	);
}

function validPosition(value: unknown): Position | null {
	if (
		!Array.isArray(value) ||
		value.length < 2 ||
		typeof value[0] !== "number" ||
		typeof value[1] !== "number" ||
		!Number.isFinite(value[0]) ||
		!Number.isFinite(value[1]) ||
		value[0] < -180 ||
		value[0] > 180 ||
		value[1] < -90 ||
		value[1] > 90
	) {
		return null;
	}
	return [value[0], value[1]];
}

function validGeoJSONPosition(value: unknown): boolean {
	return (
		Array.isArray(value) &&
		value.length >= 2 &&
		value.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate)) &&
		value[0] >= -180 &&
		value[0] <= 180 &&
		value[1] >= -90 &&
		value[1] <= 90
	);
}

function validLineString(coordinates: unknown): boolean {
	return Array.isArray(coordinates) && coordinates.length >= 2 &&
		coordinates.every(validGeoJSONPosition);
}

function validLinearRing(coordinates: unknown): boolean {
	if (!Array.isArray(coordinates) || coordinates.length < 4 ||
		!coordinates.every(validGeoJSONPosition)) return false;
	const first = coordinates[0] as number[];
	const last = coordinates[coordinates.length - 1] as number[];
	return first.length === last.length && first.every((value, index) => value === last[index]);
}

export function isValidGeoJSONGeometry(value: unknown): boolean {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const geometry = value as { type?: unknown; coordinates?: unknown; geometries?: unknown };
	switch (geometry.type) {
		case "Point":
			return validGeoJSONPosition(geometry.coordinates);
		case "MultiPoint":
			return Array.isArray(geometry.coordinates) &&
				geometry.coordinates.length > 0 &&
				geometry.coordinates.every(validGeoJSONPosition);
		case "LineString":
			return validLineString(geometry.coordinates);
		case "MultiLineString":
			return Array.isArray(geometry.coordinates) &&
				geometry.coordinates.length > 0 &&
				geometry.coordinates.every(validLineString);
		case "Polygon":
			return Array.isArray(geometry.coordinates) &&
				geometry.coordinates.length > 0 &&
				geometry.coordinates.every(validLinearRing);
		case "MultiPolygon":
			return Array.isArray(geometry.coordinates) &&
				geometry.coordinates.length > 0 &&
				geometry.coordinates.every(
					(polygon) =>
						Array.isArray(polygon) &&
						polygon.length > 0 &&
						polygon.every(validLinearRing),
				);
		case "GeometryCollection":
			return Array.isArray(geometry.geometries) &&
				geometry.geometries.every(isValidGeoJSONGeometry);
		default:
			return false;
	}
}

function positionWithinBounds(
	position: Position,
	bounds: Wgs84Bounds,
): boolean {
	return (
		position[0] >= bounds.west &&
		position[0] <= bounds.east &&
		position[1] >= bounds.south &&
		position[1] <= bounds.north
	);
}

function segmentIntersectsBounds(
	start: Position,
	end: Position,
	bounds: Wgs84Bounds,
): boolean {
	const dx = end[0] - start[0];
	const dy = end[1] - start[1];
	let lower = 0;
	let upper = 1;
	const p = [-dx, dx, -dy, dy];
	const q = [
		start[0] - bounds.west,
		bounds.east - start[0],
		start[1] - bounds.south,
		bounds.north - start[1],
	];

	for (let index = 0; index < p.length; index++) {
		if (p[index] === 0) {
			if (q[index] < 0) return false;
			continue;
		}
		const fraction = q[index] / p[index];
		if (p[index] < 0) lower = Math.max(lower, fraction);
		else upper = Math.min(upper, fraction);
		if (lower > upper) return false;
	}
	return true;
}

function lineIntersectsBounds(
	coordinates: unknown,
	bounds: Wgs84Bounds,
): boolean {
	if (!Array.isArray(coordinates) || coordinates.length === 0) return false;
	const positions = coordinates.map(validPosition);
	if (positions.some((position) => position === null)) return false;
	const validPositions = positions as Position[];
	if (validPositions.some((position) => positionWithinBounds(position, bounds))) {
		return true;
	}
	for (let index = 1; index < validPositions.length; index++) {
		if (segmentIntersectsBounds(validPositions[index - 1], validPositions[index], bounds)) {
			return true;
		}
	}
	return false;
}

function ringContainsPosition(ring: unknown, position: Position): boolean {
	if (!Array.isArray(ring)) return false;
	const positions = ring.map(validPosition);
	if (
		positions.some((candidate) => candidate === null) ||
		positions.length < 3
	) {
		return false;
	}
	const validPositions = positions as Position[];
	let inside = false;
	for (
		let current = 0, previous = validPositions.length - 1;
		current < validPositions.length;
		previous = current++
	) {
		const [x1, y1] = validPositions[current];
		const [x2, y2] = validPositions[previous];
		if (
			(y1 > position[1]) !== (y2 > position[1]) &&
			position[0] < ((x2 - x1) * (position[1] - y1)) / (y2 - y1) + x1
		) {
			inside = !inside;
		}
	}
	return inside;
}

function polygonIntersectsBounds(
	rings: unknown,
	bounds: Wgs84Bounds,
): boolean {
	if (!Array.isArray(rings) || !Array.isArray(rings[0])) return false;
	if (rings.some((ring) => lineIntersectsBounds(ring, bounds))) return true;

	const corners: Position[] = [
		[bounds.west, bounds.south],
		[bounds.east, bounds.south],
		[bounds.east, bounds.north],
		[bounds.west, bounds.north],
	];
	return corners.some(
		(corner) =>
			ringContainsPosition(rings[0], corner) &&
			!rings.slice(1).some((hole) => ringContainsPosition(hole, corner)),
	);
}

function geometryIntersectsBounds(
	geometry: GeoJSONGeometry,
	bounds: Wgs84Bounds,
): boolean {
	if (geometry.type === "GeometryCollection") {
		return (
			Array.isArray(geometry.geometries) &&
			geometry.geometries.some(
				(item) =>
					item !== null &&
					typeof item === "object" &&
					geometryIntersectsBounds(item as GeoJSONGeometry, bounds),
			)
		);
	}

	switch (geometry.type) {
		case "Point": {
			const position = validPosition(geometry.coordinates);
			return position !== null && positionWithinBounds(position, bounds);
		}
		case "MultiPoint":
			return (
				Array.isArray(geometry.coordinates) &&
				geometry.coordinates.some((position) => {
					const candidate = validPosition(position);
					return candidate !== null && positionWithinBounds(candidate, bounds);
				})
			);
		case "LineString":
			return lineIntersectsBounds(geometry.coordinates, bounds);
		case "MultiLineString":
			return (
				Array.isArray(geometry.coordinates) &&
				geometry.coordinates.some((line) => lineIntersectsBounds(line, bounds))
			);
		case "Polygon":
			return polygonIntersectsBounds(geometry.coordinates, bounds);
		case "MultiPolygon":
			return (
				Array.isArray(geometry.coordinates) &&
				geometry.coordinates.some((polygon) =>
					polygonIntersectsBounds(polygon, bounds),
				)
			);
		default:
			return false;
	}
}

export function isGeometryWithinBounds(
	geometry: unknown,
	bounds: Wgs84Bounds,
): boolean {
	if (!isValidWgs84Bounds(bounds) || !geometry || typeof geometry !== "object") {
		return false;
	}
	return geometryIntersectsBounds(geometry as GeoJSONGeometry, bounds);
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

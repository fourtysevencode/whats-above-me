// Offline reverse geocoding: works out which country or body of water a
// lat/lon point is over, using bundled Natural Earth borders (no API calls).
import { geoContains } from 'd3-geo';
import { feature } from 'topojson-client';

// The 50m borders are ~750 KB, so load them lazily in their own chunk.
let countriesPromise;
function loadCountries() {
  countriesPromise ??= import('world-atlas/countries-50m.json').then(({ default: topology }) =>
    feature(topology, topology.objects.countries).features
  );
  return countriesPromise;
}

// Enclosed seas, checked before the open oceans. Each box is
// [minLat, maxLat, minLon, maxLon]; land is checked first, so a box only
// needs to be accurate over water.
const SEAS = [
  { name: 'Black Sea', boxes: [[40.5, 47, 27, 42]] },
  { name: 'Caspian Sea', boxes: [[36, 47.5, 46, 55.5]] },
  { name: 'Mediterranean Sea', boxes: [[30, 38, -5.6, 0], [30, 46, 0, 37]] },
  { name: 'Red Sea', boxes: [[12, 30, 32, 44]] },
  { name: 'Persian Gulf', boxes: [[23.5, 30.5, 47.5, 57]] },
  { name: 'Gulf of Mexico', boxes: [[21.5, 31, -98, -81]] },
  { name: 'Caribbean Sea', boxes: [[9, 15, -84, -61], [15, 18, -89, -61], [18, 21.5, -88, -74]] },
];

// Longitude dividing the Pacific from the Atlantic, as [lat, lon] points
// running down the Americas (the line stays over land between oceans).
const AMERICAS_DIVIDE = [
  [-90, -68], [-56, -68], [-50, -72], [-40, -70], [-20, -68], [0, -75],
  [8, -77], [9, -80], [12, -85], [15, -89], [18, -94], [25, -104], [50, -100], [90, -100],
];

function americasDivide(lat) {
  for (let i = 1; i < AMERICAS_DIVIDE.length; i++) {
    const [lat1, lon1] = AMERICAS_DIVIDE[i];
    if (lat <= lat1) {
      const [lat0, lon0] = AMERICAS_DIVIDE[i - 1];
      return lon0 + (lon1 - lon0) * (lat - lat0) / (lat1 - lat0);
    }
  }
  return AMERICAS_DIVIDE.at(-1)[1];
}

function waterBodyAt(lat, lon) {
  const sea = SEAS.find(({ boxes }) =>
    boxes.some(([minLat, maxLat, minLon, maxLon]) =>
      lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon
    )
  );
  if (sea) return sea.name;

  if (lat >= 66) return 'Arctic Ocean';
  if (lat <= -60) return 'Southern Ocean';
  if (lon >= 20 && (lon < 100 || (lon < 147 && lat < -10))) return 'Indian Ocean';
  if (lon >= americasDivide(lat) && lon < 20) return 'Atlantic Ocean';
  return 'Pacific Ocean';
}

// Resolves to e.g. { name: 'Brazil', isWater: false } or { name: 'Pacific Ocean', isWater: true }.
export async function placeAt(lat, lon) {
  const countries = await loadCountries();
  const country = countries.find((c) => geoContains(c, [lon, lat]));
  if (country) return { name: country.properties.name, isWater: false };
  return { name: waterBodyAt(lat, lon), isWater: true };
}

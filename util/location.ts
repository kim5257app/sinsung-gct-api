interface LatLng {
  lat: number;
  lng: number;
}

function deg2rad(deg: number) {
  return (deg * Math.PI) / 180;
}

function rad2deg(rad: number) {
  return (rad * 180) / Math.PI;
}

export default {
  getDistance(start: LatLng, end: LatLng) {
    const theta = start.lng - end.lng;
    let dist = (Math.sin(deg2rad(start.lat)) * Math.sin(deg2rad(end.lat)))
      + (Math.cos(deg2rad(start.lat)) * Math.cos(deg2rad(end.lat)) * Math.cos(deg2rad(theta)));
    dist = Math.acos(dist);
    dist = rad2deg(dist);
    dist = dist * 60 * 1853.159616;

    return Number.isNaN(dist) ? 0 : dist;
  },
}

export const PLACE_KINDS = {
  food: [
    'node["amenity"="restaurant"]',
    'node["amenity"="fast_food"]',
    'node["amenity"="cafe"]',
    'node["amenity"="bakery"]',
  ],
  groceries: [
    'node["shop"="supermarket"]',
    'node["shop"="convenience"]',
    'node["shop"="grocery"]',
  ],
  hygiene: [
    'node["shop"="chemist"]',
    'node["amenity"="pharmacy"]',
    'node["shop"="health_and_beauty"]',
  ],
  taxi: [
    'node["amenity"="taxi"]',
  ],
  courier: [
    'node["shop"="courier"]',
    'node["amenity"="post_office"]',
  ],
} as const;

export type PlaceKind = keyof typeof PLACE_KINDS;

export const ALLOWED_RADII_M = new Set([1000, 2000, 5000, 10000, 20000]);

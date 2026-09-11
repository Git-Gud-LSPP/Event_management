import type { Vendor } from "./vendorTypes";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const vendorTags: Record<string, string> = {
  Photographer: 'craft="photographer"',
  Bakery: 'shop="bakery"',
  Florist: 'shop="florist"',
  Caterer: 'craft="caterer"',
  Hotel: 'tourism="hotel"',
  Restaurant: 'amenity="restaurant"',
};

export async function searchNearbyVendors(
  type: string,
  latitude: number,
  longitude: number,
  radius = 5000
): Promise<Vendor[]> {
  const tag = vendorTags[type];

  if (!tag) {
    return [];
  }

  const query = `
    [out:json][timeout:25];

    (
      node[${tag}](around:${radius},${latitude},${longitude});
      way[${tag}](around:${radius},${latitude},${longitude});
      relation[${tag}](around:${radius},${latitude},${longitude});
    );

    out center tags;
  `;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    body: query,
    headers: {
      "Content-Type": "text/plain",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch vendors from OpenStreetMap");
  }

  const data = await response.json();

  return data.elements
    .filter((element: any) => element.tags?.name)
    .map((element: any) => {
      const latitude =
        element.lat ?? element.center?.lat;

      const longitude =
        element.lon ?? element.center?.lon;

      return {
        id: `${element.type}-${element.id}`,
        name: element.tags.name,
        type,
        latitude,
        longitude,
        address: element.tags["addr:full"],
        phone: element.tags.phone,
        website: element.tags.website,
      };
    })
    .filter(
      (vendor: Vendor) =>
        vendor.latitude !== undefined &&
        vendor.longitude !== undefined
    );
}
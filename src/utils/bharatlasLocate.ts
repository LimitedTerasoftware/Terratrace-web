export interface LgdLocation {
  stateLgd: number | null;
  districtLgd: number | null;
  blockLgd: number | null;
  blockName: string | null;
}

interface BharatlasBoundary {
  level: string;
  feature: { properties: Record<string, unknown> };
}

interface BharatlasResponse {
  results?: { boundaries?: BharatlasBoundary[] };
}

/**
 * Reverse-geocodes a point against India's LGD (Local Government Directory)
 * administrative boundaries via bharatlas.com's public /locate endpoint. The
 * state/district/block LGD codes it returns line up exactly with this app's
 * locally maintained blocksData.json (state_code/district_code/block_code —
 * verified against real records, e.g. block_lgd 3035 = "KRISHNAGAR-I",
 * matching block_code 3035 in Nadia, West Bengal).
 *
 * Third-party best-effort service with no documented SLA — callers should
 * treat a null/failed result as "couldn't auto-detect" and fall back to
 * manual search, not as an error.
 */
export const locateByCoordinates = async (lat: number, lng: number): Promise<LgdLocation | null> => {
  try {
    const response = await fetch(`https://bharatlas.com/api/v1/locate?lat=${lat}&lng=${lng}`);
    if (!response.ok) return null;

    const json: BharatlasResponse = await response.json();
    const boundaries = json.results?.boundaries ?? [];
    const state = boundaries.find((b) => b.level === 'state');
    const district = boundaries.find((b) => b.level === 'district');
    const block = boundaries.find((b) => b.level === 'block');

    return {
      stateLgd: (state?.feature.properties.State_LGD as number) ?? null,
      districtLgd: (district?.feature.properties.dist_lgd as number) ?? null,
      blockLgd: (block?.feature.properties.block_lgd as number) ?? null,
      blockName: (block?.feature.properties.block_name as string) ?? null,
    };
  } catch (error) {
    console.error('bharatlas locate failed:', error);
    return null;
  }
};

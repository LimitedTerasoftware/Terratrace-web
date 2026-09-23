import blocksData from '../data/blocksData.json';

export interface BlockRecord {
  block_id: number;
  block_code: number;
  block_name: string;
  district_id: number | null;
  district_code: number | null;
  district_name: string | null;
  state_id: number;
  state_code: number;
  state_name: string;
}

const blocks = blocksData as BlockRecord[];

const normalize = (value: string): string => value.trim().toLowerCase();

/**
 * Name-based lookup against the locally maintained block/district/state list
 * (sourced from districts (2).csv). Block names aren't unique across the
 * country (e.g. "BAMENG" exists in two different districts), so this always
 * returns every match — callers show a picker when there's more than one.
 */
export const searchBlocks = (query: string, limit = 20): BlockRecord[] => {
  const q = normalize(query);
  if (!q) return [];

  const starts: BlockRecord[] = [];
  const contains: BlockRecord[] = [];

  for (const block of blocks) {
    const name = normalize(block.block_name);
    if (name === q) {
      starts.unshift(block);
    } else if (name.startsWith(q)) {
      starts.push(block);
    } else if (name.includes(q)) {
      contains.push(block);
    }
  }

  return [...starts, ...contains].slice(0, limit);
};

export const getBlockById = (blockId: number): BlockRecord | undefined =>
  blocks.find((block) => block.block_id === blockId);

// block_code is the official LGD block code — the join key used to resolve
// a bharatlas.com /locate result (block_lgd) back to this app's internal
// block_id. See utils/bharatlasLocate.ts.
export const getBlockByCode = (blockCode: number): BlockRecord | undefined =>
  blocks.find((block) => block.block_code === blockCode);

export default blocks;

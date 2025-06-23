import Dexie, { Table } from 'dexie';
import { KMZFile } from '../types/kmz';

export class KMZDatabase extends Dexie {
  kmzFiles!: Table<KMZFile>;

  constructor() {
    super('KMZDatabase');
    this.version(1).stores({
      kmzFiles: 'id, name, uploadDate, size'
    });
  }
}

export const db = new KMZDatabase();

export const dbOperations = {
  async saveKMZ(kmzFile: KMZFile): Promise<void> {
    await db.kmzFiles.put(kmzFile);
  },

  async getAllKMZ(): Promise<KMZFile[]> {
    return await db.kmzFiles.orderBy('uploadDate').reverse().toArray();
  },

  async getKMZ(id: string): Promise<KMZFile | undefined> {
    return await db.kmzFiles.get(id);
  },

  async deleteKMZ(id: string): Promise<void> {
    await db.kmzFiles.delete(id);
  },

  async clearAll(): Promise<void> {
    await db.kmzFiles.clear();
  }
};
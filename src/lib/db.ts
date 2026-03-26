import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface PatientRecord {
  id: string;
  timestamp: number;
  patientName: string;
  age: string;
  symptoms: string;
  image?: string; // base64
  urgency: 'RED' | 'YELLOW' | 'GREEN';
  advice: string;
  localAdvice?: string; // Translated advice
  language: string;
  synced: boolean;
  malnutritionRisk?: 'Low' | 'Moderate' | 'High';
  outbreakConcern?: boolean;
}

interface KingaDB extends DBSchema {
  records: {
    key: string;
    value: PatientRecord;
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<KingaDB>>;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<KingaDB>('kinga-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('records', { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
};

export const saveRecord = async (record: PatientRecord) => {
  const db = await getDB();
  await db.put('records', record);
};

export const getAllRecords = async () => {
  const db = await getDB();
  return db.getAllFromIndex('records', 'by-timestamp');
};

export const deleteRecord = async (id: string) => {
  const db = await getDB();
  await db.delete('records', id);
};

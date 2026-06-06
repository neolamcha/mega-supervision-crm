import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

const DATABASE_NAME = 'mega_supervision.db';

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabase({ name: DATABASE_NAME, location: 'default' });
  await initializeTables(db);
  return db;
}

async function initializeTables(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS prospects (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT '',
      adresse TEXT NOT NULL DEFAULT '',
      ville TEXT NOT NULL DEFAULT '',
      region TEXT NOT NULL DEFAULT '',
      telephone TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      latitude REAL,
      longitude REAL,
      estCalibre INTEGER NOT NULL DEFAULT 0,
      dateCalibrage TEXT,
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS calibrations (
      id TEXT PRIMARY KEY,
      prospectId TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      dateCalibrage TEXT NOT NULL DEFAULT (datetime('now')),
      estActive INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (prospectId) REFERENCES prospects(id)
    );
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      prospectId TEXT NOT NULL,
      dateVisite TEXT NOT NULL,
      heureArrivee TEXT NOT NULL,
      heureDepart TEXT,
      dureeSecondes INTEGER,
      estComplete INTEGER NOT NULL DEFAULT 0,
      latitudeArrivee REAL NOT NULL DEFAULT 0,
      longitudeArrivee REAL NOT NULL DEFAULT 0,
      estSynchronise INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (prospectId) REFERENCES prospects(id)
    );
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS gpsEvents (
      id TEXT PRIMARY KEY,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      precision REAL NOT NULL DEFAULT 0,
      vitesse REAL NOT NULL DEFAULT 0,
      altitude REAL NOT NULL DEFAULT 0,
      evenement TEXT NOT NULL,
      horodatage TEXT NOT NULL,
      prospectId TEXT,
      visitId TEXT,
      estSynchronise INTEGER NOT NULL DEFAULT 0
    );
  `);

  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS syncLog (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

export async function executeSql(sql: string, params: any[] = []): Promise<any[]> {
  const database = await getDatabase();
  const [results] = await database.executeSql(sql, params);
  const rows: any[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    rows.push(results.rows.item(i));
  }
  return rows;
}

export async function executeSqlBatch(statements: Array<{ sql: string; params?: any[] }>): Promise<void> {
  const database = await getDatabase();
  for (const stmt of statements) {
    await database.executeSql(stmt.sql, stmt.params || []);
  }
}

function toBool(val: number | boolean | undefined | null): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'boolean') return val;
  return val === 1;
}

function toInt(val: boolean | number | undefined | null): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  return val ? 1 : 0;
}

export async function upsertProspects(prospects: any[]): Promise<void> {
  const database = await getDatabase();
  for (const p of prospects) {
    await database.executeSql(
      `INSERT OR REPLACE INTO prospects (id, nom, type, adresse, ville, region, telephone, notes, latitude, longitude, estCalibre, dateCalibrage, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id, p.nom, p.type || '', p.adresse || '', p.ville || '',
        p.region || '', p.telephone || '', p.notes || '',
        p.latitude ?? null, p.longitude ?? null,
        toInt(p.estCalibre), p.dateCalibrage || null, p.updatedAt || new Date().toISOString(),
      ],
    );
  }
}

export async function getProspects(): Promise<any[]> {
  const rows = await executeSql('SELECT * FROM prospects ORDER BY nom ASC');
  return rows.map((r: any) => ({
    ...r,
    estCalibre: toBool(r.estCalibre),
  }));
}

export async function getProspectById(id: string): Promise<any | null> {
  const rows = await executeSql('SELECT * FROM prospects WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return { ...r, estCalibre: toBool(r.estCalibre) };
}

export async function searchProspects(query: string): Promise<any[]> {
  const searchTerm = `%${query}%`;
  const rows = await executeSql(
    `SELECT * FROM prospects WHERE nom LIKE ? OR ville LIKE ? OR type LIKE ? ORDER BY nom ASC`,
    [searchTerm, searchTerm, searchTerm],
  );
  return rows.map((r: any) => ({ ...r, estCalibre: toBool(r.estCalibre) }));
}

export async function getCalibratedProspects(): Promise<any[]> {
  const rows = await executeSql('SELECT * FROM prospects WHERE estCalibre = 1 ORDER BY nom ASC');
  return rows.map((r: any) => ({ ...r, estCalibre: true }));
}

export async function insertCalibration(calibration: any): Promise<void> {
  const database = await getDatabase();
  await database.executeSql(
    `INSERT OR REPLACE INTO calibrations (id, prospectId, latitude, longitude, dateCalibrage, estActive)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [calibration.id, calibration.prospectId, calibration.latitude, calibration.longitude,
     calibration.dateCalibrage, toInt(calibration.estActive)],
  );
  await database.executeSql(
    `UPDATE prospects SET latitude = ?, longitude = ?, estCalibre = 1, dateCalibrage = ? WHERE id = ?`,
    [calibration.latitude, calibration.longitude, calibration.dateCalibrage, calibration.prospectId],
  );
}

export async function insertVisit(visit: any): Promise<void> {
  const database = await getDatabase();
  await database.executeSql(
    `INSERT OR REPLACE INTO visits (id, prospectId, dateVisite, heureArrivee, heureDepart, dureeSecondes, estComplete, latitudeArrivee, longitudeArrivee, estSynchronise)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [visit.id, visit.prospectId, visit.dateVisite, visit.heureArrivee,
     visit.heureDepart || null, visit.dureeSecondes ?? null,
     toInt(visit.estComplete), visit.latitudeArrivee, visit.longitudeArrivee,
     toInt(visit.estSynchronise ?? false)],
  );
}

export async function updateVisit(visit: any): Promise<void> {
  const database = await getDatabase();
  await database.executeSql(
    `UPDATE visits SET heureDepart = ?, dureeSecondes = ?, estComplete = ?, estSynchronise = ?
     WHERE id = ?`,
    [visit.heureDepart || null, visit.dureeSecondes ?? null,
     toInt(visit.estComplete), toInt(visit.estSynchronise ?? false), visit.id],
  );
}

export async function getActiveVisit(): Promise<any | null> {
  const rows = await executeSql(
    'SELECT * FROM visits WHERE estComplete = 0 ORDER BY heureArrivee DESC LIMIT 1',
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return { ...r, estComplete: toBool(r.estComplete), estSynchronise: toBool(r.estSynchronise) };
}

export async function getVisits(prospectId?: string): Promise<any[]> {
  let sql = `SELECT v.*, p.nom as prospectNom, p.type as prospectType, p.ville as prospectVille
             FROM visits v LEFT JOIN prospects p ON v.prospectId = p.id`;
  const params: any[] = [];
  if (prospectId) {
    sql += ' WHERE v.prospectId = ?';
    params.push(prospectId);
  }
  sql += ' ORDER BY v.heureArrivee DESC';
  const rows = await executeSql(sql, params);
  return rows.map((r: any) => ({
    ...r,
    estComplete: toBool(r.estComplete),
    estSynchronise: toBool(r.estSynchronise),
  }));
}

export async function getRecentVisits(days: number = 7): Promise<any[]> {
  const rows = await executeSql(
    `SELECT v.*, p.nom as prospectNom, p.type as prospectType, p.ville as prospectVille
     FROM visits v LEFT JOIN prospects p ON v.prospectId = p.id
     WHERE v.heureArrivee >= datetime('now', '-${days} days')
     ORDER BY v.heureArrivee DESC`,
  );
  return rows.map((r: any) => ({
    ...r,
    estComplete: toBool(r.estComplete),
    estSynchronise: toBool(r.estSynchronise),
  }));
}

export async function insertGpsEvent(event: any): Promise<void> {
  const database = await getDatabase();
  await database.executeSql(
    `INSERT OR REPLACE INTO gpsEvents (id, latitude, longitude, precision, vitesse, altitude, evenement, horodatage, prospectId, visitId, estSynchronise)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [event.id, event.latitude, event.longitude, event.precision ?? 0,
     event.vitesse ?? 0, event.altitude ?? 0, event.evenement, event.horodatage,
     event.prospectId || null, event.visitId || null,
     toInt(event.estSynchronise ?? false)],
  );
}

export async function getUnsynchronizedGpsEvents(): Promise<any[]> {
  const rows = await executeSql(
    'SELECT * FROM gpsEvents WHERE estSynchronise = 0 ORDER BY horodatage ASC',
  );
  return rows.map((r: any) => ({ ...r, estSynchronise: false }));
}

export async function getUnsynchronizedVisits(): Promise<any[]> {
  const rows = await executeSql(
    'SELECT * FROM visits WHERE estSynchronise = 0 ORDER BY heureArrivee ASC',
  );
  return rows.map((r: any) => ({ ...r, estComplete: toBool(r.estComplete), estSynchronise: false }));
}

export async function markGpsEventsSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  await executeSql(
    `UPDATE gpsEvents SET estSynchronise = 1 WHERE id IN (${placeholders})`,
    ids,
  );
}

export async function markVisitsSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  await executeSql(
    `UPDATE visits SET estSynchronise = 1 WHERE id IN (${placeholders})`,
    ids,
  );
}

export async function insertSyncLog(log: any): Promise<void> {
  await executeSql(
    'INSERT INTO syncLog (id, status, details, createdAt) VALUES (?, ?, ?, ?)',
    [log.id, log.status, log.details, log.createdAt],
  );
}

export async function getLatestSyncLog(): Promise<any | null> {
  const rows = await executeSql(
    'SELECT * FROM syncLog ORDER BY createdAt DESC LIMIT 1',
  );
  if (rows.length === 0) return null;
  return rows[0];
}

export async function getSyncLogs(limit: number = 20): Promise<any[]> {
  return executeSql(
    'SELECT * FROM syncLog ORDER BY createdAt DESC LIMIT ?',
    [limit],
  );
}

export async function getVisitStats(prospectId: string): Promise<{ total: number; totalDuration: number }> {
  const rows = await executeSql(
    `SELECT COUNT(*) as total, COALESCE(SUM(dureeSecondes), 0) as totalDuration
     FROM visits WHERE prospectId = ? AND estComplete = 1`,
    [prospectId],
  );
  return { total: rows[0]?.total || 0, totalDuration: rows[0]?.totalDuration || 0 };
}

export async function getDatabaseSize(): Promise<string> {
  try {
    const rows = await executeSql(
      "SELECT page_count * page_size as size FROM pragma_page_count, pragma_page_size",
    );
    const bytes = rows[0]?.size || 0;
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  } catch {
    return 'Inconnu';
  }
}

export async function getUnsyncedCounts(): Promise<{ events: number; visits: number }> {
  const eventRows = await executeSql(
    'SELECT COUNT(*) as count FROM gpsEvents WHERE estSynchronise = 0',
  );
  const visitRows = await executeSql(
    'SELECT COUNT(*) as count FROM visits WHERE estSynchronise = 0',
  );
  return {
    events: eventRows[0]?.count || 0,
    visits: visitRows[0]?.count || 0,
  };
}

export async function deleteOldData(daysOld: number = 30): Promise<void> {
  await executeSql(
    `DELETE FROM gpsEvents WHERE horodatage < datetime('now', '-${daysOld} days') AND estSynchronise = 1`,
  );
  await executeSql(
    `DELETE FROM syncLog WHERE createdAt < datetime('now', '-${daysOld} days')`,
  );
}

export async function checkDuplicateGpsEvent(
  horodatage: string,
  evenement: string,
  prospectId: string | null,
): Promise<boolean> {
  const rows = await executeSql(
    'SELECT COUNT(*) as count FROM gpsEvents WHERE horodatage = ? AND evenement = ? AND (prospectId = ? OR (prospectId IS NULL AND ? IS NULL))',
    [horodatage, evenement, prospectId, prospectId],
  );
  return (rows[0]?.count || 0) > 0;
}

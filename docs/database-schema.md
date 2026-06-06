# Schéma de Base de Données - Mega Supervision

## Vue d'Ensemble

Le système utilise **PostgreSQL 16** comme base de données relationnelle principale avec **TypeORM** comme ORM. Le schéma comprend **9 tables** principales couvrant les utilisateurs, prospects, calibrations GPS, visites, événements GPS, configuration, audit et synchronisation.

**Extensions PostgreSQL utilisées:**
- `uuid-ossp` — génération d'UUID v4
- `pgcrypto` — fonctions de hachage supplémentaires

---

## Entity Relationship Diagram (ASCII)

```
┌──────────────────┐       ┌──────────────────────────┐       ┌──────────────────────────┐
│      users        │       │       prospects           │       │  prospect_type_configs   │
├──────────────────┤       ├──────────────────────────┤       ├──────────────────────────┤
│ id (UUID PK)     │──┐    │ id (UUID PK)              │       │ type (VARCHAR PK)        │
│ nom (VARCHAR100)  │  │    │ calibrateurId (UUID FK)──┼───┐   │ rayonPresence (INT)      │
│ prenom (VARCHAR100)│ │   │ nom (VARCHAR200)          │   │   │ pauseStart (TIME)        │
│ telephone (VARCHAR)│  │   │ type (VARCHAR FK)─────────┼───┼───│ pauseEnd (TIME)          │
│ email (VARCHAR)   │  │   │ adresse (TEXT)            │   │   │ createdAt (TIMESTAMPTZ)  │
│ login (VARCHAR)   │  │   │ ville (VARCHAR100)        │   │   │ updatedAt (TIMESTAMPTZ)  │
│ motDePasse(VARCHAR)│ │   │ region (VARCHAR100)       │   │   └──────────────────────────┘
│ role (VARCHAR)    │  │   │ telephone (VARCHAR20)     │   │
│ estActif(BOOLEAN)  │  │   │ notes (TEXT)             │   │
│ premierConnexion  │  │   │ estArchive (BOOLEAN)      │   │
│ createdAt         │  │   │ latitude (DECIMAL10,7)    │   │
│ updatedAt         │  │   │ longitude (DECIMAL11,7)   │   │
└──────────────────┘  │   │ estCalibre (BOOLEAN)       │   │
                      │   │ dateCalibrage (TIMESTAMPTZ)│   │
                      │   │ createdAt (TIMESTAMPTZ)    │   │
                      │   │ updatedAt (TIMESTAMPTZ)    │   │
                      │   └────────────────────────────┘   │
                      │                                    │
  ┌───────────────────┐     ┌───────────────────────┐      │
  │   calibrations     │     │       visits           │      │
  ├───────────────────┤     ├───────────────────────┤      │
  │ id (UUID PK)      │     │ id (UUID PK)           │      │
  │ delegueId (UUID)──┼───┐ │ prospectId (UUID FK)───┼──────┘
  │ prospectId (UUID)─┼───┼─│ delegueId (UUID FK)────┼──┐
  │ latitude (DECIMAL)│   │ │ dateVisite (DATE)      │  │
  │ longitude (DECIMAL)│  │ │ heureArrivee (TIME)    │  │
  │ dateCalibrage     │   │ │ heureDepart (TIME)     │  │
  │ estActive (BOOL)  │   │ │ dureeSecondes (INT)    │  │
  │ createdAt         │   │ │ estComplete (BOOLEAN)  │  │
  │ updatedAt         │   │ │ latitudeArrivee (DECIM)│  │
  └───────────────────┘   │ │ longitudeArrivee(DECIM)│  │
                          │ │ createdAt (TIMESTAMPTZ)│  │
                          │ │ updatedAt (TIMESTAMPTZ)│  │
                          │ └────────────────────────┘  │
                          │                             │
  ┌───────────────────┐   │  ┌──────────────────────┐   │
  │    gps_events      │   │  │    audit_logs         │   │
  ├───────────────────┤   │  ├──────────────────────┤   │
  │ id (UUID PK)      │   │  │ id (UUID PK)          │   │
  │ delegueId (UUID)──┼───┘  │ utilisateurId(UUID)──┼───┘
  │ prospectId (UUID) │      │ action (VARCHAR)      │
  │ visitId (UUID)────┼──────│ entite (VARCHAR)      │
  │ latitude (DECIMAL)│      │ entiteId (UUID)       │
  │ longitude (DECIMAL)│     │ details (JSONB)       │
  │ precision (DECIMAL)│     │ coordonneesGPS (JSONB)│
  │ vitesse (DECIMAL) │      │ adresseIP (VARCHAR)   │
  │ altitude (DECIMAL) │     │ createdAt (TIMESTAMPTZ)│
  │ evenement (VARCHAR)│     └────────────────────────┘
  │ horodatage (TIMEST)│
  │ estSynchronise     │    ┌──────────────────────────┐
  │ appareilId (VARCHAR)│   │     refresh_tokens        │
  │ createdAt          │    ├──────────────────────────┤
  └───────────────────┘    │ id (UUID PK)              │
                           │ userId (UUID FK)──────────│
  ┌───────────────────┐    │ token (VARCHAR255)        │
  │    sync_logs       │    │ expiresAt (TIMESTAMPTZ)   │
  ├───────────────────┤    │ estRevoke (BOOLEAN)       │
  │ id (UUID PK)      │    │ createdAt (TIMESTAMPTZ)   │
  │ delegueId (UUID)  │    └──────────────────────────┘
  │ appareilId (VARCHAR)│
  │ dernierSync (TIMES)│
  │ status (VARCHAR)   │
  │ details (JSONB)    │
  │ createdAt          │
  │ updatedAt          │
  └───────────────────┘
```

---

## Détail des Tables — DDL Complet

---

### Table: `users`

Stocke les comptes des directeurs commerciaux et délégués commerciaux.

```sql
CREATE TABLE users (
  id                 UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom                VARCHAR(100)  NOT NULL,
  prenom             VARCHAR(100)  NOT NULL,
  telephone          VARCHAR(20)   DEFAULT NULL,
  email              VARCHAR(255)  NOT NULL,
  login              VARCHAR(50)   NOT NULL,
  motDePasse         VARCHAR(255)  NOT NULL,
  role               VARCHAR(20)   NOT NULL CHECK (role IN ('directeur', 'delegue')),
  estActif           BOOLEAN       DEFAULT true,
  premierConnexion   BOOLEAN       DEFAULT true,
  createdAt          TIMESTAMPTZ   DEFAULT NOW(),
  updatedAt          TIMESTAMPTZ   DEFAULT NOW(),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_login UNIQUE (login)
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_actif ON users(estActif) WHERE estActif = true;
CREATE INDEX idx_users_nom ON users(nom, prenom);
```

**TypeORM Entity:**
```typescript
// src/users/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nom: string;

  @Column({ length: 100 })
  prenom: string;

  @Column({ length: 20, nullable: true })
  telephone: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 50, unique: true })
  login: string;

  @Column({ length: 255, select: false })
  motDePasse: string;

  @Column({ length: 20 })
  role: 'directeur' | 'delegue';

  @Column({ default: true })
  estActif: boolean;

  @Column({ default: true })
  premierConnexion: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Visite, visite => visite.delegue)
  visites: Visite[];

  @OneToMany(() => Calibration, calibration => calibration.delegue)
  calibrations: Calibration[];

  @OneToMany(() => GpsEvent, gpsEvent => gpsEvent.delegue)
  gpsEvents: GpsEvent[];
}
```

---

### Table: `prospect_type_configs`

Configuration des types de prospects définissant les rayons de présence et plages de pause.

```sql
CREATE TABLE prospect_type_configs (
  type           VARCHAR(50)   PRIMARY KEY,
  rayonPresence  INTEGER       NOT NULL DEFAULT 50 CHECK (rayonPresence > 0),
  pauseStart     TIME          DEFAULT '13:00:00',
  pauseEnd       TIME          DEFAULT '15:00:00',
  createdAt      TIMESTAMPTZ   DEFAULT NOW(),
  updatedAt      TIMESTAMPTZ   DEFAULT NOW()
);

-- Insertion des valeurs par défaut
INSERT INTO prospect_type_configs (type, rayonPresence) VALUES
  ('pharmacie', 50),
  ('hopital', 100),
  ('clinique', 100),
  ('cabinet', 30),
  ('laboratoire', 50),
  ('autre', 50);
```

---

### Table: `prospects`

Fiche des prospects visités par les délégués commerciaux.

```sql
CREATE TABLE prospects (
  id                UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  calibrateurId     UUID          DEFAULT NULL,
  nom               VARCHAR(200)  NOT NULL,
  type              VARCHAR(50)   NOT NULL,
  adresse           TEXT          DEFAULT NULL,
  ville             VARCHAR(100)  DEFAULT NULL,
  region            VARCHAR(100)  DEFAULT NULL,
  telephone         VARCHAR(20)   DEFAULT NULL,
  notes             TEXT          DEFAULT NULL,
  estArchive        BOOLEAN       DEFAULT false,
  latitude          DECIMAL(10,7) DEFAULT NULL,
  longitude         DECIMAL(11,7) DEFAULT NULL,
  estCalibre        BOOLEAN       DEFAULT false,
  dateCalibrage     TIMESTAMPTZ   DEFAULT NULL,
  createdAt         TIMESTAMPTZ   DEFAULT NOW(),
  updatedAt         TIMESTAMPTZ   DEFAULT NOW(),
  CONSTRAINT fk_prospects_calibrateur
    FOREIGN KEY (calibrateurId) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_prospects_type
    FOREIGN KEY (type) REFERENCES prospect_type_configs(type)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_prospects_type ON prospects(type);
CREATE INDEX idx_prospects_calibrateur ON prospects(calibrateurId);
CREATE INDEX idx_prospects_archive ON prospects(estArchive) WHERE estArchive = false;
CREATE INDEX idx_prospects_coords ON prospects(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_prospects_ville ON prospects(ville);
CREATE INDEX idx_prospects_region ON prospects(region);
```

---

### Table: `calibrations`

Enregistrement des points GPS de calibration pour chaque prospect.

```sql
CREATE TABLE calibrations (
  id              UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  delegueId       UUID          NOT NULL,
  prospectId      UUID          NOT NULL,
  latitude        DECIMAL(10,7) NOT NULL,
  longitude       DECIMAL(11,7) NOT NULL,
  dateCalibrage   TIMESTAMPTZ   DEFAULT NOW(),
  estActive       BOOLEAN       DEFAULT true,
  createdAt       TIMESTAMPTZ   DEFAULT NOW(),
  updatedAt       TIMESTAMPTZ   DEFAULT NOW(),
  CONSTRAINT fk_calibrations_delegue
    FOREIGN KEY (delegueId) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_calibrations_prospect
    FOREIGN KEY (prospectId) REFERENCES prospects(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_calibrations_delegue ON calibrations(delegueId);
CREATE INDEX idx_calibrations_prospect ON calibrations(prospectId);
CREATE INDEX idx_calibrations_active ON calibrations(estActive)
  WHERE estActive = true;
CREATE UNIQUE INDEX idx_calibrations_unique_active
  ON calibrations(prospectId) WHERE estActive = true;
```

---

### Table: `visits`

Enregistrement des visites générées automatiquement par le système de détection GPS.

```sql
CREATE TABLE visits (
  id                UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  prospectId        UUID          NOT NULL,
  delegueId         UUID          NOT NULL,
  dateVisite        DATE          NOT NULL DEFAULT CURRENT_DATE,
  heureArrivee      TIME          NOT NULL,
  heureDepart       TIME          DEFAULT NULL,
  dureeSecondes     INTEGER       DEFAULT 0,
  estComplete       BOOLEAN       DEFAULT false,
  latitudeArrivee   DECIMAL(10,7) DEFAULT NULL,
  longitudeArrivee  DECIMAL(11,7) DEFAULT NULL,
  createdAt         TIMESTAMPTZ   DEFAULT NOW(),
  updatedAt         TIMESTAMPTZ   DEFAULT NOW(),
  CONSTRAINT fk_visits_prospect
    FOREIGN KEY (prospectId) REFERENCES prospects(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_visits_delegue
    FOREIGN KEY (delegueId) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_visits_duree CHECK (dureeSecondes >= 0)
);

CREATE INDEX idx_visits_prospect ON visits(prospectId);
CREATE INDEX idx_visits_delegue ON visits(delegueId);
CREATE INDEX idx_visits_date ON visits(dateVisite);
CREATE INDEX idx_visits_complete ON visits(estComplete);
CREATE INDEX idx_visits_date_delegue ON visits(dateVisite, delegueId);
CREATE INDEX idx_visits_date_prospect ON visits(dateVisite, prospectId);

-- Index composite pour les requêtes analytiques
CREATE INDEX idx_visits_analytics ON visits(dateVisite, delegueId, estComplete)
  INCLUDE (dureeSecondes);
```

---

### Table: `gps_events`

Journal brut de tous les événements GPS reçus des appareils mobiles.

```sql
CREATE TABLE gps_events (
  id              UUID            DEFAULT uuid_generate_v4() PRIMARY KEY,
  delegueId       UUID            NOT NULL,
  prospectId      UUID            DEFAULT NULL,
  visitId         UUID            DEFAULT NULL,
  latitude        DECIMAL(10,7)   NOT NULL,
  longitude       DECIMAL(11,7)   NOT NULL,
  precision       DECIMAL(5,1)    DEFAULT 0,
  vitesse         DECIMAL(5,2)    DEFAULT 0,
  altitude        DECIMAL(7,2)    DEFAULT 0,
  evenement       VARCHAR(50)     NOT NULL CHECK (
    evenement IN ('position', 'visite_debut', 'visite_fin',
                  'pause_debut', 'pause_fin', 'calibrage')
  ),
  horodatage      TIMESTAMPTZ     NOT NULL,
  estSynchronise  BOOLEAN         DEFAULT false,
  appareilId      VARCHAR(255)    DEFAULT NULL,
  createdAt       TIMESTAMPTZ     DEFAULT NOW(),
  CONSTRAINT fk_gps_events_delegue
    FOREIGN KEY (delegueId) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_gps_events_prospect
    FOREIGN KEY (prospectId) REFERENCES prospects(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_gps_events_visit
    FOREIGN KEY (visitId) REFERENCES visits(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_gps_events_delegue ON gps_events(delegueId);
CREATE INDEX idx_gps_events_prospect ON gps_events(prospectId);
CREATE INDEX idx_gps_events_visit ON gps_events(visitId);
CREATE INDEX idx_gps_events_evenement ON gps_events(evenement);
CREATE INDEX idx_gps_events_horodatage ON gps_events(horodatage);
CREATE INDEX idx_gps_events_sync ON gps_events(estSynchronise, delegueId)
  WHERE estSynchronise = false;
CREATE INDEX idx_gps_events_delegue_date ON gps_events(delegueId, horodatage);

-- Index pour le partitionnement temporel (recommandé pour grosse volumétrie)
-- CREATE INDEX idx_gps_events_month ON gps_events(date_trunc('month', horodatage));
```

---

### Table: `refresh_tokens`

Stockage sécurisé des refresh tokens JWT pour la gestion des sessions.

```sql
CREATE TABLE refresh_tokens (
  id            UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  userId        UUID          NOT NULL,
  token         VARCHAR(255)  NOT NULL,
  expiresAt     TIMESTAMPTZ   NOT NULL,
  estRevoke     BOOLEAN       DEFAULT false,
  createdAt     TIMESTAMPTZ   DEFAULT NOW(),
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (userId) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(userId);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expiresAt)
  WHERE estRevoke = false;
```

---

### Table: `audit_logs`

Journal d'audit centralisé pour toutes les actions modifiant des données.

```sql
CREATE TABLE audit_logs (
  id              UUID            DEFAULT uuid_generate_v4() PRIMARY KEY,
  utilisateurId   UUID            DEFAULT NULL,
  action          VARCHAR(50)     NOT NULL CHECK (
    action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT',
               'CHANGE_PASSWORD', 'CALIBRAGE', 'SYNC', 'EXPORT')
  ),
  entite          VARCHAR(50)     NOT NULL,
  entiteId        UUID            DEFAULT NULL,
  details         JSONB           DEFAULT '{}'::jsonb,
  coordonneesGPS  JSONB           DEFAULT NULL,
  adresseIP       VARCHAR(45)     DEFAULT NULL,
  createdAt       TIMESTAMPTZ     DEFAULT NOW(),
  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (utilisateurId) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_audit_logs_user ON audit_logs(utilisateurId);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entite ON audit_logs(entite);
CREATE INDEX idx_audit_logs_entite_id ON audit_logs(entiteId);
CREATE INDEX idx_audit_logs_date ON audit_logs(createdAt);
CREATE INDEX idx_audit_logs_recherche ON audit_logs
  USING gin (details jsonb_path_ops);

-- Index pour la purge automatique
CREATE INDEX idx_audit_logs_purge ON audit_logs(createdAt)
  WHERE createdAt < NOW() - INTERVAL '90 days';
```

---

### Table: `sync_logs`

Suivi des synchronisations des appareils mobiles.

```sql
CREATE TABLE sync_logs (
  id            UUID            DEFAULT uuid_generate_v4() PRIMARY KEY,
  delegueId     UUID            NOT NULL,
  appareilId    VARCHAR(255)    NOT NULL,
  dernierSync   TIMESTAMPTZ     DEFAULT NOW(),
  status        VARCHAR(20)     NOT NULL CHECK (
    status IN ('success', 'partial', 'failed', 'in_progress')
  ),
  details       JSONB           DEFAULT '{}'::jsonb,
  createdAt     TIMESTAMPTZ     DEFAULT NOW(),
  updatedAt     TIMESTAMPTZ     DEFAULT NOW(),
  CONSTRAINT fk_sync_logs_delegue
    FOREIGN KEY (delegueId) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_sync_logs_delegue ON sync_logs(delegueId);
CREATE INDEX idx_sync_logs_appareil ON sync_logs(appareilId);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_dernier ON sync_logs(dernierSync DESC);
```

---

## Résumé des Relations

| Table | Clé Primaire | Clés Étrangères | Contraintes Uniques |
|-------|:------------|:----------------|:-------------------|
| `users` | `id` (UUID) | — | `email`, `login` |
| `prospect_type_configs` | `type` (VARCHAR) | — | — |
| `prospects` | `id` (UUID) | `calibrateurId → users.id`, `type → prospect_type_configs.type` | — |
| `calibrations` | `id` (UUID) | `delegueId → users.id`, `prospectId → prospects.id` | `(prospectId) WHERE estActive = true` |
| `visits` | `id` (UUID) | `prospectId → prospects.id`, `delegueId → users.id` | — |
| `gps_events` | `id` (UUID) | `delegueId → users.id`, `prospectId → prospects.id`, `visitId → visits.id` | — |
| `refresh_tokens` | `id` (UUID) | `userId → users.id` | — |
| `audit_logs` | `id` (UUID) | `utilisateurId → users.id` | — |
| `sync_logs` | `id` (UUID) | `delegueId → users.id` | — |

---

## Politique de Retention

| Table | Rétention | Purge |
|-------|:----------|:------|
| `gps_events` | 6 mois | Cron job mensuel |
| `audit_logs` | 90 jours | Cron job hebdomadaire |
| `refresh_tokens` | 7 jours après expiration | Triggers + Cron |
| `sync_logs` | 30 jours | Cron journalier |
| `visits` | Illimité | Archivage manuel |
| `prospects` | Illimité | Soft delete (estArchive) |
| `users` | Illimité | Soft delete (estActif) |

---

## Volume Estimé

| Table | Estimation mensuelle | Estimation annuelle |
|-------|:--------------------|:--------------------|
| `gps_events` | 500 000 – 1 000 000 | 6 000 000 – 12 000 000 |
| `visits` | 1 000 – 5 000 | 12 000 – 60 000 |
| `calibrations` | 100 – 500 | 1 200 – 6 000 |
| `prospects` | 50 – 200 | 600 – 2 400 |
| `audit_logs` | 5 000 – 20 000 | 60 000 – 240 000 |
| `sync_logs` | 500 – 2 000 | 6 000 – 24 000 |

# API REST - Documentation Complète

## Informations Générales

**Base URL:** `/api/v1`

**Format:** JSON

**Authentification:** Bearer JWT Token (sauf endpoints publics)

**Headers requis:**
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Codes d'erreur globaux:**

| Code | Description |
|:-----|:-----------|
| `200` | Succès |
| `201` | Créé |
| `400` | Requête invalide (Bad Request) |
| `401` | Non authentifié (Unauthorized) |
| `403` | Non autorisé (Forbidden) |
| `404` | Ressource non trouvée |
| `409` | Conflit (ex: doublon) |
| `422` | Données non traitables (Unprocessable Entity) |
| `429` | Trop de requêtes (Rate limit exceeded) |
| `500` | Erreur interne serveur |

**Format erreur standard:**
```typescript
interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  details?: Record<string, string[]>; // validation errors
}
```

---

## Module Authentification

Endpoints publics pour la connexion, déconnexion et gestion des tokens.

---

### `POST /api/v1/auth/login`

Authentifie un utilisateur et retourne les tokens JWT.

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```typescript
interface LoginRequest {
  login: string;    // Nom d'utilisateur (login)
  motDePasse: string; // Mot de passe
}
```

**Response Body (200):**
```typescript
interface LoginResponse {
  accessToken: string;   // JWT valable 24h
  refreshToken: string;  // Token de refresh valable 7j
  utilisateur: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    login: string;
    role: 'directeur' | 'delegue';
    premierConnexion: boolean;
  };
}
```

**Error Responses:**

| Code | Condition |
|:-----|:----------|
| `401` | Identifiants invalides |
| `401` | Compte désactivé |
| `429` | Trop de tentatives (brute force) |

**Example:**
```bash
curl -X POST https://mega-supervision.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "jdupont",
    "motDePasse": "MotDePasse123!"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
  "utilisateur": {
    "id": "a1b2c3d4-...",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@email.com",
    "login": "jdupont",
    "role": "delegue",
    "premierConnexion": false
  }
}
```

---

### `POST /api/v1/auth/refresh`

Génère un nouveau JWT à partir d'un refresh token valide.

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```typescript
interface RefreshRequest {
  refreshToken: string;
}
```

**Response Body (200):**
```typescript
interface RefreshResponse {
  accessToken: string;
  refreshToken: string;  // Nouveau refresh token (rotation)
}
```

**Error Responses:**

| Code | Condition |
|:-----|:----------|
| `401` | Refresh token invalide ou expiré |
| `401` | Refresh token révoqué |

**Example:**
```bash
curl -X POST https://mega-supervision.com/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
  }'
```

---

### `POST /api/v1/auth/change-password`

Change le mot de passe de l'utilisateur connecté.

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```typescript
interface ChangePasswordRequest {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
}
```

**Règles mot de passe:**
- Minimum 8 caractères
- Au moins 1 majuscule
- Au moins 1 minuscule
- Au moins 1 chiffre
- Ne peut pas être identique à l'ancien

**Response Body (200):**
```typescript
interface ChangePasswordResponse {
  message: 'Mot de passe modifié avec succès';
}
```

**Error Responses:**

| Code | Condition |
|:-----|:----------|
| `400` | Nouveau mot de passe invalide (ne respecte pas les règles) |
| `400` | Nouveau mot de passe identique à l'ancien |
| `401` | Ancien mot de passe incorrect |

**Example:**
```bash
curl -X POST https://mega-supervision.com/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "ancienMotDePasse": "AncienPass123!",
    "nouveauMotDePasse": "NouveauPass456!"
  }'
```

---

### `POST /api/v1/auth/logout`

Révoque le refresh token et déconnecte l'utilisateur.

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```typescript
interface LogoutRequest {
  refreshToken: string;
}
```

**Response Body (200):**
```typescript
interface LogoutResponse {
  message: 'Déconnexion réussie';
}
```

**Example:**
```bash
curl -X POST https://mega-supervision.com/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
  }'
```

---

## Module Utilisateurs

CRUD complet pour la gestion des utilisateurs. Réservé au rôle `directeur`.

---

### `GET /api/v1/users`

Liste tous les utilisateurs actifs avec pagination et filtres.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface ListUsersQuery {
  page?: number;       // Default: 1
  limit?: number;      // Default: 20, Max: 100
  role?: 'directeur' | 'delegue';
  estActif?: boolean;
  recherche?: string;  // Recherche nom/prénom/login
}
```

**Response Body (200):**
```typescript
interface ListUsersResponse {
  data: Array<{
    id: string;
    nom: string;
    prenom: string;
    telephone: string | null;
    email: string;
    login: string;
    role: 'directeur' | 'delegue';
    estActif: boolean;
    premierConnexion: boolean;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Example:**
```bash
curl https://mega-supervision.com/api/v1/users?page=1&limit=20&role=delegue \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### `GET /api/v1/users/:id`

Détails d'un utilisateur spécifique.

**Headers:** `Authorization: Bearer <token>`

**Response Body (200):**
```typescript
interface GetUserResponse {
  id: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  email: string;
  login: string;
  role: 'directeur' | 'delegue';
  estActif: boolean;
  premierConnexion: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalVisites: number;
    totalProspects: number;
    derniereVisite: string | null;
  };
}
```

**Error Responses:**

| Code | Condition |
|:-----|:----------|
| `404` | Utilisateur non trouvé |

**Example:**
```bash
curl https://mega-supervision.com/api/v1/users/a1b2c3d4-... \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### `POST /api/v1/users`

Crée un nouvel utilisateur.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface CreateUserRequest {
  nom: string;
  prenom: string;
  telephone?: string;
  email: string;
  login: string;
  motDePasse: string;
  role: 'directeur' | 'delegue';
}
```

**Response Body (201):**
```typescript
interface CreateUserResponse {
  id: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  email: string;
  login: string;
  role: 'directeur' | 'delegue';
  estActif: boolean;
  premierConnexion: boolean;
  createdAt: string;
}
```

**Error Responses:**

| Code | Condition |
|:-----|:----------|
| `409` | Email ou login déjà utilisé |
| `400` | Données invalides (validation échouée) |

**Example:**
```bash
curl -X POST https://mega-supervision.com/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "nom": "Martin",
    "prenom": "Sophie",
    "email": "sophie.martin@email.com",
    "login": "smartin",
    "motDePasse": "Pass1234!",
    "role": "delegue"
  }'
```

---

### `PATCH /api/v1/users/:id`

Met à jour les informations d'un utilisateur.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface UpdateUserRequest {
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  login?: string;
  estActif?: boolean;
}
```

**Response Body (200):**
```typescript
interface UpdateUserResponse {
  id: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  email: string;
  login: string;
  role: 'directeur' | 'delegue';
  estActif: boolean;
  updatedAt: string;
}
```

**Error Responses:**

| Code | Condition |
|:-----|:----------|
| `404` | Utilisateur non trouvé |
| `409` | Email ou login déjà utilisé |

---

### `DELETE /api/v1/users/:id`

Désactive un utilisateur (soft delete — passe `estActif = false`).

**Headers:** `Authorization: Bearer <token>`

**Response Body (200):**
```typescript
interface DeleteUserResponse {
  message: 'Utilisateur désactivé avec succès';
}
```

> **Note:** Un utilisateur ne peut pas se supprimer lui-même.

---

### `POST /api/v1/users/:id/reset-password`

Réinitialise le mot de passe d'un utilisateur.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface ResetPasswordRequest {
  nouveauMotDePasse: string;
}
```

**Response Body (200):**
```typescript
interface ResetPasswordResponse {
  message: 'Mot de passe réinitialisé avec succès';
}
```

---

### `POST /api/v1/users/:id/activate`

Réactive un utilisateur désactivé.

**Headers:** `Authorization: Bearer <token>`

**Response Body (200):**
```typescript
interface ActivateUserResponse {
  message: 'Utilisateur réactivé avec succès';
}
```

---

### `GET /api/v1/users/delegues/actifs`

Liste les délégués actifs (utile pour les sélecteurs dans le dashboard).

**Headers:** `Authorization: Bearer <token>`

**Response Body (200):**
```typescript
interface ListDeleguesActifsResponse {
  data: Array<{
    id: string;
    nom: string;
    prenom: string;
  }>;
}
```

**Example:**
```bash
curl https://mega-supervision.com/api/v1/users/delegues/actifs \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## Module Prospects

Gestion des prospects commerciaux.

---

### `GET /api/v1/prospects`

Liste paginée des prospects avec filtres.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface ListProspectsQuery {
  page?: number;
  limit?: number;
  type?: string;
  estArchive?: boolean;
  estCalibre?: boolean;
  recherche?: string;   // Recherche nom/ville/région
  region?: string;
  calibrateurId?: string;
}
```

**Response Body (200):**
```typescript
interface ListProspectsResponse {
  data: Array<{
    id: string;
    nom: string;
    type: string;
    adresse: string | null;
    ville: string | null;
    region: string | null;
    telephone: string | null;
    estArchive: boolean;
    estCalibre: boolean;
    dateCalibrage: string | null;
    latitude: number | null;
    longitude: number | null;
    calibrateur: {
      id: string;
      nom: string;
      prenom: string;
    } | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

### `GET /api/v1/prospects/:id`

Détails d'un prospect avec ses visites récentes.

**Headers:** `Authorization: Bearer <token>`

**Response Body (200):**
```typescript
interface GetProspectResponse {
  id: string;
  nom: string;
  type: string;
  adresse: string | null;
  ville: string | null;
  region: string | null;
  telephone: string | null;
  notes: string | null;
  estArchive: boolean;
  estCalibre: boolean;
  dateCalibrage: string | null;
  latitude: number | null;
  longitude: number | null;
  calibrateur: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
  derniereVisite: {
    date: string;
    duree: number;
    delegue: { nom: string; prenom: string };
  } | null;
  visitesRecentes?: Array<{
    id: string;
    dateVisite: string;
    dureeSecondes: number;
    delegue: { nom: string; prenom: string };
  }>;
}
```

---

### `POST /api/v1/prospects`

Crée un nouveau prospect.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface CreateProspectRequest {
  nom: string;
  type: string;
  adresse?: string;
  ville?: string;
  region?: string;
  telephone?: string;
  notes?: string;
}
```

**Response Body (201):** `GetProspectResponse`

**Example:**
```bash
curl -X POST https://mega-supervision.com/api/v1/prospects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "nom": "Pharmacie Centrale",
    "type": "pharmacie",
    "adresse": "12 Rue de la Paix",
    "ville": "Paris",
    "region": "Île-de-France",
    "telephone": "0123456789"
  }'
```

---

### `PATCH /api/v1/prospects/:id`

Met à jour un prospect.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface UpdateProspectRequest {
  nom?: string;
  type?: string;
  adresse?: string;
  ville?: string;
  region?: string;
  telephone?: string;
  notes?: string;
  estArchive?: boolean;
}
```

---

### `DELETE /api/v1/prospects/:id`

Archive un prospect (soft delete via `estArchive = true`).

**Headers:** `Authorization: Bearer <token>`

---

### `GET /api/v1/prospects/types`

Liste les types de prospects disponibles avec leurs configurations.

**Headers:** `Authorization: Bearer <token>`

**Response Body (200):**
```typescript
interface ListProspectTypesResponse {
  data: Array<{
    type: string;
    rayonPresence: number;
    pauseStart: string;
    pauseEnd: string;
  }>;
}
```

---

### `PATCH /api/v1/prospects/types/:type`

Met à jour la configuration d'un type de prospect.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface UpdateProspectTypeRequest {
  rayonPresence?: number;
  pauseStart?: string;
  pauseEnd?: string;
}
```

---

## Module Calibration

Gestion des points GPS de calibration des prospects.

---

### `POST /api/v1/calibrations`

Calibre un prospect sur sa position GPS actuelle.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface CreateCalibrationRequest {
  prospectId: string;
  latitude: number;
  longitude: number;
}
```

**Response Body (201):**
```typescript
interface CreateCalibrationResponse {
  id: string;
  prospectId: string;
  latitude: number;
  longitude: number;
  dateCalibrage: string;
  estActive: boolean;
}
```

**Example:**
```bash
curl -X POST https://mega-supervision.com/api/v1/calibrations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "prospectId": "b2c3d4e5-...",
    "latitude": 48.8566,
    "longitude": 2.3522
  }'
```

**Error Responses:**

| Code | Condition |
|:-----|:----------|
| `400` | Prospect déjà calibré |
| `404` | Prospect non trouvé |
| `403` | L'utilisateur n'est pas un délégué |

---

### `GET /api/v1/calibrations/:prospectId`

Récupère la calibration active d'un prospect.

**Headers:** `Authorization: Bearer <token>`

**Response Body (200):**
```typescript
interface GetCalibrationResponse {
  id: string;
  prospectId: string;
  delegueId: string;
  latitude: number;
  longitude: number;
  dateCalibrage: string;
  estActive: boolean;
  delegue: {
    nom: string;
    prenom: string;
  };
}
```

---

### `DELETE /api/v1/calibrations/:id`

Désactive une calibration.

**Headers:** `Authorization: Bearer <token>`

**Response Body (200):**
```typescript
interface DeleteCalibrationResponse {
  message: 'Calibration désactivée avec succès';
}
```

---

## Module GPS

Endpoint de réception et synchronisation des événements GPS.

---

### `POST /api/v1/gps/event`

Enregistre un événement GPS ponctuel.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface CreateGpsEventRequest {
  latitude: number;
  longitude: number;
  precision?: number;
  vitesse?: number;
  altitude?: number;
  evenement: 'position' | 'visite_debut' | 'visite_fin' | 'pause_debut' | 'pause_fin' | 'calibrage';
  horodatage: string;
  prospectId?: string;
  visitId?: string;
  appareilId?: string;
}
```

**Response Body (201):**
```typescript
interface CreateGpsEventResponse {
  id: string;
  evenement: string;
  horodatage: string;
  visitDetected?: boolean;
  visitId?: string;
  action?: 'start' | 'end' | 'pause' | 'resume' | null;
}
```

**Example:**
```bash
curl -X POST https://mega-supervision.com/api/v1/gps/event \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "latitude": 48.8566,
    "longitude": 2.3522,
    "precision": 3.5,
    "vitesse": 0.5,
    "evenement": "position",
    "horodatage": "2025-01-15T14:30:00Z",
    "appareilId": "device-abc-123"
  }'
```

---

### `POST /api/v1/gps/batch`

Enregistre un lot d'événements GPS (utilisé pour la synchronisation hors ligne).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface BatchGpsEventRequest {
  events: Array<{
    latitude: number;
    longitude: number;
    precision?: number;
    vitesse?: number;
    altitude?: number;
    evenement: string;
    horodatage: string;
    prospectId?: string;
    visitId?: string;
    appareilId?: string;
  }>;
}
```

**Response Body (201):**
```typescript
interface BatchGpsEventResponse {
  synced: number;
  errors: number;
  ids: string[];
}
```

---

### `POST /api/v1/gps/sync`

Synchronisation complète depuis le mode hors ligne. Envoie les événements en attente et reçoit les données à jour.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface SyncRequest {
  appareilId: string;
  dernierSync: string;
  events: Array<{
    latitude: number;
    longitude: number;
    precision?: number;
    vitesse?: number;
    altitude?: number;
    evenement: string;
    horodatage: string;
    prospectId?: string;
    visitId?: string;
  }>;
}
```

**Response Body (200):**
```typescript
interface SyncResponse {
  synced: string[];      // IDs des événements synchronisés
  prospects: Array<{
    id: string;
    nom: string;
    type: string;
    latitude: number | null;
    longitude: number | null;
    estCalibre: boolean;
  }>;
  calibrations: Array<{
    prospectId: string;
    latitude: number;
    longitude: number;
  }>;
  horodatage: string;
}
```

---

### `GET /api/v1/gps/status`

Statut de la connexion GPS et de la synchronisation.

**Headers:** `Authorization: Bearer <token>`

**Response Body (200):**
```typescript
interface GpsStatusResponse {
  appareilId: string;
  dernierSync: string | null;
  eventsEnAttente: number;
  estConnecte: boolean;
}
```

---

## Module Visites

Gestion et consultation des visites générées automatiquement.

---

### `GET /api/v1/visits`

Liste paginée des visites avec filtres puissants.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface ListVisitsQuery {
  page?: number;
  limit?: number;
  dateDebut?: string;   // ISO date
  dateFin?: string;
  delegueId?: string;
  prospectId?: string;
  estComplete?: boolean;
  dureeMin?: number;     // Durée minimum en secondes
  dureeMax?: number;
}
```

**Response Body (200):**
```typescript
interface ListVisitsResponse {
  data: Array<{
    id: string;
    dateVisite: string;
    heureArrivee: string;
    heureDepart: string | null;
    dureeSecondes: number;
    estComplete: boolean;
    prospect: {
      id: string;
      nom: string;
      type: string;
      ville: string | null;
    };
    delegue: {
      id: string;
      nom: string;
      prenom: string;
    };
    latitudeArrivee: number | null;
    longitudeArrivee: number | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  resume?: {
    totalDuree: number;
    moyenneDuree: number;
    visitesCompletees: number;
  };
}
```

---

### `GET /api/v1/visits/:id`

Détails d'une visite avec les événements GPS associés.

**Headers:** `Authorization: Bearer <token>`

**Response Body (200):**
```typescript
interface GetVisitResponse {
  id: string;
  dateVisite: string;
  heureArrivee: string;
  heureDepart: string | null;
  dureeSecondes: number;
  estComplete: boolean;
  prospect: {
    id: string;
    nom: string;
    type: string;
    adresse: string | null;
    ville: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  delegue: {
    id: string;
    nom: string;
    prenom: string;
  };
  latitudeArrivee: number | null;
  longitudeArrivee: number | null;
  gpsEvents: Array<{
    id: string;
    latitude: number;
    longitude: number;
    precision: number;
    vitesse: number;
    evenement: string;
    horodatage: string;
  }>;
}
```

---

### `GET /api/v1/visits/current/:delegueId`

Récupère la visite en cours d'un délégué (si existante).

**Headers:** `Authorization: Bearer <token>`

**Response Body (200):**
```typescript
interface GetCurrentVisitResponse {
  visite: {
    id: string;
    dateVisite: string;
    heureArrivee: string;
    dureeSecondes: number;
    prospect: {
      id: string;
      nom: string;
      type: string;
      latitude: number;
      longitude: number;
    };
  } | null;
}
```

---

### `PATCH /api/v1/visits/:id`

Met à jour manuellement une visite (notes, correction de durée).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface UpdateVisitRequest {
  notes?: string;
  dureeSecondes?: number;
}
```

---

### `DELETE /api/v1/visits/:id`

Supprime une visite (réservé au directeur).

**Headers:** `Authorization: Bearer <token>`

---

### `GET /api/v1/visits/stats`

Statistiques globales sur les visites.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface VisitStatsQuery {
  dateDebut: string;
  dateFin: string;
  delegueId?: string;
}
```

**Response Body (200):**
```typescript
interface VisitStatsResponse {
  totalVisites: number;
  visitesCompletees: number;
  visitesEnCours: number;
  dureeTotaleSecondes: number;
  dureeMoyenneSecondes: number;
  visitesParJour: Array<{
    date: string;
    count: number;
  }>;
  topProspects: Array<{
    prospectId: string;
    nom: string;
    count: number;
    dureeTotale: number;
  }>;
}
```

---

## Module Analytics

Statistiques et données agrégées pour le dashboard.

---

### `GET /api/v1/analytics/overview`

Vue d'ensemble du tableau de bord.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface AnalyticsOverviewQuery {
  debut: string;   // ISO date
  fin: string;
}
```

**Response Body (200):**
```typescript
interface AnalyticsOverviewResponse {
  period: { debut: string; fin: string };
  stats: {
    visitesTotal: number;
    visitesCompletees: number;
    visitesEnCours: number;
    dureeTotale: number;
    dureeMoyenne: number;
    prospectsVisites: number;
    deleguesActifs: number;
    tauxCompletion: number; // Pourcentage
  };
  evolution: Array<{
    date: string;
    visites: number;
    duree: number;
    delegues: number;
  }>;
  topDelegues: Array<{
    id: string;
    nom: string;
    prenom: string;
    visites: number;
    dureeTotale: number;
    prospectsVisites: number;
  }>;
  topProspects: Array<{
    id: string;
    nom: string;
    visites: number;
    dureeTotale: number;
  }>;
}
```

---

### `GET /api/v1/analytics/delegue/:id`

Analytics détaillés pour un délégué spécifique.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface DelegueAnalyticsQuery {
  debut: string;
  fin: string;
}
```

**Response Body (200):**
```typescript
interface DelegueAnalyticsResponse {
  delegue: { id: string; nom: string; prenom: string };
  period: { debut: string; fin: string };
  stats: {
    visites: number;
    dureeTotale: number;
    dureeMoyenne: number;
    prospectsVisites: number;
    joursActifs: number;
    premiersVisites: number;  // Visites avant 10h
  };
  visitesParJour: Array<{
    date: string;
    count: number;
    duree: number;
  }>;
  repartitionTypes: Array<{
    type: string;
    count: number;
    pourcentage: number;
  }>;
}
```

---

### `GET /api/v1/analytics/prospect/:id`

Analytics pour un prospect spécifique.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface ProspectAnalyticsQuery {
  debut: string;
  fin: string;
}
```

**Response Body (200):**
```typescript
interface ProspectAnalyticsResponse {
  prospect: { id: string; nom: string; type: string };
  period: { debut: string; fin: string };
  stats: {
    totalVisites: number;
    dureeTotale: number;
    dureeMoyenne: number;
    dureeMaximale: number;
    dureeMinimale: number;
    frequenceJours: number;  // Espacement moyen entre visites
  };
  visites: Array<{
    date: string;
    duree: number;
    delegue: string;
    estComplete: boolean;
  }>;
}
```

---

### `GET /api/v1/analytics/performance`

Rapport de performance comparatif entre délégués.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface PerformanceQuery {
  debut: string;
  fin: string;
}
```

**Response Body (200):**
```typescript
interface PerformanceResponse {
  classement: Array<{
    delegue: { id: string; nom: string; prenom: string };
    visites: number;
    dureeTotale: number;
    dureeMoyenne: number;
    prospectsUniques: number;
    score: number; // Score composite
  }>;
}
```

---

### `GET /api/v1/analytics/export`

Export CSV des données analytiques brutes.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
```typescript
interface AnalyticsExportQuery {
  debut: string;
  fin: string;
  type: 'visits' | 'delegues' | 'prospects';
}
```

**Response (200):** Fichier CSV avec `Content-Type: text/csv`

---

## Module PDF

Génération et téléchargement de rapports PDF.

---

### `POST /api/v1/pdf/visits`

Génère un rapport PDF des visites pour une période.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface PdfVisitsRequest {
  dateDebut: string;
  dateFin: string;
  delegueId?: string;
  prospectId?: string;
  includeCharts?: boolean;
}
```

**Response (200):** Fichier PDF avec `Content-Type: application/pdf` et `Content-Disposition: attachment; filename="rapport-visites-2025-01-15.pdf"`

**Example:**
```bash
curl -X POST https://mega-supervision.com/api/v1/pdf/visits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "dateDebut": "2025-01-01",
    "dateFin": "2025-01-31",
    "includeCharts": true
  }' \
  --output rapport.pdf
```

---

### `POST /api/v1/pdf/delegue/:id`

Génère un rapport PDF individuel pour un délégué.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
interface PdfDelegueRequest {
  dateDebut: string;
  dateFin: string;
  includeCharts?: boolean;
}
```

**Response (200):** Fichier PDF

---

### `POST /api/v1/pdf/prospect/:id`

Génère une fiche prospect au format PDF.

**Headers:** `Authorization: Bearer <token>`

**Response (200):** Fichier PDF avec l'historique complet du prospect

---

## Module Audit

Consultation des logs d'audit.

---

### `GET /api/v1/audit`

Liste paginée des logs d'audit.

**Headers:** `Authorization: Bearer <token>` (rôle `directeur` uniquement)

**Query Parameters:**
```typescript
interface AuditListQuery {
  page?: number;
  limit?: number;
  utilisateurId?: string;
  action?: string;
  entite?: string;
  dateDebut?: string;
  dateFin?: string;
}
```

**Response Body (200):**
```typescript
interface AuditListResponse {
  data: Array<{
    id: string;
    action: string;
    entite: string;
    entiteId: string | null;
    details: Record<string, any>;
    coordonneesGPS: { latitude: number; longitude: number } | null;
    adresseIP: string | null;
    utilisateur: {
      id: string;
      nom: string;
      prenom: string;
    } | null;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

### `GET /api/v1/audit/resume`

Résumé des actions récentes pour le dashboard.

**Headers:** `Authorization: Bearer <token>` (rôle `directeur` uniquement)

**Response Body (200):**
```typescript
interface AuditResumeResponse {
  dernieresActions: Array<{
    action: string;
    entite: string;
    utilisateur: string;
    createdAt: string;
  }>;
  stats: {
    aujourdhui: number;
    cetteSemaine: number;
    connexions: number;
    modifications: number;
  };
}
```

---

## Résumé des Endpoints

| Module | Méthode | URL | Rôle |
|:-------|:--------|:----|:-----|
| **Auth** | POST | `/auth/login` | Public |
| | POST | `/auth/refresh` | Public |
| | POST | `/auth/change-password` | Authentifié |
| | POST | `/auth/logout` | Authentifié |
| **Users** | GET | `/users` | Directeur |
| | GET | `/users/:id` | Directeur |
| | POST | `/users` | Directeur |
| | PATCH | `/users/:id` | Directeur |
| | DELETE | `/users/:id` | Directeur |
| | POST | `/users/:id/reset-password` | Directeur |
| | POST | `/users/:id/activate` | Directeur |
| | GET | `/users/delegues/actifs` | Authentifié |
| **Prospects** | GET | `/prospects` | Authentifié |
| | GET | `/prospects/:id` | Authentifié |
| | POST | `/prospects` | Authentifié |
| | PATCH | `/prospects/:id` | Authentifié |
| | DELETE | `/prospects/:id` | Directeur |
| | GET | `/prospects/types` | Authentifié |
| | PATCH | `/prospects/types/:type` | Directeur |
| **Calibration** | POST | `/calibrations` | Délégué |
| | GET | `/calibrations/:prospectId` | Authentifié |
| | DELETE | `/calibrations/:id` | Authentifié |
| **GPS** | POST | `/gps/event` | Délégué |
| | POST | `/gps/batch` | Délégué |
| | POST | `/gps/sync` | Délégué |
| | GET | `/gps/status` | Délégué |
| **Visits** | GET | `/visits` | Authentifié |
| | GET | `/visits/:id` | Authentifié |
| | GET | `/visits/current/:delegueId` | Authentifié |
| | PATCH | `/visits/:id` | Authentifié |
| | DELETE | `/visits/:id` | Directeur |
| | GET | `/visits/stats` | Directeur |
| **Analytics** | GET | `/analytics/overview` | Directeur |
| | GET | `/analytics/delegue/:id` | Directeur |
| | GET | `/analytics/prospect/:id` | Directeur |
| | GET | `/analytics/performance` | Directeur |
| | GET | `/analytics/export` | Directeur |
| **PDF** | POST | `/pdf/visits` | Directeur |
| | POST | `/pdf/delegue/:id` | Directeur |
| | POST | `/pdf/prospect/:id` | Directeur |
| **Audit** | GET | `/audit` | Directeur |
| | GET | `/audit/resume` | Directeur |

# Diagrammes UML — Mega Supervision

Ce document contient les diagrammes UML complets de l'application Mega Supervision, couvrant les cas d'utilisation, les classes, les séquences et le déploiement.

---

## 1. Diagramme de Cas d'Utilisation

Le diagramme de cas d'utilisation modélise les interactions entre les acteurs (Directeur Commercial, Délégué Commercial) et le système Mega Supervision.

```plantuml
@startuml
left to right direction
skinparam actorStyle awesome
skinparam usecase {
  BackgroundColor #f0f8ff
  BorderColor #4682b4
  FontName Arial
}

actor "Directeur Commercial\n(DC)" as DC
actor "Délégué Commercial\n(DG)" as DG

rectangle "Mega Supervision" {
  usecase "Gérer les délégués" as UC1
  usecase "Gérer les prospects" as UC2
  usecase "Configurer les rayons GPS" as UC3
  usecase "Consulter les analyses" as UC4
  usecase "Générer des rapports PDF" as UC5
  usecase "Consulter les audits" as UC6
  usecase "Exporter les données" as UC12

  usecase "Se connecter" as UC7
  usecase "Calibrer un prospect" as UC8
  usecase "Effectuer des visites" as UC9
  usecase "Consulter l'historique" as UC10
  usecase "Synchroniser les données" as UC11
  usecase "Modifier son profil" as UC13

  DC --> UC1 : Gère
  DC --> UC2 : Gère
  DC --> UC3 : Configure
  DC --> UC4 : Consulte
  DC --> UC5 : Génère
  DC --> UC6 : Consulte
  DC --> UC12 : Exporte
  DC --> UC7

  DG --> UC7 : S'authentifie
  DG --> UC8 : Calibre
  DG --> UC9 : Réalise
  DG --> UC10 : Consulte
  DG --> UC11 : Synchronise
  DG --> UC13 : Modifie

  note right of UC8
    Requis pour la détection
    automatique des visites
  end note

  note right of UC9
    Automatique via GPS
    seuil de 4 mètres
  end note
}
@enduml
```

### Description des Cas d'Utilisation

| ID | Cas d'Utilisation | Acteur | Description |
|:---|:-----------------|:-------|:------------|
| UC1 | Gérer les délégués | DC | CRUD des comptes délégués, activation/désactivation |
| UC2 | Gérer les prospects | DC, DG | CRUD des prospects, archivage |
| UC3 | Configurer les rayons GPS | DC | Définir les rayons de présence par type de prospect |
| UC4 | Consulter les analyses | DC | Dashboard, statistiques, tendances |
| UC5 | Générer des rapports PDF | DC | Rapports de visites, fiches prospects |
| UC6 | Consulter les audits | DC | Journal des actions et modifications |
| UC7 | Se connecter | DC, DG | Authentification JWT |
| UC8 | Calibrer un prospect | DG | Capturer la position GPS du prospect |
| UC9 | Effectuer des visites | DG | Visites automatiques déclenchées par la proximité GPS |
| UC10 | Consulter l'historique | DG | Historique des visites personnelles |
| UC11 | Synchroniser les données | DG | Synchronisation hors ligne/online |
| UC12 | Exporter les données | DC | Export CSV/Excel des données |
| UC13 | Modifier son profil | DG | Changer mot de passe, informations personnelles |

---

## 2. Diagramme de Classes

Le diagramme de classes modélise la structure statique du système avec les entités, leurs attributs, méthodes et relations.

```plantuml
@startuml
skinparam class {
  BackgroundColor #f5f5dc
  BorderColor #8b4513
  FontName Arial
}

class User {
  - id: UUID
  - nom: string
  - prenom: string
  - telephone: string
  - email: string
  - login: string
  - motDePasse: string
  - role: Role
  - estActif: boolean
  - premierConnexion: boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + login(credentials): Token
  + changePassword(oldPwd, newPwd): void
  + getFullName(): string
  + isDirecteur(): boolean
  + isDelegue(): boolean
}

enum Role {
  directeur
  delegue
}

enum EventType {
  position
  visite_debut
  visite_fin
  pause_debut
  pause_fin
  calibrage
}

class Prospect {
  - id: UUID
  - nom: string
  - type: string
  - adresse: string
  - ville: string
  - region: string
  - telephone: string
  - notes: string
  - estArchive: boolean
  - latitude: float
  - longitude: float
  - estCalibre: boolean
  - dateCalibrage: DateTime
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + calibrer(lat, lng): Calibration
  + archiver(): void
  + getCoordonnees(): Coord
}

class Visite {
  - id: UUID
  - dateVisite: Date
  - heureArrivee: Time
  - heureDepart: Time
  - dureeSecondes: int
  - estComplete: boolean
  - latitudeArrivee: float
  - longitudeArrivee: float
  - estEnPause: boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + demarrer(lat, lng): void
  + terminer(lat, lng): void
  + mettreEnPause(): void
  + reprendre(): void
  + calculerDuree(): int
  + estDansPauseDejeuner(): boolean
}

class Calibration {
  - id: UUID
  - latitude: float
  - longitude: float
  - dateCalibrage: DateTime
  - estActive: boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + desactiver(): void
  + getDistanceFrom(lat, lng): float
}

class GpsEvent {
  - id: UUID
  - latitude: float
  - longitude: float
  - precision: float
  - vitesse: float
  - altitude: float
  - evenement: EventType
  - horodatage: DateTime
  - estSynchronise: boolean
  - appareilId: string
  - createdAt: DateTime
  --
  + isPosition(): boolean
  + isVisitBoundary(): boolean
  + isValid(): boolean
}

class ProspectTypeConfig {
  - type: string
  - rayonPresence: int
  - pauseStart: Time
  - pauseEnd: Time
  - createdAt: DateTime
  - updatedAt: DateTime
  --
  + getRayon(): int
  + isPauseDejeuner(time): boolean
}

class AuditLog {
  - id: UUID
  - action: string
  - entite: string
  - entiteId: UUID
  - details: JSON
  - coordonneesGPS: JSON
  - adresseIP: string
  - createdAt: DateTime
}

class RefreshToken {
  - id: UUID
  - token: string
  - expiresAt: DateTime
  - estRevoke: boolean
  - createdAt: DateTime
  --
  + isExpired(): boolean
  + revoke(): void
}

class SyncLog {
  - id: UUID
  - appareilId: string
  - dernierSync: DateTime
  - status: SyncStatus
  - details: JSON
  - createdAt: DateTime
  - updatedAt: DateTime
}

enum SyncStatus {
  success
  partial
  failed
  in_progress
}

' ========== RELATIONS ==========

User "1" -- "*" Visite : effectue >
User "1" -- "*" Calibration : réalise >
User "1" -- "*" GpsEvent : génère >
User "1" -- "*" AuditLog : concerne >
User "1" -- "*" RefreshToken : possède >
User "1" -- "*" SyncLog : synchronise >

Prospect "1" -- "*" Visite : contient >
Prospect "1" -- "*" Calibration : référence >
Prospect "*" -- "1" ProspectTypeConfig : configuré par >

Prospect "1" -- "0..1" User : calibré par >

Calibration "*" -- "1" User : réalisée par
Calibration "*" -- "1" Prospect : pour

GpsEvent "*" -- "1" Visite : lié à >
GpsEvent "*" -- "1" User : envoyé par
GpsEvent "*" -- "0..1" Prospect : concernant

Visite "*" -- "1" Prospect : chez
Visite "*" -- "1" User : par

@enduml
```

### Relations et Cardinalités

| Relation | De | Vers | Cardinalité | Signification |
|:---------|:---|:-----|:------------|:--------------|
| effectue | User | Visite | 1 → ∞ | Un utilisateur peut avoir plusieurs visites |
| réalise | User | Calibration | 1 → ∞ | Un utilisateur peut réaliser plusieurs calibrations |
| génère | User | GpsEvent | 1 → ∞ | Un utilisateur génère de nombreux événements GPS |
| possède | User | RefreshToken | 1 → ∞ | Un utilisateur peut avoir plusieurs refresh tokens actifs |
| synchronise | User | SyncLog | 1 → ∞ | Un utilisateur a plusieurs logs de synchronisation |
| contient | Prospect | Visite | 1 → ∞ | Un prospect peut avoir plusieurs visites |
| référence | Prospect | Calibration | 1 → ∞ | Un prospect peut avoir plusieurs calibrations (1 active) |
| configuré par | Prospect | ProspectTypeConfig | ∞ → 1 | Chaque prospect est d'un type avec sa configuration |
| lié à | GpsEvent | Visite | ∞ → 1 | Un événement GPS peut être lié à une visite |
| calibré par | Prospect | User | 1 → 0..1 | Un prospect est calibré par au plus un utilisateur |

---

## 3. Diagramme de Séquence — Visite Automatique

Ce diagramme illustre le flot complet d'une visite automatique, de l'authentification du délégué à la finalisation de la visite, incluant la gestion de la pause déjeuner et le mode hors ligne.

```plantuml
@startuml
skinparam sequence {
  ArrowColor #333
  ActorBorderColor #4682b4
  LifeLineBorderColor #4682b4
  LifeLineBackgroundColor #f0f8ff
  ParticipantBorderColor #8b4513
  ParticipantBackgroundColor #f5f5dc
}

actor "Délégué\nCommercial" as DG
participant "App Mobile\n(React Native)" as Mobile
participant "GPS Engine\n(Mobile)" as GPS
participant "Backend API\n(NestJS)" as API
participant "Algo Détection\n(Haversine)" as Algo
database "PostgreSQL" as DB
database "SQLite\n(Offline)" as SQLite

== AUTHENTIFICATION ==
DG -> Mobile: Ouvrir application
Mobile -> API: POST /auth/login
note right: { login, motDePasse }
API --> Mobile: { accessToken, refreshToken, utilisateur }
Mobile -> Mobile: Stocker token (SecureStore)

== CHARGEMENT PROSPECTS ==
DG -> Mobile: Naviguer vers liste prospects
Mobile -> API: GET /prospects?estArchive=false
API --> Mobile: Liste des prospects avec statut calibration
Mobile -> Mobile: Afficher liste

== CALIBRAGE PROSPECT ==
DG -> Mobile: Sélectionner prospect\nCliquer "Calibrer"
Mobile -> GPS: getCurrentPosition()
GPS --> Mobile: { latitude: 48.8566, longitude: 2.3522 }
Mobile -> Mobile: Afficher position pour confirmation
DG -> Mobile: Confirmer calibration
Mobile -> API: POST /calibrations
note right: { prospectId, lat, lng }
API -> API: Valider données
API -> Algo: Vérifier cohérence position
API -> DB: INSERT calibration (estActive = true)
API -> DB: UPDATE prospects (estCalibre = true, lat, lng)
API -> DB: INSERT audit_log
API --> Mobile: { id, prospectId, status: "success" }
Mobile -> Mobile: Afficher "Prospect calibré ✓"

== DÉBUT VISITE AUTOMATIQUE ==
DG -> Mobile: Activer tracking GPS
Mobile -> GPS: startBackgroundWatch()
note right: Intervalle: 5 secondes

loop Boucle GPS toutes les 5s
  GPS -> GPS: getCurrentPosition()
  GPS --> Mobile: { lat: 48.8567, lng: 2.3521, precision: 3.2m }

  alt Connexion disponible
    Mobile -> API: POST /gps/event
    note right: { evenement: 'position', lat, lng, precision }
    API -> Algo: haversineDistance(position, calibration)
    Algo -> Algo: distance = 2.5m (<= 4m ? OUI)
    Algo -> Algo: Aucune visite active en cours
    alt Distance <= 4m
      API -> DB: INSERT visits (heureArrivee, dateVisite)
      API -> DB: INSERT gps_events (evenement: 'visite_debut')
      API --> Mobile: { visitDetected: true, visitId, action: 'start' }
      Mobile -> Mobile: Afficher timer de visite
      Mobile -> Mobile: Notification "Visite démarrée"
    else Distance > 4m
      API --> Mobile: { visitDetected: false }
    end
  else Pas de connexion
    Mobile -> SQLite: INSERT gps_events (estSynchronise = false)
    SQLite --> Mobile: Event saved offline
  end
end

== SUIVI VISITE ==
loop Boucle GPS (visite active)
  GPS --> Mobile: Nouvelle position
  Mobile -> API: POST /gps/event (position)
  API -> Algo: distance = 8m (RAYON = 50m, OK)
  API -> API: Vérifier pause déjeuner

  alt 13:00 <= heure <= 15:00
    API -> API: Démarrer pause déjeuner
    API -> DB: INSERT gps_events (evenement: 'pause_debut')
    API --> Mobile: { action: 'pause' }
    Mobile -> Mobile: Pause timer (afficher "Pause déjeuner")
  end

  alt Visiteur sort du rayon
    API -> Algo: distance = 65m > 50m (rayon)
    API -> API: Terminer visite
    API -> DB: UPDATE visits (heureDepart, dureeSecondes, estComplete = true)
    API -> DB: INSERT gps_events (evenement: 'visite_fin')
    API --> Mobile: { action: 'end', duree: 1250 }
    Mobile -> Mobile: Arrêter timer
    Mobile -> Mobile: Afficher résumé visite
    break Fin de la boucle
  end
end

== SYNCHRONISATION HORS LIGNE ==
alt Connexion perdue pendant visite
  Mobile -> SQLite: Accumuler les événements GPS
  loop Attente connexion
    Mobile -> Mobile: Vérifier réseau (NetInfo)
    note right: Backoff: 1s, 2s, 4s, 8s... max 60s
  end
  Mobile -> Mobile: Connexion rétablie
  Mobile -> SQLite: SELECT * WHERE estSynchronise = false
  SQLite --> Mobile: [event1, event2, ...]
  Mobile -> API: POST /gps/sync
  note right: { events: [...], appareilId }
  API -> DB: INSERT gps_events par batch
  API -> API: Exécuter algo détection pour chaque event
  API --> Mobile: { synced: [ids], prospects: [...], calibrations: [...] }
  Mobile -> SQLite: UPDATE estSynchronise = true
  Mobile -> Mobile: Mettre à jour cache prospects
  Mobile -> Mobile: Notification "Synchronisation terminée ✓"
end

== HISTORIQUE ==
DG -> Mobile: Consulter visites du jour
Mobile -> API: GET /visits?date=today
API --> Mobile: [{ prospect, heureArrivee, duree, ... }]
Mobile -> Mobile: Afficher historique avec détails

@enduml
```

---

## 4. Diagramme de Séquence — Génération de Rapport PDF

```plantuml
@startuml
skinparam sequence {
  ArrowColor #333
  LifeLineBackgroundColor #f0f8ff
  ParticipantBackgroundColor #f5f5dc
}

actor "Directeur\nCommercial" as DC
participant "Dashboard\nWeb" as Web
participant "Backend API\n(NestJS)" as API
participant "PDF Engine\n(PDFKit)" as PDF
database "PostgreSQL" as DB
participant "Cache\n(Redis)" as Cache

DC -> Web: Ouvrir page rapports
Web -> Web: Afficher formulaire période
DC -> Web: Sélectionner période\n+ filtres (délégué, prospect)
DC -> Web: Cliquer "Générer PDF"

Web -> API: POST /pdf/visits
note right: { dateDebut, dateFin, delegueId?, includeCharts: true }

API -> API: Vérifier permissions (rôle directeur)

alt Cache disponible
  API -> Cache: GET rapport:hash(params)
  Cache --> API: cached_report (hit)
else Cache miss
  API -> DB: Requête visites complexe
  note right: JOIN visits, users, prospects, gps_events
  DB --> API: Données brutes

  API -> API: Agréger les données
  API -> API: Calculer statistiques

  API -> PDF: Générer document
  PDF -> PDF: Nouveau document A4
  PDF -> PDF: Ajouter en-tête (logo, dates, titre)
  PDF -> PDF: Ajouter tableau visites
  PDF -> PDF: Ajouter graphiques (barres, camembert)
  PDF -> PDF: Ajouter pied de page (numéro page, date génération)
  PDF --> API: Buffer PDF

  API -> Cache: SET rapport:hash(params) (TTL: 1h)
end

API --> Web: PDF (Content-Type: application/pdf)
Web -> Web: Déclencher téléchargement
Web --> DC: Fichier "rapport-visites-2025-01.pdf"

@enduml
```

---

## 5. Diagramme de Déploiement

Le diagramme de déploiement montre la configuration physique des nœuds et des connexions réseau.

```plantuml
@startuml
skinparam component {
  BackgroundColor #f0f8ff
  BorderColor #4682b4
  FontName Arial
}
skinparam database {
  BackgroundColor #f5f5dc
  BorderColor #8b4513
  FontName Arial
}
skinparam node {
  BackgroundColor #e8e8e8
  BorderColor #333
  FontName Arial
}

node "Serveur Production\n(mega-supervision.com)" as ProdNode {
  node "Docker Host\n(2 vCPU, 4GB RAM, 20GB SSD)" as Docker {
    component "Nginx\nReverse Proxy" as Nginx
    component "NestJS API\nPort 3000" as API
    component "Next.js\nFrontend\nPort 3001" as Frontend
    database "PostgreSQL 16\n+PostGIS\nPort 5432" as PG
    database "Redis 7\nCache\nPort 6379" as Redis
  }
}

node "Serveur Staging\n(staging.mega-supervision.com)" as StagingNode {
  node "Docker Host\n(1 vCPU, 2GB RAM)" as StagingDocker {
    component "Nginx" as SNginx
    component "NestJS API" as SAPI
    database "PostgreSQL" as SPG
  }
}

node "Mobile Device\n(Délégué)" as MobileNode {
  component "React Native App\n(Android)" as RN
  database "SQLite\n(Offline)" as SQLite
  component "GPS Hardware" as GPSHW
}

node "Station de Travail\n(Directeur)" as Workstation {
  component "Browser\n(Chrome, Firefox, Safari)" as Browser
}

cloud "CDN\n(Static Assets)" as CDN {
  component "Images, Fonts\nJS Bundles" as Static
}

cloud "Let's Encrypt\n(SSL)" as SSL {
  component "Certbot" as Certbot
}

' === Connexions ===
Workstation --> Nginx : HTTPS (443)
MobileNode --> Nginx : HTTPS (443)
Workstation --> Frontend : HTTPS (443)

Nginx --> Frontend : / (HTTP 3001)
Nginx --> API : /api/* (HTTP 3000)

API --> PG : TypeORM (TCP 5432)
API --> Redis : ioredis (TCP 6379)

MobileNode --> SQLite : Lecture/Écriture SQL
MobileNode --> GPSHW : getCurrentPosition()

CDN --> Frontend : Static assets
SSL --> Nginx : Certificats TLS

note right of Nginx
  Rate Limiting: 100 req/min
  SSL Termination
  CORS Validation
end note

note right of API
  Modules: Auth, Users,
  Prospects, Calibration,
  GPS, Visits, Analytics,
  PDF, Audit
end note

note right of SQLite
  Stockage offline:
  - gps_events_queue
  - prospects_cache
  - calibrations_cache
end note

@enduml
```

### Spécifications des Nœuds

| Nœud | Rôle | Spécifications | Connectivité |
|:-----|:-----|:---------------|:-------------|
| **Serveur Production** | Hébergement principal | 2 vCPU, 4GB RAM, 20GB SSD, Docker | HTTPS (443), SSH (22) |
| **Serveur Staging** | Tests et validation | 1 vCPU, 2GB RAM, 10GB SSD, Docker | HTTPS (443), SSH (22) |
| **Mobile Android** | Application terrain | Android 10+, GPS, Internet | HTTPS, SQLite local |
| **Station Directeur** | Dashboard web | Navigateur moderne | HTTPS |

---

## 6. Diagramme d'Activitié — Processus de Détection de Visite

```plantuml
@startuml
start
:Recevoir événement GPS;
:Vérifier type événement;

if (type == 'position' ?) then (Oui)
  :Récupérer délégué;
  :Récupérer visite active;

  if (visite active existe ?) then (Oui)
    :Récupérer calibration prospect;
    :Calculer distance Haversine;

    if (distance > rayon_prospect ?) then (Oui)
      :Terminer visite;
      :Enregistrer heureDepart;
      :Calculer durée ( - pauses );
      :Marquer estComplete = true;
      :Créer GpsEvent 'visite_fin';
    else (Non)
      if (heure entre pauseStart et pauseEnd ?) then (Oui)
        if (visite pas déjà en pause ?) then (Oui)
          :Démarrer pause déjeuner;
          :Créer GpsEvent 'pause_debut';
        else (Non)
          :Continuer (déjà en pause);
        endif
      else (Non)
        if (visite en pause ?) then (Oui)
          :Reprendre visite;
          :Créer GpsEvent 'pause_fin';
        else (Non)
          :Mettre à jour durée visite;
          :Créer GpsEvent 'position';
        endif
      endif
    endif
  else (Non - pas de visite active)
    :Chercher calibrations à ≤ 4m;

    if (calibration trouvée ?) then (Oui)
      :Vérifier prospect non archivé;
      :Créer nouvelle visite;
      :Enregistrer heureArrivee;
      :Marquer estComplete = false;
      :Créer GpsEvent 'visite_debut';
      :Associer visite à prospect + délégué;
    else (Non)
      :Ignorer événement;
    endif
  endif
else (Non)
  :Ignorer événement non-position;
endif

stop
@enduml
```

---

## 7. Diagramme d'États — Cycle de Vie d'une Visite

```plantuml
@startuml
state "Aucune visite" as Idle
state "Visite en cours" as Active
state "Pause déjeuner" as Pause
state "Visite terminée" as Completed
state "Visite annulée" as Cancelled

[*] --> Idle : Délégué inactif

Idle --> Active : Distance ≤ 4m d'un prospect calibré
note right of Idle : Surveillance GPS continue (5s intervalle)

Active --> Active : Position dans rayon\nMise à jour durée
Active --> Pause : Heure entre 13h et 15h

Pause --> Active : Heure hors 13h-15h

Active --> Completed : Position hors rayon
note right of Completed : Calcul durée finale = départ - arrivée - pauses

Active --> Cancelled : Annulation manuelle\n(par directeur)

Pause --> Completed : Position hors rayon

Completed --> Idle : Délégué s'éloigne\n(attente nouvelle visite)

@enduml
```

---

## 8. Diagramme de Paquetages (Packages)

```plantuml
@startuml
skinparam package {
  BackgroundColor #f0f8ff
  BorderColor #4682b4
  FontName Arial
}

package "Frontend Web\n(Next.js)" as FE {
  [Pages / Routes]
  [Components UI]
  [Hooks / Utils]
  [API Client]
  [State Management]
}

package "Mobile\n(React Native)" as MO {
  [Screens]
  [Components]
  [GPS Service]
  [Offline Storage]
  [Sync Engine]
}

package "Backend API\n(NestJS)" as BE {
  package "Auth Module" as Auth
  package "Users Module" as Users
  package "Prospects Module" as Prosp
  package "Calibrations Module" as Cal
  package "GPS Module" as GPS
  package "Visits Module" as Visits
  package "Analytics Module" as Analytics
  package "PDF Module" as PDF
  package "Audit Module" as Audit

  package "Common" as Common {
    [Guards]
    [Interceptors]
    [Filters]
    [Decorators]
    [Pipes]
  }

  package "Database" as DB {
    [Entities]
    [Migrations]
    [Seeds]
  }
}

package "Externe" as Ext {
  [OpenStreetMap]
  [PDFKit]
  [Redis]
}

FE --> BE : HTTP/REST
MO --> BE : HTTP/REST
BE --> DB : TypeORM
BE --> Ext : Bibliothèques
MO --> MO : SQLite

@enduml
```

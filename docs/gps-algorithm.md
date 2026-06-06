# Algorithmes GPS - Logique de Détection des Visites

## Vue d'Ensemble

Le système de détection de visites repose sur un **algorithme de proximité géospatiale** utilisant la **formule de Haversine** pour calculer la distance entre la position GPS actuelle du délégué et les points de calibration des prospects. La détection est purement côté serveur — le mobile envoie sa position, le backend décide s'il y a début ou fin de visite.

---

## Formule de Haversine

La formule de Haversine calcule la distance orthodromique (grand cercle) entre deux points sur une sphère, en tenant compte de la courbure terrestre.

### Définition Mathématique

```
Soient deux points P1(lat1, lon1) et P2(lat2, lon2) :

Δlat = lat2 - lat1    (en radians)
Δlon = lon2 - lon1    (en radians)

a = sin²(Δlat / 2) + cos(lat1) × cos(lat2) × sin²(Δlon / 2)
c = 2 × atan2(√a, √(1 - a))
d = R × c

Où R = 6 371 000 mètres (rayon moyen de la Terre)
```

### Implémentation TypeScript

```typescript
const R = 6371000; // Rayon de la Terre en mètres

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}
```

### Précision

| Facteur | Impact |
|:--------|:-------|
| Précision GPS mobile | ±3-5m en extérieur, ±10-15m en intérieur |
| Rayon terrestre | Variation < 0.5% (rayon polaire vs équatorial) |
| Arrondis flottants | Négligeable (erreur < 1μm) |
| **Erreur totale estimée** | **±5m** (acceptable pour seuil de 4m + rayon 30-100m) |

---

## Logique de Déclenchement — Seuil 4 Mètres

Le déclenchement de visite utilise un **seil strict de 4 mètres** entre la position GPS du délégué et le point de calibration du prospect.

### Pseudo-code

```
POUR CHAQUE événement GPS entrant:
    SI evenement != 'position':
        IGNORER (ne pas traiter les événements de type visite/pause)

    delegue = trouverDélégué(event.delegueId)
    visiteActive = trouverVisiteActive(delegue.id)

    SI visiteActive:
        prospect = trouverProspect(visiteActive.prospectId)
        calibration = trouverCalibrationActive(prospect.id)
        distance = haversineDistance(
            event.latitude, event.longitude,
            calibration.latitude, calibration.longitude
        )
        rayon = trouverRayonProspectType(prospect.type)

        SI distance > rayon:
            terminerVisite(visiteActive, event)
        SINON SI entre 13:00 et 15:00 ET pas en pause:
            démarrerPause(visiteActive, event)

    SINON:
        calibrations = trouverCalibrationsProches(event.latitude, event.longitude, 4m)
        POUR CHAQUE calibration DANS calibrations:
            distance = haversineDistance(...)
            SI distance <= 4:
                prospect = trouverProspect(calibration.prospectId)
                SI prospect NON archive:
                    démarrerVisite(delegue, prospect, event)
                    SORTIR
```

### Implémentation TypeScript

```typescript
async function processGpsEvent(event: GpsEvent): Promise<ProcessResult> {
  // Ignorer les événements non-position (visite_debut/fin, pause, etc.)
  if (event.evenement !== 'position') {
    return { processed: false, reason: 'Not a position event' };
  }

  const activeVisit = await this.visitsService.findActiveByDelegue(event.delegueId);

  if (activeVisit) {
    return this.handlePositionWithActiveVisit(event, activeVisit);
  } else {
    return this.handlePositionWithoutVisit(event);
  }
}

private async handlePositionWithActiveVisit(
  event: GpsEvent,
  visit: Visite,
): Promise<ProcessResult> {
  const calibration = await this.calibrationsService.findActiveByProspect(
    visit.prospectId,
  );
  if (!calibration) {
    return { processed: false, reason: 'No active calibration' };
  }

  const prospect = await this.prospectsService.findById(visit.prospectId);
  const rayon = await this.prospectTypeConfigService.getRayon(prospect.type);

  const distance = haversineDistance(
    event.latitude,
    event.longitude,
    calibration.latitude,
    calibration.longitude,
  );

  // Vérifier si le délégué est sorti de la zone de présence
  if (distance > rayon) {
    return this.endVisit(visit, event);
  }

  // Vérifier pause déjeuner
  const currentTime = this.getCurrentTime();
  const config = await this.prospectTypeConfigService.findByType(prospect.type);

  if (this.isLunchBreak(currentTime, config.pauseStart, config.pauseEnd)) {
    if (!visit.estEnPause) {
      return this.startLunchBreak(visit, event);
    }
    return { processed: true, action: 'pause' };
  } else {
    if (visit.estEnPause) {
      return this.endLunchBreak(visit, event);
    }
  }

  return { processed: true, action: 'continue' };
}

private async handlePositionWithoutVisit(
  event: GpsEvent,
): Promise<ProcessResult> {
  // Trouver toutes les calibrations à moins de 4m de la position actuelle
  const nearbyCalibrations = await this.calibrationsService.findNearby(
    event.latitude,
    event.longitude,
    4, // 4 mètres
  );

  for (const cal of nearbyCalibrations) {
    const distance = haversineDistance(
      event.latitude,
      event.longitude,
      cal.latitude,
      cal.longitude,
    );

    if (distance <= 4) {
      const prospect = await this.prospectsService.findById(cal.prospectId);
      if (prospect && !prospect.estArchive) {
        return this.startVisit(event.delegueId, prospect, event);
      }
    }
  }

  return { processed: false, reason: 'No prospect nearby' };
}
```

---

## Logique de Présence — Rayon Configurable

Une fois la visite démarrée, le délégué doit rester dans un **rayon de présence** configurable par type de prospect (30m pour un cabinet médical, 100m pour un hôpital).

### Pseudo-code

```
TANT QUE visite_active = true:
    distance = haversineDistance(pos_actuelle, point_calibré)

    SI distance <= rayon_type_prospect:
        // Le délégué est toujours sur place
        SI PAS en pause déjeuner:
            durée = maintenant - heureArrivée - tempsPauseTotal
            Mettre à jour visit.dureeSecondes
        Enregistrer GpsEvent type 'position'
    SINON:
        // Le délégué a quitté la zone
        heureDepart = maintenant
        dureeFinale = heureDepart - heureArrivee - tempsPauseTotal
        visit.estComplete = true
        Enregistrer GpsEvent type 'visite_fin'
```

### Rayons par Type de Prospect

| Type | Rayon de Présence | Justification |
|:-----|:------------------|:--------------|
| Pharmacie | 50m | Zone urbaine, bâtiment unique |
| Hôpital | 100m | Grand établissement, parking |
| Clinique | 100m | Établissement moyen/grand |
| Cabinet | 30m | Cabinet individuel, zone dense |
| Laboratoire | 50m | Bâtiment standard |
| Autre | 50m | Valeur par défaut |

---

## Gestion de la Pause Déjeuner

La pause déjeuner est automatiquement détectée et **exclue du temps de visite comptabilisé**.

### Configuration

- **Début:** 13:00 (configurable par type de prospect)
- **Fin:** 15:00 (configurable par type de prospect)

### Logique

```
FONCTION estPauseDejeuner(heure, pauseStart="13:00", pauseEnd="15:00"):
    SI pauseStart == pauseEnd:
        RETURN faux  // Pas de pause configurée
    SI heure >= pauseStart ET heure < pauseEnd:
        RETURN vrai
    RETURN faux

QUAND visite_active ET estPauseDejeuner(maintenant):
    SI PAS déjà en pause:
        pauseDebut = maintenant
        Enregistrer GpsEvent type 'pause_debut'

QUAND visite_active ET NON estPauseDejeuner(maintenant):
    SI en pause:
        pauseFin = maintenant
        duréePause += pauseFin - pauseDebut
        Enregistrer GpsEvent type 'pause_fin'
        Reprendre compteur visite

Calcul durée finale:
    dureeVisite = (heureDepart - heureArrivee) - sommePauses
```

### Implémentation

```typescript
private isLunchBreak(
  currentTime: string,
  pauseStart: string,
  pauseEnd: string,
): boolean {
  if (pauseStart === pauseEnd) return false; // Pas de pause

  return currentTime >= pauseStart && currentTime < pauseEnd;
}

private calculateVisitDuration(
  heureArrivee: string,
  heureDepart: string,
  pauses: Array<{ debut: string; fin: string }>,
): number {
  const arrivee = new Date(heureArrivee).getTime();
  const depart = new Date(heureDepart).getTime();
  let totalDuration = (depart - arrivee) / 1000; // en secondes

  // Soustraire les pauses
  for (const pause of pauses) {
    const pauseDebut = new Date(pause.debut).getTime();
    const pauseFin = new Date(pause.fin).getTime();
    totalDuration -= (pauseFin - pauseDebut) / 1000;
  }

  return Math.max(0, totalDuration);
}
```

---

## Détection d'Anomalies

Le système surveille en continu les événements GPS pour détecter des anomalies.

### Types d'Anomalies

| Anomalie | Seuil | Action |
|:---------|:------|:-------|
| **Visite trop courte** | Durée < 120s (2 min) | Log + marquer comme suspecte |
| **Visite trop longue** | Durée > 10 800s (3h) | Log + alerte directeur |
| **Arrêt sans prospect** | Position fixe > 5min sans prospect dans rayon 50m | Log |
| **Vitesse excessive** | > 300 km/h | Ignorer l'événement GPS |
| **Saut de position** | > 1km en 1 seconde | Ignorer l'événement GPS |
| **GPS improbable** | Latitude hors [-90, 90], longitude hors [-180, 180] | Rejeter l'événement |

### Implémentation

```typescript
private detectAnomalies(event: GpsEvent, previousEvent?: GpsEvent): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Validation des coordonnées
  if (
    event.latitude < -90 || event.latitude > 90 ||
    event.longitude < -180 || event.longitude > 180
  ) {
    anomalies.push({ type: 'invalid_coordinates', severity: 'error' });
    return anomalies; // Rejet immédiat
  }

  if (!previousEvent) return anomalies;

  // Calcul du temps écoulé et de la distance
  const timeDiff = (new Date(event.horodatage).getTime() -
    new Date(previousEvent.horodatage).getTime()) / 1000;

  const distDiff = haversineDistance(
    previousEvent.latitude, previousEvent.longitude,
    event.latitude, event.longitude,
  );

  // Vitesse excessive
  if (timeDiff > 0) {
    const speed = (distDiff / timeDiff) * 3.6; // en km/h
    if (speed > 300) {
      anomalies.push({
        type: 'excessive_speed',
        severity: 'warning',
        details: { speed: Math.round(speed) },
      });
    }
  }

  // Saut de position
  if (timeDiff < 1 && distDiff > 1000) {
    anomalies.push({
      type: 'position_jump',
      severity: 'warning',
      details: { distance: Math.round(distDiff) },
    });
  }

  return anomalies;
}

private async detectSuspiciousVisit(
  visit: Visite,
  gpsEvents: GpsEvent[],
): Promise<void> {
  const duration = visit.dureeSecondes;

  if (duration < 120) {
    await this.auditService.log({
      action: 'ANOMALY',
      entite: 'visit',
      entiteId: visit.id,
      details: {
        type: 'visit_too_short',
        duree: duration,
        seuil: 120,
      },
    });
  }

  if (duration > 10800) {
    await this.auditService.log({
      action: 'ANOMALY',
      entite: 'visit',
      entiteId: visit.id,
      details: {
        type: 'visit_too_long',
        duree: duration,
        seuil: 10800,
      },
    });
  }
}
```

---

## Calibrage

Le calibrage est le processus qui **associe un prospect à ses coordonnées GPS réelles**. C'est une étape obligatoire pour que la détection automatique de visites fonctionne.

### Processus

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROCESSUS DE CALIBRAGE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Délégué se rend PHYSIQUEMENT chez le prospect                │
│     (sur place, devant l'entrée du prospect)                     │
│                                                                  │
│  2. Ouvre l'application mobile                                   │
│     → Sélectionne le prospect dans la liste                      │
│     → Vérifie les informations d'adresse                         │
│                                                                  │
│  3. Appuie sur "Calibrer"                                        │
│     → L'appareil capture la position GPS actuelle                │
│     → La position s'affiche pour confirmation                    │
│                                                                  │
│  4. Confirme la calibration                                      │
│     → Envoi au serveur : { prospectId, latitude, longitude }     │
│                                                                  │
│  5. Le serveur :                                                 │
│     → Crée un enregistrement Calibration (estActive = true)      │
│     → Désactive les anciennes calibrations du prospect           │
│     → Met à jour Prospect (latitude, longitude, estCalibre = true)│
│     → Log l'action dans audit_logs                               │
│                                                                  │
│  6. Le prospect est désormais "calibré"                          │
│     → Le système peut détecter automatiquement les visites       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Règles de Calibrage

- Un prospect ne peut avoir qu'**une seule calibration active** à la fois
- Un délégué ne peut calibrer que les prospects qu'il visite
- Le directeur peut **désactiver** une calibration (en cas d'erreur)
- Recalibrer est possible si le prospect a changé d'adresse (la nouvelle remplace l'ancienne)
- La calibration est **personnelle** au délégué (chaque délégué peut avoir sa propre calibration d'un même prospect)

---

## Mode Hors Ligne

Le mode hors ligne garantit **aucune perte de données** même en l'absence de connexion réseau.

### Architecture de Synchronisation

```
┌──────────────────────────────────────┐     ┌─────────────────────────┐
│         MOBILE (React Native)         │     │    SERVEUR (NestJS)      │
│                                        │     │                          │
│  ┌────────────────────┐               │     │                          │
│  │   SQLite Local DB   │               │     │                          │
│  │                    │               │     │                          │
│  │  gps_events_queue  │─── Sync ──────┼────→│  POST /gps/sync          │
│  │  ┌──────────────┐ │  Batch POST   │     │  ├─ Valider événements    │
│  │  │ event 1      │ │               │     │  ├─ Enregistrer en DB    │
│  │  │ event 2      │ │               │     │  ├─ Lancer algo visite   │
│  │  │ ...          │ │               │     │  └─ Retourner résultats  │
│  │  └──────────────┘ │               │     │                          │
│  │  estSync = false  │               │     │  GET /prospects/sync     │
│  └────────────────────┘               │     │  ├─ Prospects mis à jour │
│                                        │     │  └─ Nouvelles calibrations│
│  ┌────────────────────┐               │     └─────────────────────────┘
│  │   NetInfo          │               │
│  │   Détection réseau │               │
│  └────────────────────┘               │
└──────────────────────────────────────┘
```

### Algorithme de Synchronisation

```
1. APPAREIL hors ligne:
   a. Nouvel événement GPS → INSERT dans SQLite
      → estSynchronise = false
      → Stocker : latitude, longitude, precision, vitesse,
         altitude, evenement, horodatage, prospectId, appareilId

2. DÉTECTION connexion rétablie:
   a. NetInfo.change → réseau disponible
   b. Lire tous les événements avec estSynchronise = false
   c. Grouper par lots de 50 événements max
   d. Envoyer POST /gps/sync { events: [...], appareilId, dernierSync }

3. SERVEUR reçoit la synchro:
   a. Valider chaque événement (format, coordonnées, timestamp)
   b. Filtrer les doublons (par appareilId + horodatage)
   c. Enregistrer les nouveaux événements en base
   d. EXÉCUTER l'algorithme de détection de visite pour chaque événement
   e. Retourner { synced: [...ids], prospects: [...], calibrations: [...] }

4. APPAREIL reçoit la confirmation:
   a. Marquer les événements comme synchronisés
      → UPDATE gps_events SET estSynchronise = true
         WHERE id IN (synced)
   b. Mettre à jour la liste des prospects locale
   c. Mettre à jour les calibrations locales
   d. Enregistrer SyncLog: status = 'success'

5. SI ERREUR serveur:
   a. Réessayer avec backoff exponentiel: 1s, 2s, 4s, 8s, max 60s
   b. Après 5 échecs, marquer SyncLog: status = 'failed'
   c. Notifier l'utilisateur

6. CONFLIT (timestamp):
   a. Règle: le dernier timestamp gagne
   b. Si événement existe déjà (même horodatage + appareilId):
      → Conserver celui avec le timestamp le plus récent
      → Ignorer les doublons
```

### Gestion des Conflits

```typescript
async function resolveSyncBatch(
  events: GpsEvent[],
  appareilId: string,
): Promise<SyncResult> {
  const synced: string[] = [];
  let errors = 0;

  for (const event of events) {
    try {
      // Vérifier doublon par appareilId + horodatage
      const existing = await GpsEvent.findOne({
        where: {
          appareilId,
          horodatage: event.horodatage,
        },
      });

      if (existing) {
        // Conflit: garder le plus récent
        if (new Date(event.createdAt) > new Date(existing.createdAt)) {
          await GpsEvent.update(existing.id, {
            latitude: event.latitude,
            longitude: event.longitude,
            precision: event.precision,
            vitesse: event.vitesse,
            estSynchronise: true,
          });
          synced.push(existing.id);
        } else {
          synced.push(existing.id); // Déjà synced
        }
      } else {
        // Nouvel événement
        const created = await GpsEvent.create({
          ...event,
          appareilId,
          estSynchronise: true,
        });
        synced.push(created.id);
      }
    } catch (error) {
      errors++;
    }
  }

  return { synced, errors };
}
```

---

## Visualisation du Cycle de Vie d'une Visite

```
Position GPS
    │
    ▼
┌─────────────────────────────────────────────────────┐
│              ALGORITHME DE DÉTECTION                 │
│                                                      │
│   ┌──────────────┐    NON    ┌──────────────────┐   │
│   │ Distance ≤ 4m │─────────→│  Aucune action    │   │
│   │ d'un prospect │          │  (continue)       │   │
│   └──────┬───────┘          └──────────────────┘   │
│          │ OUI                                      │
│          ▼                                          │
│   ┌──────────────────┐                             │
│   │  DÉMARRER VISITE  │                             │
│   │  - Créer Visit    │                             │
│   │  - Sauver heure   │                             │
│   │    d'arrivée      │                             │
│   │  - GpsEvent debut │                             │
│   └──────┬───────────┘                             │
│          ▼                                          │
│   ┌──────────────────┐                             │
│   │  SUIVI CONTINU    │◄──── Boucle 5s              │
│   │  - Haversine      │                             │
│   │  - Dans rayon?    │                             │
│   │  - Pause?         │                             │
│   └──────┬───────────┘                             │
│          │                                          │
│          ├── Rayon dépassé ───► TERMINER VISITE     │
│          │                      - heureDepart       │
│          │                      - durée = diff -    │
│          │                        pauses            │
│          │                      - estComplete=true  │
│          │                                          │
│          └── 13h-15h ─────────► PAUSE DÉJEUNER      │
│                                 - GpsEvent pause    │
│                                 - Suspendre compteur│
└─────────────────────────────────────────────────────┘
```

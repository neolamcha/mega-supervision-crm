# Roadmap — Mega Supervision

## Vision

Mega Supervision a pour ambition de devenir la plateforme de référence pour la supervision des forces commerciales terrain en Afrique et dans les pays émergents. La feuille de route suit une progression MVP → Enterprise, avec des jalons clairs alignés sur les retours utilisateurs et les besoins métier.

---

## MVP — Version 1.0 (Terminé)

> **Objectif:** Remplacer le système papier/manuel par une solution numérique fonctionnelle couvrant le cycle complet de visite terrain.

### Fonctionnalités Livrées

#### Authentification & Sécurité
- [x] Authentification JWT (access token 24h + refresh token 7j)
- [x] Hachage bcrypt (10 rounds) des mots de passe
- [x] Rate limiting anti-brute force
- [x] Changement de mot de passe forcé à la première connexion
- [x] Headers de sécurité (Helmet)
- [x] Audit logging de toutes les mutations

#### Gestion des Utilisateurs
- [x] CRUD complet (directeur peut gérer les délégués)
- [x] Rôles: `directeur` et `delegue`
- [x] Activation/désactivation des comptes
- [x] Réinitialisation de mot de passe
- [x] Filtres de recherche (rôle, statut)

#### Gestion des Prospects
- [x] CRUD complet des prospects
- [x] Types de prospects configurables (pharmacie, hôpital, clinique, cabinet, laboratoire)
- [x] Rayons de présence configurables par type
- [x] Archivage (soft delete)

#### Calibrage GPS
- [x] Capture de position GPS mobile
- [x] Enregistrement des points de calibration
- [x] Validation: 1 calibration active par prospect
- [x] Marqueur `estCalibre` sur le prospect

#### Suivi Automatique des Visites
- [x] Détection par proximité GPS (seuil 4 mètres)
- [x] Formule de Haversine pour le calcul de distance
- [x] Début/fin de visite automatique
- [x] Comptage du temps de visite
- [x] Gestion de la pause déjeuner (13h-15h)
- [x] Rayons configurables par type de prospect

#### Dashboard Web (Directeur)
- [x] Vue d'ensemble: statistiques clés (visites, durée, taux complétion)
- [x] Graphiques d'évolution temporelle
- [x] Classement des délégués
- [x] Top prospects visités
- [x] Filtres par période

#### Application Mobile (Android)
- [x] Connexion sécurisée
- [x] Liste des prospects avec statut de calibration
- [x] Calibration GPS avec bouton dédié
- [x] Suivi automatique des visites en fond
- [x] Timer de visite avec pause déjeuner
- [x] Historique des visites
- [x] Profil et changement de mot de passe

#### Mode Hors Ligne
- [x] Stockage SQLite local des événements GPS
- [x] File d'attente de synchronisation
- [x] Sync automatique au retour de connexion
- [x] Détection réseau (NetInfo)
- [x] Résolution de conflits par timestamp

#### Rapports PDF
- [x] Génération de rapports de visites par période
- [x] Rapport individuel par délégué
- [x] Fiche prospect avec historique
- [x] Graphiques inclus dans le PDF
- [x] Téléchargement direct depuis le dashboard

#### Infrastructure
- [x] Conteneurisation Docker complète
- [x] Docker Compose (PostgreSQL + Redis + Backend + Frontend + Nginx)
- [x] Configuration Nginx avec SSL
- [x] Variables d'environnement externalisées
- [x] Scripts de déploiement automatisé
- [x] Scripts de backup

---

## Version 1.5 — Améliorations (En cours)

> **Objectif:** Améliorer l'expérience utilisateur et la productivité des directeurs commerciaux.

### Fonctionnalités Prévues

#### Notifications Push
- [ ] Intégration Firebase Cloud Messaging (FCM)
- [ ] Alerte au directeur quand un délégué commence/termine une visite
- [ ] Notification de synchronisation hors ligne terminée
- [ ] Alerte d'anomalie détectée (visite trop courte/longue)
- [ ] Rappel de calibration pour les prospects non calibrés

#### Export Excel
- [ ] Export des données de visites au format XLSX
- [ ] Export analytique (statistiques agrégées)
- [ ] Export de la liste des prospects
- [ ] Template personnalisé avec logo entreprise
- [ ] Export automatique programmé (cron)

#### Filtres Avancés — Analytics
- [ ] Filtres multi-critères combinés
- [ ] Comparaison période-à-période (MoM, YoY)
- [ ] Segmentation par région/ville
- [ ] Analyse des tendances (heures creuses, jours faibles)
- [ ] Export des graphiques en image

#### Mode Sombre Dashboard
- [ ] Thème sombre complet (Shadcn UI)
- [ ] Persistance du choix dans localStorage
- [ ] Détection automatique du thème système
- [ ] Contraste amélioré pour une lisibilité optimale

#### Gestion des Équipes
- [ ] Création de groupes de délégués
- [ ] Un délégué peut appartenir à plusieurs groupes
- [ ] Filtrage analytics par groupe
- [ ] Affectation de prospects à un groupe
- [ ] Rapports consolidés par équipe

---

## Version 2.0 — Avancée (Planning)

> **Objectif:** Fonctionnalités avancées de géofencing, intelligence artificielle et collaboration.

### Fonctionnalités Prévues

#### Géofencing Avancé
- [ ] Zones multiples par prospect (entrée, parking, bâtiment secondaire)
- [ ] Géofencing polygonale (zones personnalisées dessinées sur la carte)
- [ ] Détection d'entrée/sortie de zone géographique (ville, région)
- [ ] Historique des déplacements avec replay sur carte
- [ ] Cartes thermiques des zones visitées

#### Optimisation de Tournées (IA)
- [ ] Algorithme de routage (plus court chemin)
- [ ] Suggestions d'ordre de visite optimisé
- [ ] Prise en compte des contraintes horaires (pause, horaires d'ouverture)
- [ ] Calcul du temps de trajet estimé
- [ ] Réoptimisation dynamique en cours de journée

#### Chat Intégré
- [ ] Messagerie temps réel (WebSockets)
- [ ] Chat direct Directeur ↔ Délégué
- [ ] Chat de groupe par équipe
- [ ] Partage de fichiers (photos, documents)
- [ ] Messages vocaux
- [ ] Statut de lecture (vu/non vu)

#### Signature Électronique
- [ ] Capture de signature tactile sur mobile
- [ ] Horodatage qualifié de la signature
- [ ] Intégration au rapport PDF de visite
- [ ] Validation cryptographique de l'intégrité
- [ ] Conformité règlementaire (eIDAS, etc.)

#### Module Photos
- [ ] Prise de photo du prospect pendant la visite
- [ ] Géotagging automatique des photos
- [ ] Galerie photos par prospect
- [ ] Comparaison avant/après
- [ ] Compression et upload optimisé

#### API Temps Réel (WebSockets)
- [ ] Notification de début/fin de visite en direct
- [ ] Position des délégués sur carte temps réel
- [ ] Mise à jour des statistiques dashboard sans refresh
- [ ] Events push pour les modifications de données

---

## Version 2.5 — Intelligence & CRM (Vision)

> **Objectif:** Transformer la donnée de visite en insights prédictifs et construire un CRM complet.

### Fonctionnalités Prévues

#### Analyse Prédictive des Ventes
- [ ] Modèle ML de prédiction de ventes basé sur l'historique des visites
- [ ] Identification des prospects à fort potentiel
- [ ] Détection de baisse d'activité (churn prediction)
- [ ] Optimisation de la fréquence de visite recommandée
- [ ] Tableau de bord prédictif

#### Scoring Prospects Automatique
- [ ] Score composite basé sur: fréquence visites, durée, type, historique
- [ ] Segmentation A/B/C/D des prospects
- [ ] Recommandations automatiques d'actions
- [ ] Évolution du score dans le temps

#### CRM Complet
- [ ] Pipeline de ventes (deals)
- [ ] Opportunités commerciales liées aux prospects
- [ ] Historique complet des interactions
- [ ] Gestion des contacts multiples par prospect
- [ ] Workflows de relance automatique
- [ ] Intégration email (envoi depuis la plateforme)

#### Intégration Calendrier
- [ ] Synchronisation Google Calendar
- [ ] Synchronisation Outlook Calendar
- [ ] Planification automatique des visites
- [ ] Envoi d'invitations calendrier aux prospects
- [ ] Blocage des créneaux de pause/déplacement

#### Application iOS
- [ ] Application native iOS (Swift/SwiftUI)
- [ ] Mêmes fonctionnalités que la version Android
- [ ] Widgets iOS pour les statistiques rapides
- [ ] Apple Watch (rappel de visite, timer)
- [ ] iCloud sync (préférences)

---

## Version Enterprise (Stratégique)

> **Objectif:** Plateforme multi-entreprise, sécurisée, scalable et extensible pour les grands comptes.

### Fonctionnalités Prévues

#### Multi-Tenant (Isolation)
- [ ] Isolation complète des données par entreprise
- [ ] Schéma PostgreSQL par tenant
- [ ] Gestion des administrateurs tenant
- [ ] Branding personnalisé par tenant (logo, couleurs, domaine)
- [ ] Facturation par tenant (nombre d'utilisateurs actifs)
- [ ] Métriques d'utilisation consommées

#### SSO (SAML/OIDC)
- [ ] Authentification via SAML 2.0
- [ ] Connexion via OIDC (Okta, Azure AD, Google Workspace)
- [ ] Provisioning SCIM (création automatique des comptes)
- [ ] Mappage des rôles depuis le SSO
- [ ] Désactivation automatique des comptes (déprovisionning)

#### API Publique REST
- [ ] API REST publique versionnée (v1, v2)
- [ ] Documentation OpenAPI/Swagger complète
- [ ] Clés API avec scopes et permissions
- [ ] Rate limiting par clé API
- [ ] SDK client (TypeScript, Python, PHP)
- [ ] Exemple d'intégrations

#### Webhooks
- [ ] Système de webhooks sortants (events → callback URL)
- [ ] Événements : visite débutée, terminée, calibration, sync
- [ ] Payload signé (HMAC) pour vérification
- [ ] File d'attente de livraison avec retry
- [ ] Logs de livraison des webhooks
- [ ] Dashboard de monitoring des webhooks

#### Audit Avancé
- [ ] Rétention configurable par type de log
- [ ] Analyse des logs (patterns, anomalies)
- [ ] Export des logs vers SIEM (Splunk, Datadog)
- [ ] Tableau de bord de conformité
- [ ] Rapports d'audit PDF signés
- [ ] Piste d'audit immuable (append-only)

#### SLA & Monitoring
- [ ] Dashboard SLA (uptime, temps de réponse)
- [ ] Alertes PagerDuty/Opsgenie
- [ ] Métriques custom (visites/heure, latence GPS)
- [ ] Rapports mensuels de performance
- [ ] Engagement SLA 99.9% uptime
- [ ] Compensation automatique en cas de non-respect SLA

#### Déploiement On-Premise
- [ ] Image Docker complète prête à l'emploi
- [ ] Scripts d'installation automatisée (Ansible)
- [ ] Documentation d'installation complète
- [ ] Support des proxys d'entreprise
- [ ] Mode air-gapped (pas de connexion internet requise)
- [ ] Mise à jour automatique via registry privé
- [ ] Licences offline

#### Marketplace de Plugins
- [ ] Architecture extensible (plugins)
- [ ] SDK de développement de plugins
- [ ] Marketplace publique et privée
- [ ] Plugins prédéfinis: CRM Salesforce, ERP SAP, BI PowerBI
- [ ] Système de versions et compatibilité
- [ ] Revue de code et validation des plugins

---

## Calendrier Indicatif

| Version | Échéance | Statut |
|:--------|:---------|:-------|
| **MVP v1.0** | T1 2025 | ✅ Livré |
| **v1.5** | T3 2025 | 🔄 En cours |
| **v2.0** | T1 2026 | 📋 Planification |
| **v2.5** | T3 2026 | 🔭 Vision |
| **Enterprise** | T1 2027 | 🚀 Stratégique |

---

## Métriques de Succès

| KPI | MVP | v1.5 | v2.0 | Enterprise |
|:----|:---|:-----|:-----|:-----------|
| Temps moyen de saisie visite | 30s → 0s (auto) | 0s | 0s | 0s |
| Visites par délégué/jour | 5 → 10 | 12 | 15 | 20 |
| Taux d'adoption mobile | 80% | 90% | 95% | 98% |
| Temps d'arrêt système | 0 | < 1h/mois | < 30min/mois | < 5min/mois |
| Satisfaction utilisateur | NPS 40 | NPS 50 | NPS 60 | NPS 70 |
| Prospects calibrés | 60% | 80% | 95% | 99% |
| Données hors ligne | 100% | 100% | 100% | 100% |

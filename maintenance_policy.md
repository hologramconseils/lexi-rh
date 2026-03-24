# Politique de Maintenance et Stabilisation - Lexi-RH

Ce document définit les règles de gestion du code suite à la phase de stabilisation du 24 mars 2026.

## Principes Fondamentaux
1. **Modification Minimale** : Toute intervention future doit se limiter au périmètre strict de la demande d'évolution.
2. **Gel du Code Fonctionnel** : Aucune refactorisation, réécriture ou déplacement de code existant et fonctionnel n'est autorisé.
3. **Sécurité et Stabilité** : Les modifications ne doivent en aucun cas déstabiliser les fonctionnalités auditées et validées.
4. **Préservation de l'Architecture** : L'organisation actuelle des dossiers et la logique de communication API/Base de données doivent être conservées.

## Historique de Stabilisation (24 Mars 2026)
- **Backend** : Migration réussie vers PostgreSQL (Render Frankfurt).
- **Moteur de Recherche** : Passage à une recherche pondérée (Titre > Contenu) avec fallback SQLite local.
- **Réindexation** : Script de synchronisation `reindex_all.py` opérationnel et protégé.
- **Audit de Qualité** : Verdict **GO** ✅ après tests complets UI/UX et Accessibilité.

## État de la Branche
Le code est considéré comme "Production Ready". Toute future branche de développement doit être testée rigoureusement avant fusion pour garantir l'absence de régression sur le moteur de recherche.

# Walkthrough - Isolation des Ressources par Espace Employeur

L'isolation des ressources documentaires par espace employeur est désormais opérationnelle. Chaque compte employeur dispose d'un environnement hermétique pour ses documents (conventions, accords, règlements), et l'IA (moteur de recherche) est configurée pour n'utiliser que les ressources du compte actif.

## Changements Majeurs

### 1. Modèle de Données et Schéma
- **Nouveau Modèle `Workspace`** : Création d'une table `workspaces` pour gérer les espaces dédiés.
- **Lien Utilisateur & Document** : Ajout d'une colonne `workspace_id` aux tables `users` et `documents`.
- **Migration** : Un script de migration a initialisé les espaces pour les utilisateurs existants et rattaché les documents actuels à un espace par défaut.

### 2. Automatisation à l'Inscription
Lorsqu'un utilisateur s'inscrit avec le rôle **Employeur**, un espace de travail est automatiquement créé et lui est assigné.

### 3. Isolation Strict au Niveau API
Les routes suivantes ont été mises à jour pour filtrer systématiquement par `workspace_id` :
- `GET /api/documents/` : Liste uniquement les documents du workspace.
- `POST /api/documents/` : Assigne automatiquement le document au workspace de l'utilisateur.
- `GET /api/documents/search` : Recherche **exclusivement** dans les documents du workspace.
- `GET /api/documents/suggest` : Suggestions limitées au contenu du workspace.
- `DELETE /api/documents/<id>` : Protection contre la suppression de documents hors workspace.

## Vérification Effectuée

Un test de validation complet a été exécuté avec succès :
1. Création de deux employeurs distincts (A et B).
2. Dépôt de documents différents pour chaque employeur.
3. Vérification que l'employeur A **ne peut pas voir ni rechercher** les documents de l'employeur B, et vice-versa.
4. Validation du fonctionnement nominal de l'IA (moteur de recherche) dans ce contexte isolé.

> [!TIP]
> Pour tester en production, créez un nouveau compte avec le rôle `employer`. Vous verrez que votre espace est totalement vide au départ, et les documents que vous y déposerez resteront invisibles pour les autres comptes.

## Prochaines Étapes
- Déploiement automatique vers le repository principal (Git push).
- Vérification du bon fonctionnement sur l'environnement de production (Render/Vercel).

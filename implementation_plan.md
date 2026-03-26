# Plan de Vérification et Finalisation - Lexi-RH

Ce plan vise à confirmer que les points soulevés lors de l'audit précédent ont été correctement intégrés et que l'application est prête pour la production.

## Changements Proposés

Aucun changement majeur de code n'est prévu a priori, car les corrections semblent déjà en place. L'objectif est la **vérification et le polish final**.

### [Component] Frontend
- **Navbar.tsx** : Vérifier que le menu hamburger fonctionne à 375px.
- **Dashboard.tsx** : Confirmer que le nettoyage des espaces (`AUD-002`) est effectif sur des résultats réels.
- **Branding** : S'assurer que le badge affiche systématiquement "Espace Salarié" sur le dashboard public.

### [Component] Backend
- **Reindex** : Vérifier si une réindexation est nécessaire pour valider les changements de formatage.

## Plan de Vérification

### Tests Automatisés
- Aucun test automatisé spécifique n'est requis pour cette phase de vérification UI, mais nous vérifierons que le backend répond correctement.

### Vérification Manuelle
1. **Lancement Local** :
   - Démarrer le backend : `cd backend && source venv/bin/activate && python run.py`
   - Démarrer le frontend : `cd frontend && npm run dev`
2. **Audit Navigateur** :
   - Ouvrir l'application dans le navigateur.
   - Utiliser l'outil de développement pour simuler un iPhone SE (375px) et vérifier la Navbar.
   - Effectuer une recherche ("préavis") et vérifier la propreté du texte.
3. **Vérification .env** :
   - Vérifier que les variables minimales sont présentes pour un fonctionnement local.

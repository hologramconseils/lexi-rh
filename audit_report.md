# Lexi-RH - Audit UI/UX & Qualité

**Couche A — Rapport lisible**

## 1. Résumé exécutif
* **Produit :** Lexi-RH (Assistant Juridique d'Entreprise)
* **Mode :** `audit_only`
* **Périmètre :** Dashboard Salarié (Accueil), Interface Recherche, Console Administrateur, Profil, et Authentification. Testé sur Breakpoints Desktop et Mobile.
* **Hypothèses :** L'application est destinée à être un outil hybride (Salariés en consultation publique, Administrateurs en gestion authentifiée). 
* **Verdict : CONDITIONAL_GO**

## 2. Scorecard
* `clarte_visuelle` : 9/10
* `fluidite_ux` : 8/10
* `fiabilite_fonctionnelle` : 8/10
* `confiance_et_feedback` : 9/10
* `accessibilite` : 7/10
* `qualite_responsive` : 5/10
* `preparation_production` : 8/10
* **Note globale :** 7.7/10

## 3. Points forts
* **Thématisation (Dark Mode) :** Excellente exécution du Dark Mode via Tailwind v4. Le `ThemeToggle` est réactif, élégant, et la palette s'adapte sans faille aux préférences système.
* **Fluidité d'interaction :** La navigation Desktop et l'interface de gestion documentaire sont propres et très professionnelles.
* **Extraction Texte :** Bonne intégration du formatage de réponses (sauts de lignes via PyMuPDF). L'interface de recherche est épurée.

## 4. Problèmes critiques (P0 & P1)
* **[P1] Responsive Mobile (Navbar) :** Sur les petits écrans (ex: 375px), la barre de navigation supérieure est surchargée. Le sélecteur de thème, le badge de rôle, et les liens "Mon Profil"/"Déconnexion" s'empilent et se chevauchent de manière non-utilisable. Il manque un menu "Hamburger".

## 5. Détail des constats

| ID | Sévérité | Catégorie | Problème observé | Attendu | Cause probable | Corection recommandée | Propriétaire |
|---|---|---|---|---|---|---|---|
| AUD-001 | P1 | qualite_responsive | (Header) Chevauchement des éléments de navigation sur mobile. | Affichage propre ou regroupement derrière un menu burger. | Surcharge d'éléments flex horizontaux sans contraintes de wrap/hide. | Masquer les liens secondaires dans un menu déroulant sur mobile. | Frontend |
| AUD-002 | P2 | clarte_visuelle | (Recherche) Des espaces consécutifs anormaux ("Il  est  au  minimum") sont visibles dans les résultats. | Espacement unique standard entre les mots. | Résidus d'extraction sémantique du document source. | Appliquer un filtre `.replace(/\s+/g, ' ')` sur le résultat affiché côté Front. | Frontend |
| AUD-003 | P3 | feedback_et_confiance | (Dashboard) Le badge "Espace Salarié" se transforme en "Espace Employeur" même sur l'interface publique si un admin est connecté. | Le label de l'espace doit indiquer où l'on se trouve, et non le rôle actif. | Conditionnement dynamique basé sur `user.role` au lieu de la `route`. | Rendre le badge Dashboard statique: "Espace Salarié". | Frontend |

## 6. Plan de correction
* **Corriger maintenant :** AUD-001 (Responsive Header) - Rendre l'interface utilisable sur mobile.
* **Ensuite :** AUD-002 (Nettoyage de texte) et AUD-003 (Cohérence de badge).

## 7. Recommandation release
L'application est très mature sur la partie Desktop et logique métier. Le **CONDITIONAL_GO** implique qu'une passe de correctifs Tailwind responsives sur la `nav` (AUD-001) est nécessaire avant un déploiement massif auprès d'une audience potentiellement sur mobile.

---

**Couche B — JSON structuré**

```json
{
 "target": "Lexi-RH",
 "mode": "audit_only",
 "scope": {
   "routes_tested": ["/dashboard", "/login", "/admin", "/profile"],
   "journeys_tested": ["Recherche anonyme", "Connexion admin", "Consultation dashboard admin", "Déconnexion"],
   "breakpoints_tested": ["Desktop (1280px)", "Mobile (375px)"],
   "assumptions": ["Navigation mixte publique/authentifiée"]
 },
 "scores": {
   "clarte_visuelle": 9,
   "fluidite_ux": 8,
   "fiabilite_fonctionnelle": 8,
   "confiance_et_feedback": 9,
   "accessibilite": 7,
   "qualite_responsive": 5,
   "preparation_production": 8
 },
 "verdict": "CONDITIONAL_GO",
 "wins": ["Excellente implémentation Dark Mode", "UI Desktop épurée et premium"],
 "issues": [
   {
     "id": "AUD-001",
     "severity": "P1",
     "category": "qualite_responsive",
     "location": "Global Header (Dashboard, Profile)",
     "repro_steps": ["Ouvrir l'application", "Réduire la taille de la fenêtre à 375px de largeur"],
     "observed": "Les éléments de navigation (Logo, Badge, ThemeToggle, Mon Profil) se chevauchent ou cassent la mise en page.",
     "expected": "Les liens devraient basculer dans un menu caché (Hamburger) ou se masquer proprement.",
     "impact": "Rend la navigation frustrante et clique-brouillon sur mobile.",
     "suspected_cause": "Utilisation de Flex-box sans `hidden sm:flex` formel complété par un menu burger.",
     "recommended_fix": "Refactoriser la `nav` avec une gestion réactive propre, un bouton Hamburger pour mobile, et masquer les textes des boutons (garder juste l'icône).",
     "owner": "frontend"
   },
   {
     "id": "AUD-002",
     "severity": "P2",
     "category": "clarte_visuelle",
     "location": "Dashboard (Résultats de recherche)",
     "repro_steps": ["Effectuer une recherche qui lève un article long"],
     "observed": "Présence de doubles voire triples espaces entre les mots dans la réponse.",
     "expected": "Texte propre avec un espacement simple.",
     "impact": "Diminue le professionnalisme de la présentation de l'IA.",
     "suspected_cause": "Extraction PDF PyMuPDF conservant des blancs structurels du PDF d'origine.",
     "recommended_fix": "Appliquer un nettoyage simple côté React (`text.replace(/\\s+/g, ' ')`) après la préservation des `\\n`.",
     "owner": "frontend"
   },
   {
     "id": "AUD-003",
     "severity": "P3",
     "category": "confiance_et_feedback",
     "location": "Dashboard",
     "repro_steps": ["Se connecter en tant qu'admin", "Aller sur /dashboard"],
     "observed": "Le badge affiche 'Espace Employeur / RH'.",
     "expected": "Il devrait toujours afficher 'Espace Salarié / Consultation' car c'est la page publique.",
     "impact": "Légère confusion sur la distinction entre l'interface publique et privée.",
     "suspected_cause": "Rendu conditionnel lié à `user.role` au lieu d'être statique à la vue.",
     "recommended_fix": "Figer la valeur textuelle du badge sur le composant Dashboard.",
     "owner": "frontend"
   }
 ],
 "summary": {
   "p0_count": 0,
   "p1_count": 1,
   "p2_count": 1,
   "p3_count": 1,
   "release_blockers": ["Fixer la navigation responsive (AUD-001)"]
 }
}
```

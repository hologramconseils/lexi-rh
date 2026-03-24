# Guide de Test Simplifié - Lexi-RH

Ce document vous explique comment tester la plateforme Lexi-RH étape par étape.
*(Note : Ce document au format Markdown peut être facilement converti en PDF depuis votre éditeur de texte ou navigateur).*

---

## 🏗️ Pré-requis : Démarrer l'application (Pour le développeur/testeur initial)
1. Lancer la base de données et le moteur de recherche : `docker-compose up -d`
2. Lancer le backend : `cd backend && source venv/bin/activate && python run.py` (assurez-vous d'avoir exécuté `flask shell` pour créer un admin initial si besoin).
3. Lancer le frontend : `cd frontend && npm run dev`

---

## Scénario 1 : Se connecter en tant qu'Administrateur et ajouter un document

**Objectif :** Vérifier que le module d'administration fonctionne et permet d'ingérer des sources juridiques.

1. **Action :** Ouvrez Lexi-RH dans votre navigateur.
2. **Action :** Entrez l'email de l'administrateur (ex: *admin@lexi-rh.com*) et le mot de passe.
3. **Action :** Cliquez sur "Se connecter".
   - *Résultat attendu :* Vous êtes redirigé vers le "Lexi-RH Admin" (Tableau de bord administration).
4. **Action :** Dans le formulaire "Ajouter une source juridique", saisissez le titre "Règlement Intérieur 2026", choisissez le type "Règlement Intérieur", et envoyez un fichier PDF ou TXT (ex: un faux document contenant des règles de sécurité).
5. **Action :** Cliquez sur "Mettre à jour".
   - *Résultat attendu :* Le bouton affiche "Upload...", puis le document apparaît en bas dans la liste "Sources Juridiques Actives" avec la date du jour.

---

## Scénario 2 : Salarié posant une question (Moteur de recherche)

**Objectif :** Vérifier que les salariés peuvent trouver des réponses dans les documents administrés.

1. **Action :** Déconnectez-vous du compte administrateur (bouton "Déconnexion" en haut à droite).
2. **Action :** Connectez-vous avec un compte Salarié (ex: *salarie@lexi-rh.com*).
   - *Résultat attendu :* Vous arrivez sur la page "Posez votre question" (Espace Salarié).
3. **Action :** Dans la barre de recherche, tapez une question en lien avec le document que vous avez uploadé au Scénario 1 (ex: *"Quelles sont les obligations de l'employeur en matière de sécurité ?"*).
4. **Action :** Appuyez sur "Entrée" ou cliquez sur "Rechercher".
   - *Résultat attendu :* La page affiche une ou plusieurs fiches de résultats. Chaque fiche indique le titre du document source (ex: "Règlement Intérieur 2026") et affiche l'extrait du texte contenant la réponse avec les mots-clés en surbrillance.

---

## Scénario 3 : Employeur/RH posant une question

**Objectif :** S'assurer de la stabilité pour l'autre rôle utilisateur.

1. **Action :** Déconnectez-vous et connectez-vous avec un compte Employeur.
   - *Résultat attendu :* Vous êtes redirigé vers le même de tableau de bord de recherche, badgé "Espace Employeur / RH".
2. **Action :** Tapez "Quel est le préavis de démission ?".
   - *Résultat attendu :* Le système interroge les sources juridiques et retourne le passage exact si un texte lié au préavis a été précédemment importé par l'admin.

---

## Scénario 4 : Vérification du Profil

**Objectif :** Permettre à l'utilisateur de gérer ses informations.

1. **Action :** Depuis n'importe quel tableau de bord, si la navigation le permet (ou en allant manuellement sur `/profile`), accédez à "Mon Profil".
2. **Action :** Modifiez votre adresse e-mail.
3. **Action :** Cliquez sur "Enregistrer".
   - *Résultat attendu :* Un message vert "Profil mis à jour avec succès" s'affiche.

---

## 📋 Checklist de validation (Pass/Fail)
- [ ] L'écran de connexion s'affiche correctement et permet de s'authentifier.
- [ ] Un salarié peut se connecter et accéder à son tableau de bord.
- [ ] Un employeur/RH peut se connecter et accéder à son tableau de bord.
- [ ] En tant qu'administrateur, je peux téléverser un nouveau "Règlement Intérieur".
- [ ] La question "Quel est le préavis de démission ?" affiche une réponse pertinente (si le document correspondant existe).
- [ ] Les réponses affichées citent clairement les sources juridiques utilisées.
- [ ] L'interface utilisateur est facile à lire et à naviguer sur un ordinateur.
- [ ] Je peux me déconnecter de l'application sans erreur.

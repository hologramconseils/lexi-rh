# Guide de Déploiement Lexi-RH Backend sur Render

## Étape 1 — Déployer le Backend sur Render (5 min)

1. Allez sur **[https://dashboard.render.com](https://dashboard.render.com)**
2. Connectez-vous (ou créez un compte gratuit)
3. Cliquez sur le bouton **"New +"** en haut à droite
4. Sélectionnez **"Blueprint"**
5. Connectez votre dépôt GitHub **`hologramconseils/lexi-rh`** 
   - Si Render ne voit pas votre repo, cliquez sur **"Configure account"** pour lui donner accès
6. Render détectera automatiquement le fichier `render.yaml` et proposera de créer :
   - ✅ Un service web `lexi-rh-backend`
   - ✅ Une base de données Postgres `lexi-rh-db`
7. Cliquez **"Apply"** et attendez que le déploiement se termine (~3-5 min)

> **Important** : Une fois le déploiement terminé, notez l'URL du service web.
> Elle ressemblera à : `https://lexi-rh-backend.onrender.com`

## Étape 2 — Vérifier le Backend

Ouvrez votre navigateur et accédez à :
```
https://[votre-url-render]/api/health
```
Vous devriez voir : `{"status": "healthy"}`

## Étape 3 — Configurer Vercel (2 min)

1. Allez sur **[https://vercel.com/dashboard](https://vercel.com/dashboard)**
2. Cliquez sur votre projet **Lexi-RH** (celui qui héberge `rh.hologramconseils.com`)
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez une nouvelle variable :
   - **Name** : `VITE_API_URL`
   - **Value** : `https://[votre-url-render]/api`  (remplacez par l'URL réelle de l'étape 1)
   - **Environment** : ✅ Production, ✅ Preview
5. Cliquez **"Save"**

## Étape 4 — Redéployer le Frontend

1. Restez dans Vercel, allez dans l'onglet **Deployments**
2. Sur le dernier déploiement, cliquez les **"..."** → **"Redeploy"**
3. Attendez ~1 min que le déploiement se termine

## Étape 5 — Tester 🎉

Rendez-vous sur **https://rh.hologramconseils.com/login** et testez :
- ✅ **Connexion** avec `btsaulnerond@icloud.com`
- ✅ **Inscription** d'un nouveau compte
- ✅ **Changement de mot de passe**

> ⚠️ **Note** : La recherche de documents juridiques ne fonctionnera pas encore car Elasticsearch n'est pas inclus dans le plan Render gratuit. Les fonctions d'authentification et de gestion des comptes fonctionneront normalement.

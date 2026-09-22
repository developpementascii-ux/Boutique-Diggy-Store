# 🛍️ Boutique Pro - POS, CRM & Atelier de Réparation

Application web moderne et complète de **Point de Vente (POS)**, **Gestion de Stock Multi-Catégories**, **Atelier de Réparations Mobiles**, **Suivi des Crédits Clients** et **Comptabilité Journalière**.

---

## ✨ Fonctionnalités Principales

- 🛒 **Point de Vente (POS / Caisse) :** Encaissement rapide, remises commerciales, acomptes, crédits et impression de tickets.
- 📦 **Gestion de Stock & Alertes :** Produits multi-catégories (Pièces mobiles, Accessoires, Vape, Parfums), suivi des ruptures et importation automatique des alertes en commandes d'achat.
- 🔧 **Atelier de Réparation (SAV) :** Suivi des fiches de réparation par statut (Reçu, En cours, Prêt, Livré), gestion des acomptes et pièces détachées.
- 👥 **Gestion Client & Crédits (CRM) :** Fiches clients 360°, suivi des dettes, règlements partiels et programme de fidélité.
- 📊 **Tableau de Bord & Finances :** Calcul du chiffre d'affaires, marges réelles, journal de caisse, dépenses et clôtures de caisse.
- 🛡️ **Gestion des Rôles & Sécurité :** Espace Administrateur et Vendeur avec masquage automatique des marges/coûts pour les vendeurs.
- ⚡ **Synchronisation Multi-Fenêtres & Cloud :** Synchronisation en temps réel entre plusieurs onglets/écrans (`BroadcastChannel`) et persistance cloud optionnelle avec **PostgreSQL Supabase**.

---

## 🚀 Démarrage Rapide

### 1. Cloner le projet
```bash
git clone <VOTRE_LIEN_GITHUB>
cd Boutique
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Lancer en local
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:5173`.

---

## 🗄️ Configuration Supabase (Optionnelle)

1. Créez un projet gratuit sur [supabase.com](https://supabase.com).
2. Dans le **SQL Editor** de Supabase, collez et exécutez le script [supabase_schema.sql](supabase_schema.sql).
3. Créez un fichier `.env` à la racine :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-api-anon
```

---

## 🛠️ Technologies Utilisées

- **React 19** + **Vite**
- **Lucide React** (Iconographie moderne)
- **Sonner** (Notifications toast élégantes)
- **Supabase JS** (PostgreSQL & Realtime)

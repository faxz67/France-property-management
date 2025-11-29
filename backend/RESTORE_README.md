# Système de Restauration des Données Supprimées

Ce système permet de restaurer les données supprimées accidentellement grâce au **soft delete** et à la vérification des binlogs MariaDB.

## 🎯 Fonctionnalités

1. **Soft Delete** : Les suppressions ne sont plus définitives, les enregistrements sont marqués comme supprimés
2. **Restauration via API** : Endpoints pour restaurer les données supprimées
3. **Vérification des binlogs** : Script pour récupérer les données supprimées avant l'activation du soft delete

## 📋 Installation

### 1. Exécuter la migration pour ajouter les colonnes `deleted_at`

```bash
cd project/backend
node migrations/add-soft-delete-columns.js
```

Cette migration ajoute la colonne `deleted_at` aux tables suivantes :
- `tenants`
- `properties`
- `bills`
- `expenses`
- `property_photos`
- `tenant_documents`

### 2. Redémarrer le serveur

Le serveur doit être redémarré pour que les changements prennent effet.

## 🔧 Utilisation

### Voir les enregistrements supprimés

```bash
# Pour les locataires
GET /api/restore/tenant/deleted
Authorization: Bearer <token>

# Pour les propriétés
GET /api/restore/property/deleted
Authorization: Bearer <token>

# Pour les factures
GET /api/restore/bill/deleted
Authorization: Bearer <token>

# Pour les dépenses
GET /api/restore/expense/deleted
Authorization: Bearer <token>
```

### Restaurer un enregistrement

```bash
# Restaurer un locataire
POST /api/restore/tenant/:id/restore
Authorization: Bearer <token>

# Restaurer une propriété
POST /api/restore/property/:id/restore
Authorization: Bearer <token>

# Restaurer une facture
POST /api/restore/bill/:id/restore
Authorization: Bearer <token>

# Restaurer une dépense
POST /api/restore/expense/:id/restore
Authorization: Bearer <token>
```

### Restaurer plusieurs enregistrements

```bash
POST /api/restore/tenant/restore-multiple
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [1, 2, 3]
}
```

### Suppression définitive (⚠️ Attention : irréversible)

```bash
DELETE /api/restore/tenant/:id/permanent
Authorization: Bearer <token>
```

## 🔍 Récupération depuis les binlogs MariaDB

Si des données ont été supprimées **avant** l'activation du soft delete, vous pouvez essayer de les récupérer depuis les binlogs MariaDB.

### Prérequis

1. Les binlogs MariaDB doivent être activés
2. L'utilitaire `mysqlbinlog` doit être installé
3. Accès aux fichiers binlogs (généralement dans `/var/lib/mysql/`)

### Utilisation du script

```bash
cd project/backend
node scripts/check-binlogs.js tenants [output-file.sql]
```

Exemples :
```bash
# Chercher les suppressions dans la table tenants
node scripts/check-binlogs.js tenants

# Chercher les suppressions dans la table properties et sauvegarder dans un fichier
node scripts/check-binlogs.js properties recovery.sql

# Chercher les suppressions dans la table bills
node scripts/check-binlogs.js bills
```

### Récupération manuelle depuis les binlogs

1. **Lister les binlogs disponibles** :
```bash
mysql -u root -p -e "SHOW BINARY LOGS;"
```

2. **Extraire les DELETE statements** :
```bash
mysqlbinlog --database=property_management /var/lib/mysql/mariadb-bin.000001 | grep -i "DELETE FROM tenants"
```

3. **Extraire les INSERT statements avant les DELETE** :
```bash
mysqlbinlog --start-datetime="2024-01-01 00:00:00" /var/lib/mysql/mariadb-bin.000001 | grep -A 50 "INSERT INTO \`tenants\`"
```

4. **Créer un script de restauration** :
   - Copiez les INSERT statements trouvés
   - Vérifiez qu'ils correspondent aux enregistrements supprimés
   - Exécutez-les dans MariaDB

## ⚠️ Notes importantes

1. **Soft Delete activé** : Toutes les nouvelles suppressions utilisent maintenant le soft delete
2. **Données anciennes** : Les données supprimées avant l'activation du soft delete ne peuvent être récupérées que via les binlogs
3. **Performance** : Les requêtes excluent automatiquement les enregistrements supprimés (grâce à `paranoid: true`)
4. **Voir les supprimés** : Utilisez `paranoid: false` dans les requêtes Sequelize pour inclure les enregistrements supprimés

## 🔐 Sécurité

- Tous les endpoints de restauration nécessitent une authentification
- Les utilisateurs ne peuvent restaurer que leurs propres enregistrements
- La suppression définitive nécessite une confirmation explicite

## 📝 Exemple d'utilisation dans le code

```javascript
// Supprimer (soft delete)
await tenant.destroy(); // Marque deleted_at au lieu de supprimer

// Restaurer
tenant.deleted_at = null;
await tenant.save({ paranoid: false });

// Voir les supprimés
const deletedTenants = await Tenant.findAll({
  where: { admin_id: req.admin.id },
  paranoid: false // Inclure les supprimés
});

// Voir seulement les actifs (par défaut)
const activeTenants = await Tenant.findAll({
  where: { admin_id: req.admin.id }
  // paranoid: true par défaut
});
```

## 🆘 Support

Si vous avez des problèmes avec la restauration :
1. Vérifiez que la migration a été exécutée
2. Vérifiez que les binlogs MariaDB sont activés
3. Consultez les logs du serveur pour plus de détails


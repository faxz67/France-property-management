require('dotenv').config({ path: '../.env' });
const { Admin } = require('../models');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createSuperAdmin() {
  console.log('🔐 Création d\'un Super Administrateur');
  console.log('=====================================\n');

  try {
    // Get admin details
    const name = await question('Nom complet: ');
    if (!name || name.trim().length < 2) {
      console.log('❌ Le nom doit contenir au moins 2 caractères.');
      rl.close();
      process.exit(1);
    }

    const email = await question('Email: ');
    if (!email || !email.includes('@')) {
      console.log('❌ Email invalide.');
      rl.close();
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      console.log(`❌ Un administrateur avec l'email "${email}" existe déjà.`);
      rl.close();
      process.exit(1);
    }

    const password = await question('Mot de passe (min 6 caractères): ');
    if (!password || password.length < 6) {
      console.log('❌ Le mot de passe doit contenir au moins 6 caractères.');
      rl.close();
      process.exit(1);
    }

    const confirmPassword = await question('Confirmer le mot de passe: ');
    if (password !== confirmPassword) {
      console.log('❌ Les mots de passe ne correspondent pas.');
      rl.close();
      process.exit(1);
    }

    // Create super admin
    console.log('\n⏳ Création en cours...');
    const newAdmin = await Admin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password, // Plain password - hook will hash it
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      created_by: null // System admin
    });

    console.log('\n✅ Super Administrateur créé avec succès!');
    console.log('=====================================');
    console.log(`ID: ${newAdmin.id}`);
    console.log(`Nom: ${newAdmin.name}`);
    console.log(`Email: ${newAdmin.email}`);
    console.log(`Rôle: ${newAdmin.role}`);
    console.log(`Statut: ${newAdmin.status}`);
    console.log('\n💡 Vous pouvez maintenant vous connecter avec cet email et ce mot de passe.');

  } catch (error) {
    console.error('\n❌ Erreur lors de la création:', error.message);
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('   Un administrateur avec cet email existe déjà.');
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

createSuperAdmin();


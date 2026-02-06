const db = require('../src/models');

(async () => {
  try {
    console.log('=== SIGNALEMENTS DANS POSTGRESQL ===\n');
    
    const signalements = await db.Signalement.findAll({
      include: [
        {
          model: db.Point,
          as: 'point',
          include: {
            model: db.Ville,
            as: 'ville',
          },
        },
        {
          model: db.Utilisateur,
          as: 'utilisateur',
        },
        {
          model: db.SignalementStatut,
          as: 'statut',
        },
      ],
    });
    
    console.log('Total signalements dans PostgreSQL:', signalements.length);
    console.log('');
    
    for (const s of signalements) {
      console.log('--- ID:', s.id_signalements, '---');
      console.log('  Description:', s.description?.substring(0, 50) || 'N/A');
      console.log('  Utilisateur:', s.utilisateur?.email || 'N/A');
      console.log('  Statut:', s.statut?.libelle || 'N/A');
      console.log('  Ville:', s.point?.ville?.nom || 'N/A');
      console.log('');
    }
    
    // Vérifier le mapping Firebase
    console.log('\n=== MAPPINGS SIGNALEMENTS ===\n');
    
    const mappings = await db.FirebaseMapping.findAll({
      where: { entity_type: 'signalement' },
    });
    
    console.log('Total mappings signalement:', mappings.length);
    for (const m of mappings) {
      console.log(`  PG: ${m.postgres_id} <-> Firebase: ${m.firebase_id}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
})();

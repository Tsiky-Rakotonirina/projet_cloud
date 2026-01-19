const db = require('../models');

class EntrepriseService {
  // Récupérer toutes les entreprises
  async getAllEntreprises() {
    const entreprises = await db.Entreprise.findAll({
      attributes: ['id_entreprises', 'nom', 'adresse', 'telephone']
    });
    return entreprises;
  }

  // Récupérer une entreprise par ID
  async getEntrepriseById(id) {
    const entreprise = await db.Entreprise.findByPk(id, {
      attributes: ['id_entreprises', 'nom', 'adresse', 'telephone'],
      include: [
        {
          model: db.Probleme,
          attributes: ['id_problemes', 'surface', 'budget'],
          through: { attributes: [] }
        }
      ]
    });
    return entreprise;
  }

  // Créer une entreprise
  async createEntreprise(data) {
    const { nom, adresse, telephone } = data;

    if (!nom) {
      throw new Error('Le nom de l\'entreprise est requis');
    }

    const entreprise = await db.Entreprise.create({
      nom,
      adresse,
      telephone
    });

    return entreprise;
  }

  // Mettre à jour une entreprise
  async updateEntreprise(id, data) {
    const entreprise = await db.Entreprise.findByPk(id);

    if (!entreprise) {
      throw new Error('Entreprise non trouvée');
    }

    const { nom, adresse, telephone } = data;

    if (nom) entreprise.nom = nom;
    if (adresse) entreprise.adresse = adresse;
    if (telephone) entreprise.telephone = telephone;

    await entreprise.save();
    return entreprise;
  }

  // Supprimer une entreprise
  async deleteEntreprise(id) {
    const entreprise = await db.Entreprise.findByPk(id);

    if (!entreprise) {
      throw new Error('Entreprise non trouvée');
    }

    await entreprise.destroy();
    return { message: 'Entreprise supprimée avec succès' };
  }

  // Récupérer les problèmes assignés à une entreprise
  async getEntrepriseProblemes(id) {
    const entreprise = await db.Entreprise.findByPk(id, {
      include: [
        {
          model: db.Probleme,
          attributes: ['id_problemes', 'surface', 'budget', 'probleme_statut_id'],
          include: [
            {
              model: db.ProblemeStatut,
              attributes: ['id_probleme_statuts', 'libelle', 'pourcentage']
            }
          ]
        }
      ]
    });

    if (!entreprise) {
      throw new Error('Entreprise non trouvée');
    }

    return entreprise.Problemes;
  }
}

module.exports = new EntrepriseService();

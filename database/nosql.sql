{
  "profils": [
    {
      "_id": "profilId",
      "libelle": "Admin",
      "descri": "Administrateur système"
    }
  ],

  "villes": [
    {
      "_id": "villeId",
      "nom": "Antananarivo",
      "location": { "lat": -18.8792, "lng": 47.5079 },
      "rues": [
        {
          "_id": "rueId",
          "nom": "Indépendance",
          "type": "avenue",
          "path": [
            { "lat": -18.88, "lng": 47.50 },
            { "lat": -18.87, "lng": 47.51 }
          ]
        }
      ]
    }
  ],

  "entreprises": [
    {
      "_id": "entrepriseId",
      "nom": "okok",
      "adresse": "Antananarivo",
      "telephone": "+261000000"
    }
  ],

  "signalement_statuts": [
    {
      "_id": "signalementStatutId",
      "libelle": "En cours",
      "descri": "Traitement en cours"
    }
  ],

  "probleme_statuts": [
    {
      "_id": "problemeStatutId",
      "libelle": "Résolu",
      "descri": "Travaux terminés",
      "pourcentage": 100
    }
  ],

  "utilisateurs": [
    {
      "_id": "userId",
      "email": "user@mail.com",
      "github": "kasaina",
      "dateNaissance": "2002-01-01",
      "profilId": "profilId"
    }
  ],

  "signalements": [
    {
      "_id": "signalementId",
      "description": "Route endommagée",
      "utilisateurId": "userId",
      "statutId": "signalementStatutId",
      "point": {
        "lat": -18.88,
        "lng": 47.50,
        "villeId": "villeId"
      },
      "createdAt": "2026-01-20T10:00:00Z",
      "historiques": [
        {
          "date": "2026-01-20T12:00:00Z",
          "utilisateurId": "userId",
          "statutId": "signalementStatutId"
        }
      ]
    }
  ],

  "problemes": [
    {
      "_id": "problemeId",
      "surface": 120,
      "budget": 500000,
      "entrepriseId": "entrepriseId",
      "signalementId": "signalementId",
      "statutId": "problemeStatutId",
      "historiques": [
        {
          "date": "2026-01-21T09:00:00Z",
          "surface": 150,
          "budget": 600000,
          "utilisateurId": "userId",
          "statutId": "problemeStatutId"
        }
      ]
    }
  ]
}

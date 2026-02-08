import { PrismaClient, GroupRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CROUSZ database...\n');

  // ============================================================
  // 4 existing real users (already in DB via Google OAuth)
  // We update their professional profiles
  // ============================================================
  const existingUsers = [
    {
      id: '04ecbb72-f47c-4437-b69b-48dd7fed4d99',
      jobTitle: 'Chargé de communication',
      specialty: 'Communication institutionnelle',
      skills: ['Rédaction', 'Relations presse', 'Réseaux sociaux', 'Événementiel', 'PAO'],
      bio: 'Chargé de communication au CROUSZ, responsable de la visibilité et de l\'image de l\'institution.',
    },
    {
      id: '58386a20-6bbe-4e7c-b3b5-b3ecf4093ead',
      jobTitle: 'Chef Division des Systèmes d\'Information',
      specialty: 'Systèmes d\'information',
      skills: ['Administration réseau', 'Sécurité informatique', 'Gestion de projet IT', 'Infrastructure', 'Base de données'],
      bio: 'Responsable de la division SI du CROUSZ, en charge de l\'infrastructure informatique et de la transformation numérique.',
    },
    {
      id: 'be1ef7a5-3979-4144-aed0-0893bff8f188',
      jobTitle: 'Chef Service Budget',
      specialty: 'Finances publiques',
      skills: ['Comptabilité publique', 'Gestion budgétaire', 'Marchés publics', 'Contrôle de gestion', 'Audit'],
      bio: 'Chef du service budget, garant de la bonne exécution budgétaire du CROUSZ.',
    },
    {
      id: 'c29acd16-2f86-418f-9291-f6e2c4d8b169',
      jobTitle: 'Administrateur système',
      specialty: 'Administration système et réseau',
      skills: ['Linux', 'Windows Server', 'Virtualisation', 'Docker', 'Monitoring', 'Scripting'],
      bio: 'Administrateur système au sein de la DSI du CROUSZ, en charge de la maintenance des serveurs et de l\'infrastructure.',
    },
  ];

  for (const u of existingUsers) {
    await prisma.user.update({
      where: { id: u.id },
      data: {
        jobTitle: u.jobTitle,
        specialty: u.specialty,
        skills: u.skills,
        bio: u.bio,
      },
    }).catch(() => {
      console.log(`⚠️  User ${u.id} not found, skipping profile update.`);
    });
  }
  console.log('✅ Updated 4 existing users\' professional profiles\n');

  // ============================================================
  // 30 new fake users with realistic CROUSZ profiles
  // ============================================================
  const fakeUsers = [
    // --- Direction Générale ---
    { name: 'Mamadou Lamine Diallo', email: 'ml.diallo@crousz.sn', jobTitle: 'Directeur Général', specialty: 'Administration publique', skills: ['Management', 'Stratégie', 'Gouvernance', 'Leadership', 'Planification'], bio: 'Directeur Général du CROUSZ, pilote la stratégie globale de l\'institution.' },
    { name: 'Aïssatou Sow', email: 'a.sow@crousz.sn', jobTitle: 'Secrétaire Générale', specialty: 'Administration', skills: ['Gestion administrative', 'Coordination', 'Rédaction administrative', 'Protocole'], bio: 'Secrétaire Générale, assure la coordination administrative du CROUSZ.' },
    { name: 'Ibrahima Ndiaye', email: 'i.ndiaye@crousz.sn', jobTitle: 'Agent Comptable', specialty: 'Comptabilité publique', skills: ['Comptabilité', 'Trésorerie', 'Contrôle financier', 'SIGFIP', 'Audit comptable'], bio: 'Agent comptable du CROUSZ, responsable de la tenue des comptes et du paiement.' },

    // --- Division Hébergement ---
    { name: 'Ousmane Cissé', email: 'o.cisse@crousz.sn', jobTitle: 'Chef Division Hébergement', specialty: 'Gestion des résidences universitaires', skills: ['Gestion immobilière', 'Maintenance', 'Planification', 'Attribution logements'], bio: 'Responsable de la division hébergement, gère les résidences universitaires du campus.' },
    { name: 'Fatou Diop', email: 'f.diop@crousz.sn', jobTitle: 'Gestionnaire Résidence A', specialty: 'Hébergement étudiant', skills: ['Gestion locative', 'Accueil', 'Suivi des résidents', 'Inventaire'], bio: 'Gestionnaire de la résidence universitaire A, en charge de l\'accueil et du suivi des étudiants hébergés.' },
    { name: 'Moussa Baldé', email: 'm.balde@crousz.sn', jobTitle: 'Gestionnaire Résidence B', specialty: 'Hébergement étudiant', skills: ['Gestion locative', 'Maintenance bâtiment', 'Sécurité', 'Hygiène'], bio: 'Gestionnaire de la résidence universitaire B.' },
    { name: 'Aminata Camara', email: 'a.camara@crousz.sn', jobTitle: 'Agent d\'entretien - Hébergement', specialty: 'Entretien et hygiène', skills: ['Nettoyage', 'Hygiène', 'Gestion des stocks produits', 'Maintenance légère'], bio: 'Agent d\'entretien affecté aux résidences universitaires.' },

    // --- Division Restauration ---
    { name: 'Abdoulaye Diatta', email: 'a.diatta@crousz.sn', jobTitle: 'Chef Division Restauration', specialty: 'Restauration collective', skills: ['Gestion restauration', 'HACCP', 'Nutrition', 'Approvisionnement', 'Management d\'équipe'], bio: 'Chef de la division restauration, supervise les restaurants universitaires du CROUSZ.' },
    { name: 'Mariama Sané', email: 'm.sane@crousz.sn', jobTitle: 'Responsable Restaurant Central', specialty: 'Restauration', skills: ['Cuisine collective', 'Gestion des menus', 'Hygiène alimentaire', 'Approvisionnement'], bio: 'Responsable du restaurant universitaire central.' },
    { name: 'Lamine Sonko', email: 'l.sonko@crousz.sn', jobTitle: 'Chef cuisinier', specialty: 'Cuisine', skills: ['Cuisine sénégalaise', 'Cuisine collective', 'Pâtisserie', 'Gestion des stocks alimentaires'], bio: 'Chef cuisinier du restaurant universitaire central.' },
    { name: 'Khady Ndiaye', email: 'k.ndiaye@crousz.sn', jobTitle: 'Magasinier Restauration', specialty: 'Logistique', skills: ['Gestion des stocks', 'Approvisionnement', 'Inventaire', 'Traçabilité'], bio: 'Magasinier en charge des stocks alimentaires pour la restauration.' },

    // --- Service Médico-Social ---
    { name: 'Dr. Boubacar Ba', email: 'b.ba@crousz.sn', jobTitle: 'Médecin Chef', specialty: 'Médecine générale', skills: ['Consultation médicale', 'Médecine préventive', 'Santé publique', 'Urgences'], bio: 'Médecin chef du service médico-social, assure les consultations et la prévention sanitaire.' },
    { name: 'Adama Diallo', email: 'ad.diallo@crousz.sn', jobTitle: 'Infirmier d\'État', specialty: 'Soins infirmiers', skills: ['Soins infirmiers', 'Premiers secours', 'Vaccination', 'Éducation sanitaire'], bio: 'Infirmier d\'État au centre médical du CROUSZ.' },
    { name: 'Coumba Fall', email: 'c.fall@crousz.sn', jobTitle: 'Assistante sociale', specialty: 'Action sociale', skills: ['Accompagnement social', 'Écoute', 'Orientation', 'Aide aux étudiants en difficulté'], bio: 'Assistante sociale, accompagne les étudiants en situation de précarité.' },

    // --- Service Sport & Culture ---
    { name: 'Pape Moussa Dieng', email: 'pm.dieng@crousz.sn', jobTitle: 'Chef Service Sport & Culture', specialty: 'Animation sportive et culturelle', skills: ['Organisation événementielle', 'Sport universitaire', 'Animation culturelle', 'Coordination'], bio: 'Responsable du service sport et culture, organise les activités extra-académiques.' },
    { name: 'Ndèye Astou Mbaye', email: 'na.mbaye@crousz.sn', jobTitle: 'Animateur culturel', specialty: 'Animation culturelle', skills: ['Théâtre', 'Musique', 'Organisation festivals', 'Communication événementielle'], bio: 'Animateur culturel au CROUSZ, organise les événements culturels du campus.' },
    { name: 'Cheikh Tidiane Sarr', email: 'ct.sarr@crousz.sn', jobTitle: 'Moniteur sportif', specialty: 'Éducation physique', skills: ['Football', 'Athlétisme', 'Basketball', 'Encadrement sportif', 'Arbitrage'], bio: 'Moniteur sportif, encadre les activités sportives universitaires.' },

    // --- Service Ressources Humaines ---
    { name: 'Rokhaya Gueye', email: 'r.gueye@crousz.sn', jobTitle: 'Chef Service RH', specialty: 'Ressources humaines', skills: ['Gestion du personnel', 'Paie', 'Droit du travail', 'Formation', 'Recrutement'], bio: 'Chef du service des ressources humaines du CROUSZ.' },
    { name: 'Modou Faye', email: 'mo.faye@crousz.sn', jobTitle: 'Gestionnaire RH', specialty: 'Administration du personnel', skills: ['Paie', 'Gestion des congés', 'Dossiers du personnel', 'Déclarations sociales'], bio: 'Gestionnaire RH, assure le suivi administratif du personnel.' },

    // --- Service Marchés Publics ---
    { name: 'Seydou Touré', email: 's.toure@crousz.sn', jobTitle: 'Chef Service Marchés Publics', specialty: 'Marchés publics', skills: ['Passation de marchés', 'Code des marchés publics', 'Rédaction DAO', 'Évaluation des offres'], bio: 'Chef du service des marchés publics, responsable de la passation des marchés du CROUSZ.' },
    { name: 'Awa Diouf', email: 'aw.diouf@crousz.sn', jobTitle: 'Assistante Marchés Publics', specialty: 'Marchés publics', skills: ['Suivi des marchés', 'Archivage', 'Rédaction administrative', 'Secrétariat'], bio: 'Assistante au service des marchés publics.' },

    // --- Division Systèmes d'Information (DSI) ---
    { name: 'Babacar Diop', email: 'bab.diop@crousz.sn', jobTitle: 'Développeur Web', specialty: 'Développement web', skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Next.js', 'NestJS'], bio: 'Développeur web full-stack à la DSI du CROUSZ.' },
    { name: 'Mame Diarra Bousso Niang', email: 'md.niang@crousz.sn', jobTitle: 'Technicienne Support IT', specialty: 'Support informatique', skills: ['Support utilisateur', 'Dépannage', 'Installation logicielle', 'Réseau', 'Active Directory'], bio: 'Technicienne support informatique, assure l\'assistance aux utilisateurs.' },

    // --- Service Codification / Bourses ---
    { name: 'El Hadji Malick Sy', email: 'ehm.sy@crousz.sn', jobTitle: 'Chef Service Codification', specialty: 'Gestion des bourses', skills: ['Codification', 'Gestion des bourses', 'Traitement des dossiers', 'Base de données étudiants'], bio: 'Chef du service codification, gère l\'attribution des codes et le suivi des bourses.' },
    { name: 'Dieynaba Diallo', email: 'd.diallo@crousz.sn', jobTitle: 'Agent de codification', specialty: 'Traitement des dossiers étudiants', skills: ['Saisie', 'Vérification des dossiers', 'Accueil étudiants', 'Archivage'], bio: 'Agent de codification, traite les dossiers de bourses des étudiants.' },

    // --- Service Contrôle de Gestion ---
    { name: 'Oumar Sall', email: 'o.sall@crousz.sn', jobTitle: 'Contrôleur de gestion', specialty: 'Contrôle de gestion', skills: ['Analyse financière', 'Tableaux de bord', 'Reporting', 'Audit interne', 'Excel avancé'], bio: 'Contrôleur de gestion, assure le suivi des performances et l\'optimisation des ressources.' },

    // --- Service Accueil & Orientation ---
    { name: 'Binta Sagna', email: 'b.sagna@crousz.sn', jobTitle: 'Chargée d\'accueil et orientation', specialty: 'Accueil et information', skills: ['Accueil', 'Orientation', 'Information étudiants', 'Communication orale'], bio: 'Chargée d\'accueil, oriente et informe les étudiants sur les services du CROUSZ.' },

    // --- Maintenance & Logistique ---
    { name: 'Demba Manga', email: 'd.manga@crousz.sn', jobTitle: 'Chef Service Maintenance', specialty: 'Maintenance technique', skills: ['Électricité', 'Plomberie', 'Menuiserie', 'Gestion des interventions', 'Sécurité bâtiment'], bio: 'Chef du service maintenance, coordonne les interventions techniques sur le campus.' },
    { name: 'Saliou Coly', email: 's.coly@crousz.sn', jobTitle: 'Technicien de maintenance', specialty: 'Maintenance bâtiment', skills: ['Électricité', 'Plomberie', 'Climatisation', 'Peinture'], bio: 'Technicien de maintenance, intervient sur les installations du campus.' },
  ];

  const createdUsers: { id: string; name: string; jobTitle: string }[] = [];

  for (const u of fakeUsers) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        googleId: `fake-google-${u.email}`,
        jobTitle: u.jobTitle,
        specialty: u.specialty,
        skills: u.skills,
        bio: u.bio,
      },
    });
    createdUsers.push({ id: user.id, name: user.name, jobTitle: u.jobTitle });
  }
  console.log(`✅ Created ${createdUsers.length} fake users\n`);

  // Helper to find user by job title
  const findUser = (title: string) => createdUsers.find((u) => u.jobTitle === title);
  const findUsers = (...titles: string[]) => titles.map((t) => findUser(t)).filter(Boolean) as typeof createdUsers;

  // ============================================================
  // 20 groups matching CROUSZ organizational structure
  // ============================================================
  const groupsData = [
    {
      name: 'Direction Générale',
      description: 'Groupe de la direction générale du CROUSZ. Coordination stratégique et pilotage de l\'institution.',
      isPublic: false,
      adminTitle: 'Directeur Général',
      memberTitles: ['Secrétaire Générale', 'Agent Comptable', 'Chef Service RH', 'Contrôleur de gestion'],
    },
    {
      name: 'Division Hébergement',
      description: 'Gestion des résidences universitaires, attribution des lits et suivi des étudiants hébergés.',
      isPublic: false,
      adminTitle: 'Chef Division Hébergement',
      memberTitles: ['Gestionnaire Résidence A', 'Gestionnaire Résidence B', 'Agent d\'entretien - Hébergement', 'Chef Service Maintenance'],
    },
    {
      name: 'Division Restauration',
      description: 'Gestion des restaurants universitaires, menus, approvisionnement et hygiène alimentaire.',
      isPublic: false,
      adminTitle: 'Chef Division Restauration',
      memberTitles: ['Responsable Restaurant Central', 'Chef cuisinier', 'Magasinier Restauration'],
    },
    {
      name: 'Service Médico-Social',
      description: 'Soins médicaux, prévention sanitaire et accompagnement social des étudiants.',
      isPublic: false,
      adminTitle: 'Médecin Chef',
      memberTitles: ['Infirmier d\'État', 'Assistante sociale'],
    },
    {
      name: 'Service Sport & Culture',
      description: 'Organisation des activités sportives et culturelles sur le campus universitaire.',
      isPublic: true,
      adminTitle: 'Chef Service Sport & Culture',
      memberTitles: ['Animateur culturel', 'Moniteur sportif'],
    },
    {
      name: 'Service Ressources Humaines',
      description: 'Gestion du personnel, paie, formation et recrutement au CROUSZ.',
      isPublic: false,
      adminTitle: 'Chef Service RH',
      memberTitles: ['Gestionnaire RH', 'Secrétaire Générale'],
    },
    {
      name: 'Service Marchés Publics',
      description: 'Passation et suivi des marchés publics du CROUSZ conformément au code des marchés.',
      isPublic: false,
      adminTitle: 'Chef Service Marchés Publics',
      memberTitles: ['Assistante Marchés Publics', 'Agent Comptable', 'Contrôleur de gestion'],
    },
    {
      name: 'Division Systèmes d\'Information (DSI)',
      description: 'Infrastructure informatique, développement d\'applications et support technique.',
      isPublic: false,
      adminTitle: 'Chef Division des Systèmes d\'Information',
      memberTitles: ['Développeur Web', 'Technicienne Support IT'],
      existingAdminId: '58386a20-6bbe-4e7c-b3b5-b3ecf4093ead',
      existingMemberIds: ['c29acd16-2f86-418f-9291-f6e2c4d8b169'],
    },
    {
      name: 'Service Codification & Bourses',
      description: 'Gestion de la codification des étudiants et suivi des bourses universitaires.',
      isPublic: false,
      adminTitle: 'Chef Service Codification',
      memberTitles: ['Agent de codification', 'Chargée d\'accueil et orientation'],
    },
    {
      name: 'Service Budget & Finances',
      description: 'Gestion budgétaire, exécution financière et contrôle des dépenses du CROUSZ.',
      isPublic: false,
      adminTitle: 'Chef Service Budget',
      memberTitles: ['Agent Comptable', 'Contrôleur de gestion'],
      existingAdminId: 'be1ef7a5-3979-4144-aed0-0893bff8f188',
    },
    {
      name: 'Communication & Relations Publiques',
      description: 'Communication institutionnelle, relations presse et gestion de l\'image du CROUSZ.',
      isPublic: true,
      adminTitle: 'Chargé de communication',
      memberTitles: ['Animateur culturel', 'Chargée d\'accueil et orientation'],
      existingAdminId: '04ecbb72-f47c-4437-b69b-48dd7fed4d99',
    },
    {
      name: 'Service Maintenance & Logistique',
      description: 'Maintenance des bâtiments, installations techniques et logistique du campus.',
      isPublic: false,
      adminTitle: 'Chef Service Maintenance',
      memberTitles: ['Technicien de maintenance', 'Gestionnaire Résidence A', 'Gestionnaire Résidence B'],
    },
    {
      name: 'Comité de Direction (CODIR)',
      description: 'Réunion des chefs de division et de service pour les décisions stratégiques du CROUSZ.',
      isPublic: false,
      adminTitle: 'Directeur Général',
      memberTitles: [
        'Secrétaire Générale', 'Agent Comptable', 'Chef Division Hébergement',
        'Chef Division Restauration', 'Médecin Chef', 'Chef Service Sport & Culture',
        'Chef Service RH', 'Chef Service Marchés Publics', 'Chef Service Codification',
        'Contrôleur de gestion', 'Chef Service Maintenance',
      ],
      existingMemberIds: ['58386a20-6bbe-4e7c-b3b5-b3ecf4093ead', 'be1ef7a5-3979-4144-aed0-0893bff8f188', '04ecbb72-f47c-4437-b69b-48dd7fed4d99'],
    },
    {
      name: 'Accueil & Orientation Étudiants',
      description: 'Service d\'accueil, d\'information et d\'orientation des étudiants bénéficiaires des œuvres sociales.',
      isPublic: true,
      adminTitle: 'Chargée d\'accueil et orientation',
      memberTitles: ['Assistante sociale', 'Agent de codification'],
    },
    {
      name: 'Projet Transformation Numérique',
      description: 'Projet transversal de digitalisation des services du CROUSZ : codification en ligne, gestion hébergement, restauration.',
      isPublic: false,
      adminTitle: 'Chef Division des Systèmes d\'Information',
      memberTitles: ['Développeur Web', 'Technicienne Support IT', 'Chef Service Codification', 'Agent de codification'],
      existingAdminId: '58386a20-6bbe-4e7c-b3b5-b3ecf4093ead',
      existingMemberIds: ['c29acd16-2f86-418f-9291-f6e2c4d8b169'],
    },
    {
      name: 'Commission Attribution Logements',
      description: 'Commission chargée de l\'examen et de l\'attribution des logements universitaires aux étudiants.',
      isPublic: false,
      adminTitle: 'Chef Division Hébergement',
      memberTitles: ['Gestionnaire Résidence A', 'Gestionnaire Résidence B', 'Assistante sociale', 'Chargée d\'accueil et orientation'],
    },
    {
      name: 'Comité Hygiène & Sécurité',
      description: 'Veille sur l\'hygiène et la sécurité dans les résidences et restaurants universitaires.',
      isPublic: false,
      adminTitle: 'Médecin Chef',
      memberTitles: ['Chef Division Restauration', 'Chef Division Hébergement', 'Chef Service Maintenance', 'Infirmier d\'État'],
    },
    {
      name: 'Organisation Événements Campus',
      description: 'Coordination des événements culturels, sportifs et institutionnels sur le campus.',
      isPublic: true,
      adminTitle: 'Chef Service Sport & Culture',
      memberTitles: ['Animateur culturel', 'Moniteur sportif'],
      existingMemberIds: ['04ecbb72-f47c-4437-b69b-48dd7fed4d99'],
    },
    {
      name: 'Cellule Passation des Marchés',
      description: 'Cellule dédiée à la préparation et au suivi des dossiers d\'appel d\'offres.',
      isPublic: false,
      adminTitle: 'Chef Service Marchés Publics',
      memberTitles: ['Assistante Marchés Publics', 'Contrôleur de gestion'],
      existingMemberIds: ['be1ef7a5-3979-4144-aed0-0893bff8f188'],
    },
    {
      name: 'Projet Rénovation Résidences',
      description: 'Projet de rénovation et d\'extension des résidences universitaires du campus.',
      isPublic: false,
      adminTitle: 'Chef Division Hébergement',
      memberTitles: ['Chef Service Maintenance', 'Technicien de maintenance', 'Chef Service Marchés Publics'],
      existingMemberIds: ['be1ef7a5-3979-4144-aed0-0893bff8f188'],
    },
  ];

  let groupCount = 0;
  for (const g of groupsData) {
    // Determine admin ID
    let adminId: string;
    if (g.existingAdminId) {
      adminId = g.existingAdminId;
    } else {
      const adminUser = findUser(g.adminTitle);
      if (!adminUser) {
        console.log(`⚠️  Admin "${g.adminTitle}" not found for group "${g.name}", skipping.`);
        continue;
      }
      adminId = adminUser.id;
    }

    // Create group
    const group = await prisma.group.create({
      data: {
        name: g.name,
        description: g.description,
        isPublic: g.isPublic,
        adminId,
      },
    });

    // Add members
    const memberIds = new Set<string>();

    // From fake users by job title
    for (const title of g.memberTitles) {
      const member = findUser(title);
      if (member && member.id !== adminId) {
        memberIds.add(member.id);
      }
    }

    // From existing real users
    if (g.existingMemberIds) {
      for (const id of g.existingMemberIds) {
        if (id !== adminId) {
          memberIds.add(id);
        }
      }
    }

    for (const memberId of memberIds) {
      await prisma.groupMember.create({
        data: {
          userId: memberId,
          groupId: group.id,
          role: GroupRole.MEMBER,
        },
      }).catch(() => {
        // Skip if already exists
      });
    }

    groupCount++;
    console.log(`  📁 ${group.name} (admin: ${g.adminTitle}, ${memberIds.size} members)`);
  }

  console.log(`\n✅ Created ${groupCount} groups\n`);
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

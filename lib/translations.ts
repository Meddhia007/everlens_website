export type Language = 'fr' | 'en';

export interface PresetPack {
  title: string;
  subtitle: string;
  badge?: string;
  price: string;
  description: string;
  features: string[];
  options: string[];
}

export interface Translations {
  nav: {
    work: string;
    packs: string;
    equipment: string;
    about: string;
    contact: string;
    portal: string;
    tagline: string;
    current_lang: string;
    other_lang: string;
  };
  hero: {
    eyebrow: string;
    title_line1: string;
    title_line2: string;
    title_line3: string;
    subtitle: string;
    cta_reel: string;
    cta_availability: string;
    scroll: string;
  };
  marquee: {
    items: string;
  };
  work: {
    title: string;
    tabs: {
      all: string;
      photography: string;
      films: string;
      traditional: string;
      editorial: string;
    };
    empty_title: string;
    empty_desc: string;
    more_moments: string;
    inquire_link: string;
  };
  packs: {
    tag: string;
    title: string;
    subtitle: string;
    desc: string;
    price_on_request: string;
    best_value_badge: string;
    signature_badge: string;
    included_label: string;
    options_label: string;
    book_collection: string;
    advisor_title: string;
    advisor_desc: string;
    whatsapp_btn: string;
    preset_packs: PresetPack[];
  };
  equipment: {
    title: string;
    desc: string;
    tabs: {
      all: string;
      cameras: string;
      lenses: string;
      aerial: string;
    };
    capabilities: string;
    specs: string;
    featured_in: string;
  };
  about: {
    title: string;
    quote: string;
    desc: string;
    stat1_num: string;
    stat1_label: string;
    stat2_num: string;
    stat2_label: string;
    stat3_num: string;
    stat3_label: string;
  };
  contact: {
    title: string;
    subtitle: string;
    get_in_touch: string;
    get_in_touch_desc: string;
    direct_channels: string;
    studio_location: string;
    location_value: string;
    social_presence: string;
    form_title: string;
    label_couple_names: string;
    placeholder_couple_names: string;
    label_email: string;
    placeholder_email: string;
    label_event_date: string;
    label_venue: string;
    placeholder_venue: string;
    label_package_interest: string;
    label_notes: string;
    placeholder_notes: string;
    submit_btn: string;
    submitting_btn: string;
    success_title: string;
    success_desc: string;
    success_btn: string;
  };
  footer: {
    tagline: string;
    rights: string;
  };
  whatsapp: {
    tooltip: string;
  };
}

export const translations: Record<Language, Translations> = {
  fr: {
    nav: {
      work: 'Réalisations',
      packs: 'Nos Formules',
      equipment: 'Équipement',
      about: 'À Propos',
      contact: 'Contact',
      portal: 'Espace Client',
      tagline: 'EverLens Weddings • Cinématographie & Photographie Éditoriale',
      current_lang: 'FR',
      other_lang: 'EN',
    },
    hero: {
      eyebrow: 'FILMS DE MARIAGE & PHOTOGRAPHIE CINÉMATOGRAPHIQUE',
      title_line1: 'Nous ne capturons pas',
      title_line2: 'de simples images —',
      title_line3: 'nous préservons des émotions.',
      subtitle:
        'Photographie éditoriale de mariage et films cinématographiques, réalisés à travers la Tunisie et le monde — pensés pour les couples qui souhaitent vivre leur journée comme un film, non comme une simple formalité.',
      cta_reel: 'Voir le portfolio',
      cta_availability: 'Vérifier la disponibilité',
      scroll: 'DÉFILER',
    },
    marquee: {
      items:
        'Sarah & Youssef — Carthage · Leila & Amine — Côte Méditerranéenne · Elena — Ruines de Carthage · Fleurs d’Héritage — La Marsa · ',
    },
    work: {
      title: 'Dernières réalisations',
      tabs: {
        all: 'Tout',
        photography: 'Photographie',
        films: 'Films',
        traditional: 'Traditionnel',
        editorial: 'Éditorial',
      },
      empty_title: 'Nouvelles histoires bientôt disponibles',
      empty_desc:
        'Notre portfolio est actuellement enrichi avec nos dernières célébrations et créations cinématographiques.',
      more_moments: 'moments supplémentaires',
      inquire_link: 'Demander une commission privée',
    },
    packs: {
      tag: 'Offres Mariage 2026',
      title: 'Nos Formules & Packs Mariage',
      subtitle: "Votre histoire d'amour filmée à la perfection",
      desc: 'Des formules cinématographiques et photographiques complètes créées pour immortaliser et archiver chaque émotion de votre célébration.',
      price_on_request: 'TARIFS SUR DEMANDE',
      best_value_badge: 'MEILLEURE OFFRE',
      signature_badge: 'SIGNATURE',
      included_label: 'INCLUS DANS LE PACK :',
      options_label: 'OPTIONS :',
      book_collection: 'Réserver ce pack',
      advisor_title: 'Des questions sur nos formules de mariage ?',
      advisor_desc:
        'Besoin d’un devis sur-mesure ou de combiner plusieurs célébrations (Outia, Mairie, Réception) ? Échangez directement avec notre équipe.',
      whatsapp_btn: 'Discuter sur WhatsApp',
      preset_packs: [
        {
          title: 'PACK ESSENTIEL',
          subtitle: 'Réception 2H',
          badge: '',
          price: 'Tarifs sur demande',
          description:
            'Photos numériques illimitées, vidéo teaser 4K ou reels cinématiques, livraison sur flash.',
          features: [
            'Photos numériques illimitées',
            'Vidéo teaser 4K ou 2 Reels cinématiques',
            'Livraison sur flash',
          ],
          options: [
            'Préparatifs',
            'Reel cinématique',
            'Shooting extérieur',
            'Drone aérien 4K',
            'Tableau MDF 30×40',
            'Album photo & Tirages',
            'Grue 7M Pro',
          ],
        },
        {
          title: 'PACK BASIC',
          subtitle: 'Cérémonie & Soirée',
          badge: '',
          price: 'Tarifs sur demande',
          description:
            'Reportage vidéo 4K, aftermovie cinématique, photos illimitées et 50 tirages imprimés.',
          features: [
            'Reportage vidéo 4K',
            'Aftermovie cinématique',
            'Photos numériques illimitées',
            '50 photos imprimées',
            'Livraison sur flash',
          ],
          options: [
            'Préparatifs',
            'Reel cinématique supplémentaire',
            'Shooting extérieur',
            'Drone aérien 4K',
            'Tableau MDF 30×40',
            'Album photo / PhotoBook Luxe',
            'Grue 7M Pro',
            'Livraison prioritaire',
          ],
        },
        {
          title: 'PACK STANDARD',
          subtitle: 'Le choix coup de cœur',
          badge: 'MEILLEURE OFFRE',
          price: 'Tarifs sur demande',
          description:
            'Formule complète avec reportage 4K, drone, shooting extérieur, 1 reel, tableau MDF et album photo offert.',
          features: [
            'Reportage vidéo 4K',
            'Aftermovie cinématique',
            'Photos numériques illimitées',
            '80 photos imprimées',
            'Shooting extérieur',
            'Drone',
            '1 Reel cinématique',
            'Tableau MDF 30×40 offert',
            'Album photo offert',
            'Préparatifs inclus',
          ],
          options: [
            'Grue 7M Pro',
            '2ème Reel cinématique',
            'PhotoBook Luxe 15 pages',
            'Livraison prioritaire',
            'Séance After-Day / Engagement',
          ],
        },
        {
          title: 'PACK PREMIUM SIGNATURE',
          subtitle: "L'expérience haute couture",
          badge: 'SIGNATURE',
          price: 'Tarifs sur demande',
          description:
            'Production prestige avec grue 7M pro, drone, 100 tirages, PhotoBook Luxe 15 pages et livraison prioritaire.',
          features: [
            'Reportage vidéo 4K',
            'Aftermovie cinématique',
            'Photos numériques illimitées',
            '100 photos imprimées',
            'Shooting extérieur',
            'Drone',
            'Grue 7M Pro',
            '2 Reels cinématiques',
            'PhotoBook Luxe 15 pages',
            'Tableau MDF 30×40 offert',
            'Album photo offert',
            'Préparatifs inclus',
            'Livraison prioritaire',
          ],
          options: [],
        },
      ],
    },
    equipment: {
      title: 'Notre Arsenal de Production',
      desc: 'L’excellence cinématographique portée par des caméras d’exception. Chaque célébration est immortalisée avec des équipements de niveau cinéma.',
      tabs: {
        all: 'Tout le matériel',
        cameras: 'Caméras Cinéma',
        lenses: 'Objectifs & Optiques',
        aerial: 'Drones & Aérien',
      },
      capabilities: 'Performances Clés',
      specs: 'Spécifications Techniques',
      featured_in: 'Utilisé pour nos réalisations',
    },
    about: {
      title: 'Votre journée. Notre passion pour la sublimer.',
      quote: '« Chaque mariage est une œuvre de cinéma. Le vôtre mérite d’être raconté comme tel. »',
      desc: 'EverLens est un studio de photographie et cinématographie de mariage éditorial basé en Tunisie. Nous croyons que chaque célébration mérite d’être immortalisée avec authenticité, émotion et un sens cinématographique intemporel.',
      stat1_num: '150+',
      stat1_label: 'Mariages célébrés',
      stat2_num: '9',
      stat2_label: 'Années d’expérience',
      stat3_num: '100%',
      stat3_label: 'Dévouement total',
    },
    contact: {
      title: 'Créons Ensemble',
      subtitle: 'Prêts à donner vie à vos souvenirs ? Contactez-nous et parlons de votre célébration.',
      get_in_touch: 'Nous Contacter',
      get_in_touch_desc:
        'Nous sommes à votre écoute pour donner vie à votre vision. Que vous souhaitiez une couverture d’une journée complète, un film cinématographique ou une séance intimiste, nous serions ravis de collaborer avec vous.',
      direct_channels: 'Canaux Directs',
      studio_location: 'Emplacement du Studio',
      location_value: 'Manouba, Tunis, Tunisie',
      social_presence: 'Réseaux & Réalisations',
      form_title: 'Envoyez-nous un Message',
      label_couple_names: 'Noms des mariés *',
      placeholder_couple_names: 'ex. Sarah & Youssef',
      label_email: 'Adresse e-mail *',
      placeholder_email: 'vous@exemple.com',
      label_event_date: 'Date de l’événement',
      label_venue: 'Lieu & Ville',
      placeholder_venue: 'ex. Carthage, Sidi Bou Saïd, La Marsa...',
      label_package_interest: 'Formule souhaitée',
      label_notes: 'Parlez-nous de votre projet *',
      placeholder_notes:
        'Partagez votre histoire, vos horaires prévus, le nombre d’invités ou les moments clés qui vous tiennent à cœur...',
      submit_btn: 'Envoyer ma demande',
      submitting_btn: 'Envoi en cours...',
      success_title: 'Demande envoyée avec succès !',
      success_desc:
        'Merci de nous avoir contactés. Nous allons vérifier la disponibilité de votre date et nous reviendrons vers vous sous 24 heures.',
      success_btn: 'Envoyer un autre message',
    },
    footer: {
      tagline: 'EverLens Weddings • Cinématographie & Photographie Éditoriale',
      rights: 'Tous droits réservés.',
    },
    whatsapp: {
      tooltip: 'Discuter sur WhatsApp',
    },
  },
  en: {
    nav: {
      work: 'Work',
      packs: 'Our Packs',
      equipment: 'Equipment',
      about: 'About',
      contact: 'Contact',
      portal: 'Client Portal',
      tagline: 'EverLens Weddings • Editorial Cinematography & Photography',
      current_lang: 'EN',
      other_lang: 'FR',
    },
    hero: {
      eyebrow: 'CINEMATIC WEDDING FILMS & PHOTOGRAPHY',
      title_line1: "We don't just",
      title_line2: 'capture moments —',
      title_line3: 'we preserve feelings.',
      subtitle:
        'Editorial wedding photography and cinematic film, shot across Tunisia and beyond — built for couples who want their day to feel like a film, not a formality.',
      cta_reel: 'View Portfolio',
      cta_availability: 'Check availability',
      scroll: 'SCROLL',
    },
    marquee: {
      items:
        'Sarah & Youssef — Carthage · Leila & Amine — Mediterranean Coast · Elena — Carthage Ruins · Heirloom Florals — La Marsa · ',
    },
    work: {
      title: 'Recent work',
      tabs: {
        all: 'All',
        photography: 'Photography',
        films: 'Films',
        traditional: 'Traditional',
        editorial: 'Editorial',
      },
      empty_title: 'New Stories Coming Soon',
      empty_desc:
        'Our portfolio is currently being curated with our latest celebrations and cinematic reels.',
      more_moments: 'more moments',
      inquire_link: 'Inquire about commissions',
    },
    packs: {
      tag: '2026 Wedding Collections',
      title: 'Our Wedding Packs',
      subtitle: 'Your love story captured to perfection',
      desc: 'Comprehensive cinematic and photographic packages designed to preserve every emotion of your celebration.',
      price_on_request: 'PRICING UPON REQUEST',
      best_value_badge: 'BEST VALUE',
      signature_badge: 'SIGNATURE',
      included_label: 'INCLUDED IN THIS COLLECTION:',
      options_label: 'AVAILABLE OPTIONS:',
      book_collection: 'Book This Collection',
      advisor_title: 'Have questions about our wedding collections?',
      advisor_desc:
        'Looking for a custom package or multi-day coverage (Wteya, Civil, Reception)? Chat directly with our team.',
      whatsapp_btn: 'Chat on WhatsApp',
      preset_packs: [
        {
          title: 'ESSENTIAL COLLECTION',
          subtitle: '2-Hour Reception',
          badge: '',
          price: 'Pricing upon request',
          description:
            'Unlimited digital photos, 4K video teaser or cinematic reels, USB delivery.',
          features: [
            'Unlimited digital photographs',
            '4K video teaser or 2 cinematic reels',
            'High-definition delivery on custom flash drive',
          ],
          options: [
            'Preparations coverage',
            'Cinematic reel',
            'Outdoor portrait session',
            '4K aerial drone',
            '30×40 MDF art print',
            'Photo album & fine prints',
            '7M Pro camera crane',
          ],
        },
        {
          title: 'BASIC COLLECTION',
          subtitle: 'Ceremony & Reception',
          badge: '',
          price: 'Pricing upon request',
          description:
            '4K video coverage, cinematic aftermovie, unlimited photos and 50 printed photos.',
          features: [
            '4K video documentary coverage',
            'Cinematic aftermovie',
            'Unlimited digital photos',
            '50 fine-art printed photos',
            'High-definition delivery on custom flash drive',
          ],
          options: [
            'Preparations coverage',
            'Additional cinematic reel',
            'Outdoor portrait session',
            '4K aerial drone',
            '30×40 MDF art print',
            'Luxury PhotoBook album',
            '7M Pro camera crane',
            'Priority delivery',
          ],
        },
        {
          title: 'STANDARD COLLECTION',
          subtitle: 'The Studio Favorite',
          badge: 'BEST VALUE',
          price: 'Pricing upon request',
          description:
            'Full package with 4K coverage, drone, outdoor session, 1 reel, MDF print and complimentary album.',
          features: [
            '4K video documentary coverage',
            'Cinematic aftermovie',
            'Unlimited digital photos',
            '80 fine-art printed photos',
            'Outdoor couple portrait session',
            '4K aerial drone included',
            '1 Cinematic reel',
            'Complimentary 30×40 MDF art print',
            'Complimentary photo album',
            'Preparations coverage included',
          ],
          options: [
            '7M Pro camera crane',
            '2nd Cinematic reel',
            '15-page luxury photo book',
            'Priority delivery',
            'After-Day / Engagement session',
          ],
        },
        {
          title: 'PREMIUM SIGNATURE COLLECTION',
          subtitle: 'The Haute Couture Experience',
          badge: 'SIGNATURE',
          price: 'Pricing upon request',
          description:
            'Prestige production with 7M pro crane, drone, 100 prints, 15-page luxury photo book and priority delivery.',
          features: [
            '4K video documentary coverage',
            'Cinematic aftermovie',
            'Unlimited digital photos',
            '100 fine-art printed photos',
            'Outdoor couple portrait session',
            '4K aerial drone included',
            '7M Pro camera crane',
            '2 Cinematic reels',
            '15-page prestige luxury photo book',
            'Complimentary 30×40 MDF art print',
            'Complimentary photo album',
            'Preparations coverage included',
            'Priority expedited delivery',
          ],
          options: [],
        },
      ],
    },
    equipment: {
      title: 'Our Camera Arsenal',
      desc: 'Capturing cinematic excellence with industry-leading cinema cameras. Every celebration is preserved with archival-grade master equipment.',
      tabs: {
        all: 'All Gear',
        cameras: 'Cinema Cameras',
        lenses: 'Lenses & Optics',
        aerial: 'Aerial & Drone',
      },
      capabilities: 'Key Capabilities',
      specs: 'Technical Specifications',
      featured_in: 'Featured in Recent Commissions',
    },
    about: {
      title: 'Your day. Our obsession with getting it right.',
      quote: '“Every wedding is cinema. Yours deserves to be treated that way.”',
      desc: 'EverLens is an editorial wedding photography and cinematography studio based in Tunisia. We believe every celebration deserves to be preserved with authenticity, emotion, and an archival cinematic sensibility.',
      stat1_num: '150+',
      stat1_label: 'Weddings captured',
      stat2_num: '9',
      stat2_label: 'Years of experience',
      stat3_num: '100%',
      stat3_label: 'Dedication',
    },
    contact: {
      title: "Let's Create Together",
      subtitle: "Ready to bring your vision to life? Get in touch and let's discuss your celebration.",
      get_in_touch: 'Get In Touch',
      get_in_touch_desc:
        "We're here to help bring your wedding vision to life. Whether you need full-day photography, cinematic film production, or an intimate destination session, we're ready to collaborate.",
      direct_channels: 'Direct Channels',
      studio_location: 'Studio Location',
      location_value: 'Manouba, Tunis, Tunisia',
      social_presence: 'Social & Portfolio',
      form_title: 'Send Us a Message',
      label_couple_names: 'Couple Names *',
      placeholder_couple_names: 'e.g. Sarah & Youssef',
      label_email: 'Email Address *',
      placeholder_email: 'you@example.com',
      label_event_date: 'Event Date',
      label_venue: 'Venue & City',
      placeholder_venue: 'e.g. Carthage, Sidi Bou Said, La Marsa...',
      label_package_interest: 'Package Interest',
      label_notes: 'Tell Us About Your Vision *',
      placeholder_notes:
        'Share your story, timeline, expected guest count, or any specific moments you care most about...',
      submit_btn: 'Send Inquiry',
      submitting_btn: 'Sending...',
      success_title: 'Inquiry Sent Successfully!',
      success_desc:
        'Thank you for reaching out. We will review your celebration date and get back to you within 24 hours.',
      success_btn: 'Send another message',
    },
    footer: {
      tagline: 'EverLens Weddings • Editorial Cinematography & Photography',
      rights: 'All rights reserved.',
    },
    whatsapp: {
      tooltip: 'Chat on WhatsApp',
    },
  },
};

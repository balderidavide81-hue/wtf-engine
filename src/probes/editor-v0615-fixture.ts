import type { ArticleCandidate, ScoutResult } from "../domain/types.js";

export interface EditorProbeItem {
  candidate: ArticleCandidate;
  scout: ScoutResult;
}

export const editorProbeItems: EditorProbeItem[] = [
  {
    candidate: {
      id: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/21/emu-florida-polk-parkway/6991790000125/",
      sourceName: "UPI Odd News",
      sourceUrl: "https://www.upi.com/Odd_News/2026/09/21/emu-florida-polk-parkway/6991790000125/",
      title: "Look: White emu found wandering loose on Florida highway",
      summary: "Florida troopers were summoned to a busy stretch of highway to corral an unusual traffic hazard in the passing lane -- an emu.",
      publishedAt: "Mon, 21 Sep 2026 10:19:01 -0400",
      language: "en", sourceLanguage: "en", country: "US", sourceCountry: "US",
      eventCountry: "US", eventLocation: "Florida", discoverySource: "UPI Odd News"
    },
    scout: {
      articleId: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/21/emu-florida-polk-parkway/6991790000125/",
      decision: "KEEP", modes: ["WTF"],
      scores: { funny: 82, wtf: 88, shareability: 86, internationalAccessibility: 78, verifiability: 90, sensitivity: 5 },
      reason: "An emu in a highway passing lane is instantly visual, harmless and highly playable.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/18/long-island-alligator-holtsville-ecology-center/8451789746179/",
      sourceName: "UPI Odd News",
      sourceUrl: "https://www.upi.com/Odd_News/2026/09/18/long-island-alligator-holtsville-ecology-center/8451789746179/",
      title: "Watch: Alligator found wandering loose at New York nature preserve",
      summary: "Animal rescuers on New York's Long Island responded to a nature preserve to wrangle an alligator that had apparently been abandoned in the wild.",
      publishedAt: "Fri, 18 Sep 2026 11:45:20 -0400",
      language: "en", sourceLanguage: "en", country: "US", sourceCountry: "US",
      eventCountry: "US", eventLocation: "New York", discoverySource: "UPI Odd News"
    },
    scout: {
      articleId: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/18/long-island-alligator-holtsville-ecology-center/8451789746179/",
      decision: "KEEP", modes: ["WTF"],
      scores: { funny: 78, wtf: 84, shareability: 82, internationalAccessibility: 77, verifiability: 88, sensitivity: 12 },
      reason: "An abandoned alligator wandering a New York preserve creates a clear, surprising rescue scenario.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/17/santa-fe-parade-horse-chase/8301789655823/",
      sourceName: "UPI Odd News",
      sourceUrl: "https://www.upi.com/Odd_News/2026/09/17/santa-fe-parade-horse-chase/8301789655823/",
      title: "Watch: Horse escapes New Mexico parade, runs through Santa Fe",
      summary: "Police in New Mexico teamed up with professional cowboys to wrangle a horse that fled while awaiting the start of a parade in Santa Fe.",
      publishedAt: "Thu, 17 Sep 2026 10:40:05 -0400",
      language: "en", sourceLanguage: "en", country: "US", sourceCountry: "US",
      eventCountry: "US", eventLocation: "New Mexico", discoverySource: "UPI Odd News"
    },
    scout: {
      articleId: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/17/santa-fe-parade-horse-chase/8301789655823/",
      decision: "KEEP", modes: ["WTF"],
      scores: { funny: 85, wtf: 86, shareability: 87, internationalAccessibility: 83, verifiability: 88, sensitivity: 8 },
      reason: "A parade horse fleeing into Santa Fe and requiring police and cowboys is excellent visual comedy.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/21/Guinness-World-Records-David-Rush-flipping-cups/2671790001715/",
      sourceName: "UPI Odd News",
      sourceUrl: "https://www.upi.com/Odd_News/2026/09/21/Guinness-World-Records-David-Rush-flipping-cups/2671790001715/",
      title: "Watch: Man flips 10 cups in 6.63 seconds to claim world record",
      summary: "The Idaho man who holds the most Guinness World Records titles said it took five months of practice for him to break a record for flipping cups.",
      publishedAt: "Mon, 21 Sep 2026 10:47:43 -0400",
      language: "en", sourceLanguage: "en", country: "US", sourceCountry: "US",
      discoverySource: "UPI Odd News"
    },
    scout: {
      articleId: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/21/Guinness-World-Records-David-Rush-flipping-cups/2671790001715/",
      decision: "KEEP", modes: ["WTF"],
      scores: { funny: 80, wtf: 83, shareability: 82, internationalAccessibility: 76, verifiability: 94, sensitivity: 2 },
      reason: "Flipping ten cups in 6.63 seconds is an unusually precise and easy-to-quiz record.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/17/guinness-world-records-slim-jim/1191789667547/",
      sourceName: "UPI Odd News",
      sourceUrl: "https://www.upi.com/Odd_News/2026/09/17/guinness-world-records-slim-jim/1191789667547/",
      title: "Watch: Nearly 430-foot Slim Jim breaks world record in Omaha",
      summary: "Conagra Brands unspooled a Slim Jim measuring 429 feet and 5.4 inches long in Nebraska to break the Guinness World Record for the longest meat snack.",
      publishedAt: "Thu, 17 Sep 2026 13:55:33 -0400",
      language: "en", sourceLanguage: "en", country: "US", sourceCountry: "US",
      eventCountry: "US", eventLocation: "Nebraska", discoverySource: "UPI Odd News"
    },
    scout: {
      articleId: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/17/guinness-world-records-slim-jim/1191789667547/",
      decision: "KEEP", modes: ["WTF"],
      scores: { funny: 84, wtf: 86, shareability: 87, internationalAccessibility: 78, verifiability: 94, sensitivity: 3 },
      reason: "A 429-foot meat snack is absurdly tangible and offers a strong visual record challenge.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/16/Guinness-World-Records-salt-and-pepper-packets/9321789579951/",
      sourceName: "UPI Odd News",
      sourceUrl: "https://www.upi.com/Odd_News/2026/09/16/Guinness-World-Records-salt-and-pepper-packets/9321789579951/",
      title: "Watch: Wisconsin woman recaptures world record for salt and pepper collection",
      summary: "A Wisconsin woman reclaimed a Guinness World Records title by amassing a collection of 754 matching pairs of salt and pepper packets.",
      publishedAt: "Wed, 16 Sep 2026 13:35:16 -0400",
      language: "en", sourceLanguage: "en", country: "US", sourceCountry: "US",
      eventCountry: "US", eventLocation: "Wisconsin", discoverySource: "UPI Odd News"
    },
    scout: {
      articleId: "upi-odd-news:https://www.upi.com/Odd_News/2026/09/16/Guinness-World-Records-salt-and-pepper-packets/9321789579951/",
      decision: "KEEP", modes: ["WTF"],
      scores: { funny: 76, wtf: 78, shareability: 76, internationalAccessibility: 70, verifiability: 93, sensitivity: 2 },
      reason: "A record built around 754 matching salt-and-pepper packet pairs is quirky and measurable.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "sciencedaily-strange-offbeat:https://www.sciencedaily.com/releases/2026/09/260917003712.htm",
      sourceName: "ScienceDaily Strange & Offbeat",
      sourceUrl: "https://www.sciencedaily.com/releases/2026/09/260917003712.htm",
      title: "Astronomers just found the youngest known planet ever",
      summary: "Astronomers have confirmed a Jupiter-size planet less than a million years old, making Elias 2-24 b the youngest known planet and giving scientists a rare look at a world still being born. Its surprisingly rapid formation challenges leading theories about how giant planets come together, especially so far from their stars.",
      publishedAt: "Thu, 17 Sep 2026 09:00:19 EDT",
      language: "en", sourceLanguage: "en", country: "GLOBAL", sourceCountry: "GLOBAL",
      discoverySource: "ScienceDaily Strange & Offbeat"
    },
    scout: {
      articleId: "sciencedaily-strange-offbeat:https://www.sciencedaily.com/releases/2026/09/260917003712.htm",
      decision: "KEEP", modes: ["WTF"],
      scores: { funny: 35, wtf: 80, shareability: 70, internationalAccessibility: 72, verifiability: 86, sensitivity: 3 },
      reason: "A planet less than a million years old gives a strong, accessible ‘youngest ever’ discovery hook.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "sciencedaily-strange-offbeat:https://www.sciencedaily.com/releases/2026/09/260919031033.htm",
      sourceName: "ScienceDaily Strange & Offbeat",
      sourceUrl: "https://www.sciencedaily.com/releases/2026/09/260919031033.htm",
      title: "Scientists discover a hidden “ID card” in cat urine",
      summary: "Cats may identify one another through a surprisingly durable chemical “calling card” made from 13 unusual fatty acids in their urine. The compounds appear linked to mysterious fat droplets in the kidneys and may represent a scent-recognition system shared across the cat family.",
      publishedAt: "Sun, 20 Sep 2026 08:24:21 EDT",
      language: "en", sourceLanguage: "en", country: "GLOBAL", sourceCountry: "GLOBAL",
      discoverySource: "ScienceDaily Strange & Offbeat"
    },
    scout: {
      articleId: "sciencedaily-strange-offbeat:https://www.sciencedaily.com/releases/2026/09/260919031033.htm",
      decision: "KEEP", modes: ["WTF"],
      scores: { funny: 72, wtf: 81, shareability: 82, internationalAccessibility: 78, verifiability: 78, sensitivity: 8 },
      reason: "Cats carrying chemical identity cards in urine is surprising, relatable and easy to frame as a quiz.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "sciencedaily-strange-offbeat:https://www.sciencedaily.com/releases/2026/09/260918024816.htm",
      sourceName: "ScienceDaily Strange & Offbeat",
      sourceUrl: "https://www.sciencedaily.com/releases/2026/09/260918024816.htm",
      title: "Scientists just named a new snake after Guns N’ Roses legend Slash",
      summary: "A newly discovered snake from New Guinea has been named after Guns N’ Roses guitarist Slash, who has loved reptiles since childhood. Genetic testing and physical differences confirmed that the reddish-brown groundsnake, Lielaphis slashi, is a species scientists had never formally recognized before. The nonvenomous snake may use large rear teeth to catch slippery lizards and reptile eggs.",
      publishedAt: "Fri, 18 Sep 2026 08:07:03 EDT",
      language: "en", sourceLanguage: "en", country: "GLOBAL", sourceCountry: "GLOBAL",
      discoverySource: "ScienceDaily Strange & Offbeat"
    },
    scout: {
      articleId: "sciencedaily-strange-offbeat:https://www.sciencedaily.com/releases/2026/09/260918024816.htm",
      decision: "KEEP", modes: ["WTF"],
      scores: { funny: 80, wtf: 84, shareability: 86, internationalAccessibility: 78, verifiability: 87, sensitivity: 3 },
      reason: "A newly recognized snake named after Guns N’ Roses’ Slash combines celebrity and unusual biology.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "smithsonian-smart-news:https://www.smithsonianmag.com/smart-news/three-wild-dogs-made-a-record-breaking-trek-across-zambia-traveling-more-than-2500-miles-in-search-of-mates-180989505/",
      sourceName: "Smithsonian Smart News",
      sourceUrl: "https://www.smithsonianmag.com/smart-news/three-wild-dogs-made-a-record-breaking-trek-across-zambia-traveling-more-than-2500-miles-in-search-of-mates-180989505/",
      title: "Three Wild Dogs Made a Record-Breaking Trek Across Zambia, Traveling More Than 2,500 Miles in Search of Mates",
      summary: "The canines achieved the longest recorded movement by any African mammal. Their journey highlights the importance of having protected corridors for wildlife.",
      publishedAt: "Wed, 16 Sep 2026 00:00:00 +0000",
      language: "en", sourceLanguage: "en", country: "GLOBAL", sourceCountry: "GLOBAL",
      eventCountry: "ZM", eventLocation: "Zambia", discoverySource: "Smithsonian Smart News"
    },
    scout: {
      articleId: "smithsonian-smart-news:https://www.smithsonianmag.com/smart-news/three-wild-dogs-made-a-record-breaking-trek-across-zambia-traveling-more-than-2500-miles-in-search-of-mates-180989505/",
      decision: "KEEP", modes: ["WTF", "STORY"],
      scores: { funny: 50, wtf: 79, shareability: 75, internationalAccessibility: 72, verifiability: 85, sensitivity: 8 },
      reason: "Three wild dogs traveling over 2,500 miles in search of mates is an exceptional animal journey.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "motor1-france-insolite:https://fr.motor1.com/news/786091/renault-5-1982-abandonnee-43-ans-retrouvee-encheres/",
      sourceName: "Motor1 France Insolite",
      sourceUrl: "https://fr.motor1.com/news/786091/renault-5-1982-abandonnee-43-ans-retrouvee-encheres/",
      title: "Une Renault 5 de 1982 abandonnée et retrouvée avec seulement 12 km au compteur",
      summary: "Abandonnée durant 43 ans dans un petit local de Saône-et-Loire, cette voiture va être dépoussiérée et vendue aux enchères.",
      publishedAt: "Mon, 02 Feb 2026 12:19:33 +0000",
      language: "fr", sourceLanguage: "fr", country: "FR", sourceCountry: "FR",
      discoverySource: "Motor1 France Insolite", categoryHint: "transport"
    },
    scout: {
      articleId: "motor1-france-insolite:https://fr.motor1.com/news/786091/renault-5-1982-abandonnee-43-ans-retrouvee-encheres/",
      decision: "KEEP", modes: ["WTF", "PREDICT", "STORY"],
      scores: { funny: 72, wtf: 79, shareability: 78, internationalAccessibility: 72, verifiability: 82, sensitivity: 4 },
      reason: "A 43-year-old Renault with only 12 km is a strong time-capsule story with a pending auction outcome.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "smithsonian-smart-news:https://www.smithsonianmag.com/smart-news/a-geologist-in-california-found-something-strange-sticking-out-of-a-creek-reverse-image-search-told-her-it-was-an-ancient-mastodon-tooth-180989504/",
      sourceName: "Smithsonian Smart News",
      sourceUrl: "https://www.smithsonianmag.com/smart-news/a-geologist-in-california-found-something-strange-sticking-out-of-a-creek-reverse-image-search-told-her-it-was-an-ancient-mastodon-tooth-180989504/",
      title: "A Geologist in California Found Something Strange Sticking Out of a Creek. A Reverse Image Search Told Her It Was an Ancient Mastodon Tooth",
      summary: "A geologist surveying a creek in California's San Mateo County found an exceptionally well-preserved Pacific mastodon molar. A reverse image search suggested it was a mastodon tooth, and a paleontologist later confirmed the identification.",
      publishedAt: "Tue, 15 Sep 2026 00:00:00 +0000",
      language: "en", sourceLanguage: "en", country: "GLOBAL", sourceCountry: "GLOBAL",
      eventCountry: "US", eventLocation: "California", discoverySource: "Smithsonian Smart News"
    },
    scout: {
      articleId: "smithsonian-smart-news:https://www.smithsonianmag.com/smart-news/a-geologist-in-california-found-something-strange-sticking-out-of-a-creek-reverse-image-search-told-her-it-was-an-ancient-mastodon-tooth-180989504/",
      decision: "KEEP", modes: ["WTF"],
      scores: { funny: 45, wtf: 76, shareability: 75, internationalAccessibility: 78, verifiability: 86, sensitivity: 8 },
      reason: "Finding an Ice Age mastodon tooth through a creek and reverse-image search has a strong discovery arc.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "smithsonian-smart-news:https://www.smithsonianmag.com/smart-news/princess-dianas-revenge-dress-is-heading-to-auction-for-the-first-time-in-nearly-30-years-180989492/",
      sourceName: "Smithsonian Smart News",
      sourceUrl: "https://www.smithsonianmag.com/smart-news/princess-dianas-revenge-dress-is-heading-to-auction-for-the-first-time-in-nearly-30-years-180989492/",
      title: "Princess Diana's 'Revenge Dress' Is Heading to Auction for the First Time in Nearly 30 Years",
      summary: "Princess Diana wore the iconic strapless black silk dress on the day her then-estranged husband publicly acknowledged his infidelity. Sotheby's is due to offer the dress at its December 9 Luxury Week sale in New York.",
      publishedAt: "Mon, 14 Sep 2026 00:00:00 +0000",
      language: "en", sourceLanguage: "en", country: "GLOBAL", sourceCountry: "GLOBAL",
      discoverySource: "Smithsonian Smart News"
    },
    scout: {
      articleId: "smithsonian-smart-news:https://www.smithsonianmag.com/smart-news/princess-dianas-revenge-dress-is-heading-to-auction-for-the-first-time-in-nearly-30-years-180989492/",
      decision: "KEEP", modes: ["PREDICT", "STORY"],
      scores: { funny: 42, wtf: 70, shareability: 78, internationalAccessibility: 82, verifiability: 88, sensitivity: 28 },
      reason: "The famous dress returning to auction creates a clear, trackable event with strong cultural recognition.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "insideevs-brasil-curiosidades:https://insideevs.uol.com.br/news/807205/noruega-ja-e-quase-eletrica/",
      sourceName: "InsideEVs Brasil Curiosidades",
      sourceUrl: "https://insideevs.uol.com.br/news/807205/noruega-ja-e-quase-eletrica/",
      title: "É possível: 98,7% dos emplacamentos da Noruega são de carros elétricos",
      summary: "País registrou apenas 30 carros a gasolina em agosto, enquanto Volkswagen liderou e Tesla caiu para 7º lugar",
      publishedAt: "Tue, 08 Sep 2026 12:00:00 +0000",
      language: "pt-BR", sourceLanguage: "pt-BR", country: "BR", sourceCountry: "BR",
      eventCountry: "NO", eventLocation: "Noruega", discoverySource: "InsideEVs Brasil Curiosidades", categoryHint: "transport"
    },
    scout: {
      articleId: "insideevs-brasil-curiosidades:https://insideevs.uol.com.br/news/807205/noruega-ja-e-quase-eletrica/",
      decision: "KEEP", modes: ["WTF"],
      scores: { funny: 45, wtf: 75, shareability: 70, internationalAccessibility: 75, verifiability: 86, sensitivity: 2 },
      reason: "Norway recording 98.7% electric-car registrations and only 30 gasoline cars is a clear numerical surprise.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "phys-org-plants-animals:https://phys.org/news/2026-09-bolivia-tilcayo-tiger-cat-wildcat.html",
      sourceName: "Phys.org Plants & Animals",
      sourceUrl: "https://phys.org/news/2026-09-bolivia-tilcayo-tiger-cat-wildcat.html",
      title: "Bolivia's tilcayo tiger cat becomes first new wildcat species in 100 years",
      summary: "Scientists have discovered a new species of wild cat for the first time in more than a century, a Bolivian researcher told AFP on Thursday.",
      publishedAt: "Fri, 18 Sep 2026 02:49:43 EDT",
      language: "en", sourceLanguage: "en", country: "GLOBAL", sourceCountry: "GLOBAL",
      eventCountry: "BO", eventLocation: "Bolivia", discoverySource: "Phys.org Plants & Animals", categoryHint: "animals"
    },
    scout: {
      articleId: "phys-org-plants-animals:https://phys.org/news/2026-09-bolivia-tilcayo-tiger-cat-wildcat.html",
      decision: "KEEP", modes: ["WTF", "STORY"],
      scores: { funny: 38, wtf: 78, shareability: 72, internationalAccessibility: 73, verifiability: 78, sensitivity: 6 },
      reason: "The first newly recognized wildcat species in a century is a strong rarity hook with follow-up potential.",
      evidenceStatus: "SUPPORTED"
    }
  },
  {
    candidate: {
      id: "phys-org-plants-animals:https://phys.org/news/2026-09-species-egg-snake-ethiopia-harenna.html",
      sourceName: "Phys.org Plants & Animals",
      sourceUrl: "https://phys.org/news/2026-09-species-egg-snake-ethiopia-harenna.html",
      title: "New species of egg-eating snake discovered in Ethiopia's Harenna Forest",
      summary: "A new species of snake that feeds exclusively on birds' eggs has been discovered in the Harenna Forest in Ethiopia, one of the last substantial tracts of natural forest left in the Horn of Africa.",
      publishedAt: "Wed, 16 Sep 2026 10:20:12 EDT",
      language: "en", sourceLanguage: "en", country: "GLOBAL", sourceCountry: "GLOBAL",
      eventCountry: "ET", eventLocation: "Ethiopia", discoverySource: "Phys.org Plants & Animals", categoryHint: "animals"
    },
    scout: {
      articleId: "phys-org-plants-animals:https://phys.org/news/2026-09-species-egg-snake-ethiopia-harenna.html",
      decision: "KEEP", modes: ["WTF"],
      scores: { funny: 55, wtf: 78, shareability: 70, internationalAccessibility: 68, verifiability: 82, sensitivity: 7 },
      reason: "A snake that exclusively eats birds’ eggs is distinctive, concrete and naturally quiz-friendly.",
      evidenceStatus: "SUPPORTED"
    }
  }
];

type SupportedContentLanguage = "en" | "it" | "fr" | "es" | "pt-BR" | "id";

interface LanguageRule {
  language: SupportedContentLanguage;
  strong: Set<string>;
  common: Set<string>;
}

const RULES: LanguageRule[] = [
  {
    language: "en",
    strong: new Set(["the","of","with","from","this","that","will","have","has","their","into","over"]),
    common: new Set(["and","to","in","is","are","for","on","a","an","new","can"])
  },
  {
    language: "it",
    strong: new Set(["gli","della","delle","degli","sono","nella","nelle","perché","più","anche","dopo","tra"]),
    common: new Set(["il","lo","la","le","di","e","che","con","un","una","per","nel"])
  },
  {
    language: "fr",
    strong: new Set(["les","des","du","avec","dans","sont","aux","leur","leurs","une","plus","pourquoi"]),
    common: new Set(["le","la","de","et","que","pour","un","en","est","sur"])
  },
  {
    language: "es",
    strong: new Set(["los","las","del","más","cómo","como","una","unos","unas","desde","sobre","entre"]),
    common: new Set(["el","la","de","y","que","con","en","es","son","para","un","por"])
  },
  {
    language: "pt-BR",
    strong: new Set(["do","da","dos","das","com","em","são","uma","mais","não","graças","também"]),
    common: new Set(["o","a","os","as","de","e","que","para","um","por"])
  },
  {
    language: "id",
    strong: new Set(["yang","dan","dari","untuk","dengan","ini","itu","adalah","akan","tidak","bisa","sebagai","pada","juga","karena"]),
    common: new Set(["di","ke","atau","oleh","dalam"])
  }
];

function tokens(value: string): string[] {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase()
    .match(/[\p{L}]+/gu) ?? [];
}

export function detectContentLanguage(
  title: string,
  summary: string | undefined,
  fallback?: string
): string | undefined {
  const material = `${title} ${summary ?? ""}`.trim();
  if (material.length < 40) return fallback;

  const words = tokens(material);
  const scored = RULES.map(rule => {
    let score = 0;
    for (const word of words) {
      if (rule.strong.has(word)) score += 2;
      else if (rule.common.has(word)) score += 1;
    }
    return { language: rule.language, score };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  const second = scored[1];
  if (!best || best.score < 4) return fallback;
  if (second && best.score - second.score < 2) return fallback;
  return best.language;
}

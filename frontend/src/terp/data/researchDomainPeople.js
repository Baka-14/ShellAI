/**
 * Hardcoded illustrative faculty/researcher names by domain (replace with live data later).
 * Shown on **Your courses** when preferences indicate exploring a research area.
 */

/** @typedef {{ name: string, role: string, note?: string }} ResearchPerson */

/** @typedef {{ label: string, people: ResearchPerson[] }} DomainBucket */

/** @type {Record<string, DomainBucket>} */
export const RESEARCH_DOMAIN_PEOPLE = {
  nlp: {
    label: "NLP & language technologies",
    people: [
      { name: "Dr. Marine Carpuat", role: "Professor", note: "Multilingual NLP, semantics" },
      { name: "Dr. Philip Resnik", role: "Professor", note: "Computational psycholinguistics" },
      { name: "Dr. Hal Daumé III", role: "Professor", note: "ML for NLP, fairness" },
    ],
  },
  ml: {
    label: "Machine learning & AI",
    people: [
      { name: "Dr. Tom Goldstein", role: "Professor", note: "Optimization, deep learning" },
      { name: "Dr. Soheil Feizi", role: "Associate Professor", note: "Robustness, generative models" },
      { name: "Dr. John Dickerson", role: "Associate Professor", note: "ML + matching, decision systems" },
    ],
  },
  systems: {
    label: "Systems, security & networking",
    people: [
      { name: "Dr. Dave Levin", role: "Associate Professor", note: "Networks, security" },
      { name: "Dr. Michelle Mazurek", role: "Professor", note: "Usable security" },
      { name: "Dr. Gang Qu", role: "Professor", note: "Hardware security, IoT" },
    ],
  },
  vision: {
    label: "Vision & graphics",
    people: [
      { name: "Dr. Abhinav Shrivastava", role: "Assistant Professor", note: "3D vision, generative models" },
      { name: "Dr. David Jacobs", role: "Professor", note: "Computer vision" },
      { name: "Dr. Amitabh Varshney", role: "Professor", note: "Visualization, VR" },
    ],
  },
  default: {
    label: "Computer science at UMD",
    people: [
      { name: "Dr. Samir Khuller", role: "Professor & Chair", note: "Algorithms; grad affairs" },
      { name: "Dr. Leilani Battle", role: "Assistant Professor", note: "Data visualization, HCI" },
      { name: "Dr. Jordan Boyd-Graber", role: "Associate Professor", note: "NLP, crowdsourcing" },
    ],
  },
};

/**
 * Pick a domain bucket from preferences text (interests, keywords, goal).
 * @param {Record<string, unknown> | null | undefined} preferences
 * @returns {DomainBucket}
 */
export function resolveResearchPeopleBucket(preferences) {
  if (!preferences || typeof preferences !== "object") return RESEARCH_DOMAIN_PEOPLE.default;
  const parts = [];
  try {
    parts.push(JSON.stringify(preferences).toLowerCase());
  } catch {
    return RESEARCH_DOMAIN_PEOPLE.default;
  }
  const blob = parts.join(" ");

  if (/\b(nlp|natural language|linguistics|computational linguistics|transformer|llm)\b/.test(blob)) {
    return RESEARCH_DOMAIN_PEOPLE.nlp;
  }
  if (/\b(machine learning|deep learning|neural network|generative|diffusion|ml ai)\b/.test(blob)) {
    return RESEARCH_DOMAIN_PEOPLE.ml;
  }
  if (/\b(systems|distributed|operating system|network security|cybersecurity|security)\b/.test(blob)) {
    return RESEARCH_DOMAIN_PEOPLE.systems;
  }
  if (/\b(vision|graphics|cv\b|computer vision|rendering|3d)\b/.test(blob)) {
    return RESEARCH_DOMAIN_PEOPLE.vision;
  }
  return RESEARCH_DOMAIN_PEOPLE.default;
}

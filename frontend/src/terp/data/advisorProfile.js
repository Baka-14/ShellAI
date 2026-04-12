/**
 * Target shape for Terp advisor output (matches ElevenLabs agent wrap-up JSON).
 * Used as demo data until the backend passes real `conversation_from_api` / parsed agent text.
 */
export const EXAMPLE_ADVISOR_OUTPUT = {
  profile: {
    program: "MS Data Science",
    year: "1st year",
    gpa: 4.0,
    courses_taken: ["DATA 601", "DATA 602", "DATA 603"],
    num_courses_wanted: 3,
  },
  goal: {
    mode: "research",
    area: "NLP",
    target_professor: "Jordan Boyd-Graber",
    research_experience: "One IEEE publication on self-organizing maps",
    intent: "Get into a lab, paper is bonus",
    gpa_target: null,
    exploring_areas: null,
  },
  constraints: {
    no_early_classes: true,
    preferred_days: null,
    free_days: null,
    other: null,
  },
  personal: {
    hometown: "Hyderabad, India",
    hobbies: ["GPU programming", "competitive coding"],
    clubs: ["Claude Builder Club"],
    social_preference: null,
    other_context: null,
  },
  matching_preferences: {
    looking_for: "research collaborators",
    existing_network: false,
  },
};

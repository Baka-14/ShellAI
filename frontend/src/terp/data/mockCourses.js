/** Mock recommendations with syllabus, alternatives, and seat counts for live UI. */
export const MOCK_COURSES = [
  {
    course: "CMSC 828A",
    title: "Fantastic Ideas in ML",
    prof: "Tom Goldstein",
    rating: 4.6,
    pctA: 68,
    tags: ["Research", "Co-publishes"],
    reason:
      "Prof. Goldstein runs an active ML lab and frequently co-authors with graduate students. 68% A rate. His recent work on diffusion models aligns with your interests.",
    website: "https://www.cs.umd.edu/~tomg/",
    scholar: true,
    building: "IRB 0318",
    times: "TuTh 2:00 – 3:15 PM",
    section: "0101",
    seats: "12 / 35",
    seatsFilled: 12,
    seatsTotal: 35,
    credits: 3,
    syllabusUrl: "https://www.cs.umd.edu/class/fall2025/cmsc828A/",
    syllabusHighlights: [
      "3 major projects + 1 research survey (optional publication track)",
      "Midterm: take-home; Final: open research proposal",
      "Office hours: Tu 3:30–5 PM (IRB 3rd floor)",
    ],
    alternatives: [
      {
        course: "CMSC 726",
        title: "Distributed ML",
        reason: "Similar ML depth with a systems angle; overlaps TuTh afternoon.",
        times: "TuTh 3:30 – 4:45 PM",
      },
      {
        course: "CMSC 764",
        title: "Advanced Topics in ML",
        reason: "Smaller seminar if you want tighter faculty feedback.",
        times: "W 2:00 – 4:50 PM",
      },
    ],
    seniors: [
      { name: "Alex T.", note: "Best ML course at UMD — project-heavy but worth every hour" },
      { name: "Riya S.", note: "Goldstein is brilliant. Office hours are where the real learning happens" },
    ],
    personaInsights: {
      researcher: {
        labRaSpots: 2,
        coPublishes: true,
        recentPapers: [
          { title: "Structured diffusion for low-precision training", venue: "ICLR", year: "2025" },
          { title: "Dataset inference for adversarial robustness", venue: "NeurIPS", year: "2024" },
        ],
        scholarQuery: "Tom Goldstein machine learning UMD",
      },
      closer: {
        estWeeklyHours: 22,
        curveFriendliness: "Moderate — project weight reduces exam variance",
        comboNote: "Pairs with DATA 606 to avoid triple-exam weeks.",
      },
      explorer: {
        branches: ["CS · ML depth", "DATA · methods", "Cross-listed theory"],
        peerPaths: [
          { name: "Jordan L.", chose: "CS", terpMail: "jlordan@terpmail.umd.edu", note: "Started INFO, switched after 422" },
          { name: "Samira K.", chose: "Data Sci", terpMail: "skdata@terpmail.umd.edu", note: "Took 828A-adjacent stats first" },
        ],
      },
    },
  },
  {
    course: "CMSC 723",
    title: "Computational Linguistics",
    prof: "Jordan Boyd-Graber",
    rating: 4.3,
    pctA: 72,
    tags: ["NLP", "Fair grading"],
    reason:
      "Rigorous but fair. 72% A rate with deep modern NLP coverage. Boyd-Graber's lab has open positions. Strong alignment with your NLP interest.",
    website: "https://users.umiacs.umd.edu/~jbg/",
    scholar: true,
    building: "CSI 2120",
    times: "MWF 11:00 – 11:50 AM",
    section: "0101",
    seats: "8 / 30",
    seatsFilled: 8,
    seatsTotal: 30,
    credits: 3,
    syllabusUrl: "https://www.cs.umd.edu/class/fall2025/cmsc723/",
    syllabusHighlights: [
      "Weekly readings + 4 programming assignments (PyTorch)",
      "Group final project; peer review component",
      "Exam: in-class, emphasizes NLP foundations",
    ],
    alternatives: [
      {
        course: "CMSC 726",
        title: "Distributed ML",
        reason: "If you want less linguistics and more scalable training.",
        times: "TuTh 3:30 – 4:45 PM",
      },
      {
        course: "INST 737",
        title: "Applied NLP",
        reason: "Lighter workload; more application-focused than theory.",
        times: "MW 4:00 – 5:15 PM",
      },
    ],
    seniors: [
      { name: "James K.", note: "Challenging, but you learn more about NLP here than anywhere else" },
      { name: "Mei L.", note: "JBG is one of the best in the department — go to office hours" },
    ],
    personaInsights: {
      researcher: {
        labRaSpots: 1,
        coPublishes: true,
        recentPapers: [
          { title: "Quizbowl: The case for incremental testing", venue: "ACL", year: "2024" },
          { title: "Retrieval-augmented models for trivia", venue: "EMNLP", year: "2023" },
        ],
        scholarQuery: "Jordan Boyd-Graber NLP UMD",
      },
      closer: {
        estWeeklyHours: 18,
        curveFriendliness: "High — generous regrade policy",
        comboNote: "Morning MWF slot keeps afternoons free for interview prep.",
      },
      explorer: {
        branches: ["CS · NLP track", "Ling · formal", "INFO · applied text"],
        peerPaths: [
          { name: "Chris P.", chose: "CS + Ling minor", terpMail: "cpnlp@terpmail.umd.edu", note: "Same ‘data vs language’ uncertainty" },
        ],
      },
    },
  },
  {
    course: "DATA 606",
    title: "Statistical Methodology",
    prof: "Minsuk Kahng",
    rating: 4.1,
    pctA: 78,
    tags: ["Structured", "GPA-safe"],
    reason: "78% A rate with positive reviews on clarity. Good Bayesian methods coverage. Balances heavier courses.",
    building: "ESJ 0202",
    times: "TuTh 9:30 – 10:45 AM",
    section: "0101",
    seats: "22 / 40",
    seatsFilled: 22,
    seatsTotal: 40,
    credits: 3,
    syllabusHighlights: [
      "R + Python labs; weekly problem sets",
      "Two midterms: closed-book; cumulative final",
      "Emphasis on credible intervals and hypothesis testing",
    ],
    alternatives: [
      {
        course: "DATA 605",
        title: "Big Data Systems",
        reason: "If you want more engineering and less probability proofs.",
        times: "MW 2:00 – 3:15 PM",
      },
      {
        course: "STAT 601",
        title: "Probability",
        reason: "More theory-heavy; pairs well before 606 if you need foundations.",
        times: "TuTh 11:00 – 12:15 PM",
      },
    ],
    seniors: [{ name: "Priya M.", note: "Very manageable workload. Lectures are clear and well-organized" }],
    personaInsights: {
      researcher: {
        labRaSpots: 0,
        coPublishes: false,
        recentPapers: [{ title: "Interpretable visualization for large embeddings", venue: "VIS", year: "2024" }],
        scholarQuery: "Minsuk Kahng visualization UMD",
      },
      closer: {
        estWeeklyHours: 11,
        curveFriendliness: "Very high — 78% A historically",
        comboNote: "Anchor course for a 4-class GPA lift plan; lowest variance on roster.",
      },
      explorer: {
        branches: ["DATA · core", "STAT · theory bridge", "INFO · analytics"],
        peerPaths: [
          { name: "Maya R.", chose: "INFO → DATA", terpMail: "mrojas@terpmail.umd.edu", note: "Tasted 606 then declared DS" },
        ],
      },
    },
  },
];

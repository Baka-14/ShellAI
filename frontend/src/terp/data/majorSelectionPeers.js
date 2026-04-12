/**
 * Illustrative peers “in this major” when preferences indicate major / selection exploration
 * (undergrad-focused). Fictional @terpmail.umd.edu addresses.
 *
 * @typedef {{ name: string; terpMail: string }} MajorPeer
 * @typedef {{ label: string; peers: MajorPeer[] }} MajorPeerBucket
 */

/** @type {Record<string, MajorPeerBucket>} */
export const MAJOR_SELECTION_PEER_BUCKETS = {
  cs: {
    label: "Computer science",
    peers: [
      { name: "Priya Shah", terpMail: "pshah22@terpmail.umd.edu" },
      { name: "Diego Morales", terpMail: "dmoral15@terpmail.umd.edu" },
      { name: "Emma Lindstrom", terpMail: "elinds8@terpmail.umd.edu" },
    ],
  },
  data: {
    label: "Data science",
    peers: [
      { name: "Noah Brooks", terpMail: "nbrooks9@terpmail.umd.edu" },
      { name: "Zara Haddad", terpMail: "zhaddad4@terpmail.umd.edu" },
      { name: "Chris Ibarra", terpMail: "cibarra31@terpmail.umd.edu" },
    ],
  },
  info: {
    label: "Information science",
    peers: [
      { name: "Taylor Nguyen", terpMail: "tnguyen118@terpmail.umd.edu" },
      { name: "Jordan Blake", terpMail: "jblake7@terpmail.umd.edu" },
      { name: "Sam Okonkwo", terpMail: "sokonkwo2@terpmail.umd.edu" },
    ],
  },
  math: {
    label: "Mathematics",
    peers: [
      { name: "Alex Park", terpMail: "apark44@terpmail.umd.edu" },
      { name: "Riley Chen", terpMail: "rchen19@terpmail.umd.edu" },
      { name: "Casey Ortiz", terpMail: "cortiz6@terpmail.umd.edu" },
    ],
  },
  default: {
    label: "Your focus area",
    peers: [
      { name: "Jamie Foster", terpMail: "jfoster27@terpmail.umd.edu" },
      { name: "Morgan Ellis", terpMail: "mellis14@terpmail.umd.edu" },
      { name: "Riley Patel", terpMail: "rpatel33@terpmail.umd.edu" },
    ],
  },
};

/** @param {string} bucketId */
export function getMajorSelectionPeersBucket(bucketId) {
  const b = MAJOR_SELECTION_PEER_BUCKETS[bucketId];
  return b ?? MAJOR_SELECTION_PEER_BUCKETS.default;
}

export default function Flag({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ borderRadius: size * 0.2, overflow: "hidden", flexShrink: 0 }}>
      <rect x="0" y="0" width="50" height="50" fill="#FFD520" />
      <polygon points="0,0 25,25 50,0" fill="#111" />
      <polygon points="0,50 25,25 50,50" fill="#111" />
      <rect x="50" y="50" width="50" height="50" fill="#FFD520" />
      <polygon points="50,50 75,75 100,50" fill="#111" />
      <polygon points="50,100 75,75 100,100" fill="#111" />
      <rect x="50" y="0" width="50" height="50" fill="#FFF" />
      <rect x="62" y="8" width="26" height="8" fill="#A51C30" rx="1" />
      <rect x="71" y="4" width="8" height="42" fill="#A51C30" rx="1" />
      <circle cx="63" cy="12" r="4" fill="#A51C30" />
      <circle cx="87" cy="12" r="4" fill="#A51C30" />
      <circle cx="75" cy="5" r="4" fill="#A51C30" />
      <circle cx="75" cy="44" r="4" fill="#A51C30" />
      <rect x="0" y="50" width="50" height="50" fill="#FFF" />
      <rect x="12" y="58" width="26" height="8" fill="#A51C30" rx="1" />
      <rect x="21" y="54" width="8" height="42" fill="#A51C30" rx="1" />
      <circle cx="13" cy="62" r="4" fill="#A51C30" />
      <circle cx="37" cy="62" r="4" fill="#A51C30" />
      <circle cx="25" cy="55" r="4" fill="#A51C30" />
      <circle cx="25" cy="94" r="4" fill="#A51C30" />
    </svg>
  );
}

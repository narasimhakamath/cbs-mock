export function IconParties({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c0-3.6 2.9-6.5 5.5-6.5s5.5 2.9 5.5 6.5" strokeLinecap="round" />
      <circle cx="17" cy="8.5" r="2.3" />
      <path d="M15.8 13.7c2 .3 4.7 2.4 4.7 6.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconAccounts({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 9.5h18" />
      <path d="M6 14.5h4" strokeLinecap="round" />
    </svg>
  );
}

export function IconMenu({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" strokeLinecap="round" />
    </svg>
  );
}

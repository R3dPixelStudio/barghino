export function CircuitIcon({ kind }: { kind: 'power' | 'control' | 'energy' }) {
  const paths = {
    power: 'M12 18h40v28H12zM20 10v44m12-44v44m12-44v44M8 28h48M8 36h48',
    control:
      'M18 18h28v28H18zM26 26h12v12H26zM6 25h12m28 0h12M6 39h12m28 0h12M25 6v12m14-12v12M25 46v12m14-12v12',
    energy: 'M9 41h8l7-22 9 28 7-19 6 13h9M9 52h46M12 10h40',
  };
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d={paths[kind]} stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

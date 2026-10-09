export function EnergyFallback() {
  return (
    <div className="energy-fallback" data-testid="energy-fallback" aria-hidden="true">
      <div className="fallback-core">
        <div className="fallback-cap" />
        <div className="fallback-fins" />
        <div className="fallback-cap" />
        <div className="fallback-conductors" />
      </div>
      <div className="fallback-orbit" />
    </div>
  );
}

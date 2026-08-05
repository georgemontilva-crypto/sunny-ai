// Shared dark background for the auth "gatehouse" pages — /signin, /signup,
// /admin/login. Same --noche surface + grain as the hero, but with two
// more contained gold lights instead of three. Rendered as an absolutely
// positioned layer; the parent must be `relative overflow-hidden`.
export default function AuthBackdrop() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="warm-glow warm-glow-drift" style={{ width: 800, height: 800, top: -260, right: -220 }} />
      <div className="warm-glow warm-glow-drift-2" style={{ width: 600, height: 600, bottom: -220, left: -180 }} />
      <div className="hero-grain" />
    </div>
  );
}

import RouteOutlet from '../components/layout/RouteOutlet';

export default function AuthLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <RouteOutlet />
      </div>
    </div>
  );
}

import './App.css';
import AppRoutes from './routes/AppRoutes';
import { usePageTitle } from './hooks/usePageTitle';

function App() {
  usePageTitle();
  return <AppRoutes />;
}

export default App;

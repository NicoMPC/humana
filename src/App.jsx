import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useCurrentUser } from './store/useStore';
import { useSheetsSync } from './hooks/useSheetsSync';
import { AppShell } from './components/layout/AppShell';
import { Toaster, ConfirmDialog } from './components/ui';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import DiagnosticPage from './pages/DiagnosticPage';
import DocumentsPage from './pages/DocumentsPage';
import ProduitsPage from './pages/ProduitsPage';
import ParametresPage from './pages/ParametresPage';
// EquipePage retirée du routage (2 gérantes pour le moment, voir README) :
// import volontairement laissé de côté, le fichier et les actions store
// restent en place pour une réactivation rapide.

function RequireAuth({ children }) {
  const user = useCurrentUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

export default function App() {
  const user = useCurrentUser();
  useSheetsSync();
  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppShell>
                <Routes>
                  <Route index element={<DashboardPage />} />
                  <Route path="clientes" element={<ClientsPage />} />
                  <Route path="clientes/:id" element={<ClientDetailPage />} />
                  <Route path="diagnostic/:id" element={<DiagnosticPage />} />
                  <Route path="documents" element={<DocumentsPage />} />
                  <Route path="produits" element={<ProduitsPage />} />
                  <Route path="parametres" element={<ParametresPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
            </RequireAuth>
          }
        />
      </Routes>
      <Toaster />
      <ConfirmDialog />
    </>
  );
}

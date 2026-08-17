import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { WorkOrdersPage } from './pages/WorkOrders';
import { AssetsPage } from './pages/Assets';
import { PurchaseOrdersPage } from './pages/PurchaseOrders';
import { PreventiveMaintenancePage } from './pages/PreventiveMaintenance';
import { PreventiveMaintenanceDetailPage } from './pages/PreventiveMaintenanceDetail';
import { AssetDetailPage } from './pages/AssetDetailPage';
import { FilesPage } from './pages/Files';
import { ChecklistsPage } from './pages/Checklists';
import { ShiftsPage } from './pages/Shifts';
import { PeoplePage } from './pages/People';
import { AuditLogPage } from './pages/AuditLog';
import { AcceptInvitationPage } from './pages/AcceptInvitation';
import { InventoryPage } from './pages/Inventory';
import { VendorsPage } from './pages/Vendors';
import { VendorDetailPage } from './pages/VendorDetailPage';
import { CustomersPage } from './pages/Customers';
import { Scheduler } from './pages/Scheduler';
import { LoginPage } from './pages/Login';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { ResetPasswordPage } from './pages/ResetPassword';
import { LocationsPage } from './pages/Locations';
import { LocationDetailPage } from './pages/LocationDetailPage';
import { RequestsPage } from './pages/Requests';
import { MetersPage } from './pages/Meters';
import { AnalyticsPage } from './pages/Analytics';
import { RegisterPage } from './pages/Register';
import { PublicRequestPortal } from './pages/PublicRequestPortal';
import { SharedOrders } from './pages/SharedOrders';
import { VendorWorkOrderView } from './pages/VendorWorkOrderView';
import { SettingsPage } from './pages/Settings';
import { SsoCallbackPage } from './pages/SsoCallback';
import { Workflows } from './pages/Settings/Workflows';
import { CreateAssetPage } from './pages/CreateAsset';
import { NotificationsPage } from './pages/Notifications';
import { JoinPage } from './pages/Join';
import { MobileScanner } from './pages/MobileScanner';
import { useThemeStore } from './store/useThemeStore';
import { OfflineSyncProvider } from './contexts/OfflineSyncContext';
import { usePushNotifications } from './hooks/usePushNotifications';
import { PWAUpdateNotification } from './components/PWAUpdateNotification';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function App() {
  const { theme, accentColor } = useThemeStore();
  const { subscribeToPush } = usePushNotifications();

  // Force re-apply theme on initial mount to sync CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Migrate: if the stored accent is still the old blue, upgrade to brand indigo
    const resolvedAccent = accentColor === '217.2 91.2% 59.8%' ? '243 75% 59%' : accentColor;
    document.documentElement.style.setProperty('--primary-raw', resolvedAccent);
    
    // Subscribe to push notifications if logged in
    const token = localStorage.getItem('token');
    if (token) {
        subscribeToPush();
    }
  }, [theme, accentColor, subscribeToPush]);

  return (
    <OfflineSyncProvider>
      <ErrorBoundary>
        <PWAUpdateNotification />
        <BrowserRouter>
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/sso-callback" element={<SsoCallbackPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/report-issue/:orgId" element={<PublicRequestPortal />} />
          <Route path="/vendor-portal/:token" element={<VendorWorkOrderView />} />
          
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/work-orders" element={
              <ProtectedRoute requiredPermission="work-orders.read">
                <WorkOrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/work-orders/:id" element={
              <ProtectedRoute requiredPermission="work-orders.read">
                <WorkOrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/scan" element={<MobileScanner />} />
            <Route path="/pm" element={
              <ProtectedRoute requiredPermission="pm.read">
                <PreventiveMaintenancePage />
              </ProtectedRoute>
            } />
            <Route path="/pm/:id" element={
              <ProtectedRoute requiredPermission="pm.read">
                <PreventiveMaintenanceDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/scheduler" element={
              <ProtectedRoute requiredPermission="pm.read">
                <Scheduler />
              </ProtectedRoute>
            } />
            <Route path="/requests" element={
              <ProtectedRoute requiredPermission="requests.read">
                <RequestsPage />
              </ProtectedRoute>
            } />
            <Route path="/shared" element={<SharedOrders />} />
            <Route path="/locations" element={
              <ProtectedRoute requiredPermission="locations.read">
                <LocationsPage />
              </ProtectedRoute>
            } />
            <Route path="/locations/:id" element={
              <ProtectedRoute requiredPermission="locations.read">
                <LocationDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/assets" element={
              <ProtectedRoute requiredPermission="assets.read">
                <AssetsPage />
              </ProtectedRoute>
            } />
            <Route path="/assets/:id" element={
              <ProtectedRoute requiredPermission="assets.read">
                <AssetDetailPage />
              </ProtectedRoute>
            } />
            
            {/* Protected routes requiring specific permissions */}
            <Route path="/assets/new" element={
              <ProtectedRoute requiredPermission="assets.create">
                <CreateAssetPage />
              </ProtectedRoute>
            } />
            
            <Route path="/inventory" element={
              <ProtectedRoute requiredPermission="parts.read">
                <InventoryPage />
              </ProtectedRoute>
            } />
            <Route path="/meters" element={
              <ProtectedRoute requiredPermission="assets.read">
                <MetersPage />
              </ProtectedRoute>
            } />
            <Route path="/po" element={
              <ProtectedRoute requiredPermission="po.read">
                <PurchaseOrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/vendors" element={
              <ProtectedRoute requiredPermission="vendors.read">
                <VendorsPage />
              </ProtectedRoute>
            } />
            <Route path="/vendors/:id" element={
              <ProtectedRoute requiredPermission="vendors.read">
                <VendorDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute requiredPermission="customers.read">
                <CustomersPage />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute requiredPermission="analytics.view">
                <AnalyticsPage />
              </ProtectedRoute>
            } />
            <Route path="/people" element={
              <ProtectedRoute requiredPermission="users.manage">
                <PeoplePage />
              </ProtectedRoute>
            } />
            <Route path="/shifts" element={<ShiftsPage />} />
            <Route path="/checklists" element={
              <ProtectedRoute requiredPermission="checklists.read">
                <ChecklistsPage />
              </ProtectedRoute>
            } />
            <Route path="/audit" element={
              <ProtectedRoute requiredPermission="users.manage">
                <AuditLogPage />
              </ProtectedRoute>
            } />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            
            <Route path="/settings" element={
              <ProtectedRoute requiredPermission="settings.manage" requiredRole={['ADMINISTRATOR', 'OWNER', 'ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/workflows" element={
              <ProtectedRoute requiredPermission="settings.manage" requiredRole={['ADMINISTRATOR', 'OWNER', 'ADMIN']}>
                <Workflows />
              </ProtectedRoute>
            } />
          </Route>

          {/* Public Onboarding */}
          <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
          <Route path="/join" element={<JoinPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </OfflineSyncProvider>
  );
}

export default App;

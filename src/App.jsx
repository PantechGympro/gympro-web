import { cloneElement, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "./hooks/ThemeContext";
import Layout from "./components/compartido/Layout";
import CargandoPagina from "./components/compartido/CargandoPagina";

// --- PÁGINAS PÚBLICAS ---
import Landing     from "./pages/publico/Landing";
import AuthPage    from "./components/auth/AuthPage";
import RegisterGym from "./pages/publico/RegisterGym";

// ── Carga diferida de páginas (auditoría nov/2026, rendimiento) ─────────────
// Antes las 69 pantallas de TODOS los roles se importaban aquí arriba: quien
// abría el login descargaba también el panel de superadmin, la analítica y el
// punto de venta. Con lazy(), cada pantalla viaja en su propio archivo y solo
// se descarga al entrar a ella. Landing/Login/Registro siguen en el paquete
// inicial: son la primera pintura y comparten la transición animada.
const ForgotPassword           = lazy(() => import("./pages/publico/ForgotPassword"));
const PrivacyPolicy            = lazy(() => import("./pages/publico/PrivacyPolicy"));
const OwnerOnboarding          = lazy(() => import("./pages/owner_gym/OwnerOnboarding"));
const CambiarPasswordInicial   = lazy(() => import("./pages/compartido/CambiarPasswordInicial"));
const OwnerDashboard           = lazy(() => import("./pages/owner_gym/OwnerDashboard"));
const OwnerStaff               = lazy(() => import("./pages/owner_gym/OwnerStaff"));
const OwnerSucursales          = lazy(() => import("./pages/owner_gym/OwnerSucursales"));
const VerificarMiembro         = lazy(() => import("./pages/compartido/VerificarMiembro"));
const OwnerMemberships         = lazy(() => import("./pages/owner_gym/OwnerMemberships"));
const OwnerProfile             = lazy(() => import("./pages/owner_gym/OwnerProfile"));
const OwnerMiPerfil            = lazy(() => import("./pages/owner_gym/OwnerMiPerfil"));
const OwnerReportes            = lazy(() => import("./pages/owner_gym/OwnerReportes"));
const OwnerReportesAutomaticos = lazy(() => import("./pages/owner_gym/OwnerReportesAutomaticos"));
const MiembrosDashboard        = lazy(() => import("./pages/owner_gym/MiembrosDashboard"));
const PagosDashboard           = lazy(() => import("./pages/owner_gym/PagosDashboard"));
const CobrarMembresia          = lazy(() => import("./pages/owner_gym/CobrarMembresia"));
const PointOfSale              = lazy(() => import("./pages/owner_gym/PointOfSale"));
const BackupsDashboard         = lazy(() => import("./pages/owner_gym/BackupsDashboard"));
const OwnerSubscription        = lazy(() => import("./pages/owner_gym/OwnerSubscription"));
const AdminAnalytics           = lazy(() => import("./pages/owner_gym/AdminAnalytics"));
const AnalyticsMapReduce       = lazy(() => import("./pages/owner_gym/AnalyticsMapReduce"));
const AnalyticsKMeans          = lazy(() => import("./pages/owner_gym/AnalyticsKMeans"));
const TrainerKMeans            = lazy(() => import("./pages/entrenador/TrainerKMeans"));
const TrainerRegresion         = lazy(() => import("./pages/entrenador/TrainerRegresion"));
const AnalyticsRegresion       = lazy(() => import("./pages/owner_gym/AnalyticsRegresion"));
const UserDashboard            = lazy(() => import("./pages/miembro/UserDashboard"));
const UserPayments             = lazy(() => import("./pages/miembro/UserPayments"));
const UserProfile              = lazy(() => import("./pages/miembro/UserProfile"));
const UserRoutineCreator       = lazy(() => import("./pages/miembro/UserRoutineCreator"));
const UserBodyProgress         = lazy(() => import("./pages/miembro/UserBodyProgress"));
const UserMealPlan             = lazy(() => import("./pages/miembro/UserMealPlan"));
const UserHealth               = lazy(() => import("./pages/miembro/UserHealth"));
const UserHealthUpdate         = lazy(() => import("./pages/miembro/UserHealthUpdate"));
const UserMembershipRenewal    = lazy(() => import("./pages/miembro/UserMembershipRenewal"));
const UserWeightPrediction     = lazy(() => import("./pages/miembro/UserWeightPrediction"));
const UserTraining             = lazy(() => import("./pages/miembro/UserTraining"));
const UserWorkoutLog           = lazy(() => import("./pages/miembro/UserWorkoutLog"));
const CompleteProfile          = lazy(() => import("./pages/miembro/CompleteProfile"));
const TrainerDashboard         = lazy(() => import("./pages/entrenador/TrainerDashboard"));
const TrainerClients           = lazy(() => import("./pages/entrenador/TrainerClients"));
const TrainerSchedule          = lazy(() => import("./pages/entrenador/TrainerSchedule"));
const TrainerRoutines          = lazy(() => import("./pages/entrenador/TrainerRoutines"));
const TrainerReports           = lazy(() => import("./pages/entrenador/TrainerReports"));
const TrainerMessages          = lazy(() => import("./pages/entrenador/TrainerMessages"));
const TrainerProfile           = lazy(() => import("./pages/entrenador/TrainerProfile"));
const TrainerRequests          = lazy(() => import("./pages/entrenador/TrainerRequests"));
const TrainerDiets             = lazy(() => import("./pages/entrenador/TrainerDiets"));
const ReceptionistDashboard    = lazy(() => import("./pages/recepcionista/ReceptionistDashboard"));
const ReceptionistMembers      = lazy(() => import("./pages/recepcionista/ReceptionistMembers"));
const ReceptionistPayments     = lazy(() => import("./pages/recepcionista/ReceptionistPayments"));
const ReceptionistAppointments = lazy(() => import("./pages/recepcionista/ReceptionistAppointments"));
const ReceptionistMessages     = lazy(() => import("./pages/recepcionista/ReceptionistMessages"));
const ReceptionistTasks        = lazy(() => import("./pages/recepcionista/ReceptionistTasks"));
const ReceptionistCheckin      = lazy(() => import("./pages/recepcionista/ReceptionistCheckin"));
const ReceptionistAnalytics    = lazy(() => import("./pages/recepcionista/ReceptionistAnalytics"));
const ReceptionistDeliveries   = lazy(() => import("./pages/recepcionista/ReceptionistDeliveries"));
const SuperadminDashboard      = lazy(() => import("./pages/superadmin/SuperadminDashboard"));
const SuperadminGimnasios      = lazy(() => import("./pages/superadmin/SuperadminGimnasios"));
const SuperadminSuscripciones  = lazy(() => import("./pages/superadmin/SuperadminSuscripciones"));
const SuperadminPlanes         = lazy(() => import("./pages/superadmin/SuperadminPlanes"));
const SuperadminUsuarios       = lazy(() => import("./pages/superadmin/SuperadminUsuarios"));
const SuperadminBackups        = lazy(() => import("./pages/superadmin/SuperadminBackups"));
const SuperadminAnalytics      = lazy(() => import("./pages/superadmin/SuperadminAnalytics"));
const SuperadminModelos        = lazy(() => import("./pages/superadmin/SuperadminModelos"));
const OwnerPagos               = lazy(() => import("./pages/owner_gym/OwnerPagos"));
const OwnerPerfilPublico       = lazy(() => import("./pages/owner_gym/OwnerPerfilPublico"));
const PagoResultado            = lazy(() => import("./pages/publico/PagoResultado"));

// --- PÁGINAS DE OWNER GYM ---

// --- PÁGINAS DE MIEMBRO ---

// --- PÁGINAS DE ENTRENADOR ---

// --- PÁGINAS DE RECEPCIONISTA ---

// --- PÁGINAS DE SUPERADMIN ---

// Login (AuthPage.jsx) y el wizard de registro (RegisterGym.jsx) usan el
// mismo layout espejado (ver la nota de "Entrada en desvanecido" en ambos
// archivos): el formulario y la imagen intercambian de lado según la
// página. Al navegar entre ellas con react-router, la página vieja se
// desmontaba de golpe (sin animación de salida) y la nueva aparecía con
// su propio fade de entrada -- el corte abrupto en medio se sentía como
// un "recargo de pantalla". Este layout, montado SOLO alrededor de estas
// 3 rutas públicas (no afecta el resto del ruteo de la app), envuelve el
// contenido con AnimatePresence para que la página saliente también haga
// fade-out antes de desmontarse, dando el cross-fade real que se pidió.
function AuthTransitionLayout() {
  const location = useLocation();
  const element = useOutlet();
  return (
    <AnimatePresence mode="wait" initial={false}>
      {element && cloneElement(element, { key: location.pathname })}
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        {/* Respaldo para las rutas sin Layout (públicas); las de panel tienen
            su propio Suspense dentro de Layout para no desmontar la barra lateral. */}
        <Suspense fallback={<CargandoPagina pantallaCompleta />}>
        <Routes>
          {/* 1. RUTAS PÚBLICAS */}
          {/* La comercial (Landing) es ahora "/" -- antes era el login. Vive
              fuera de AuthTransitionLayout (no comparte el cross-fade con
              login/registro, es una página distinta en tono y layout). */}
          <Route path="/" element={<Landing />} />
          <Route element={<AuthTransitionLayout />}>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/register-gym" element={<RegisterGym />} />
          </Route>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          <Route path="/owner/bienvenida" element={<OwnerOnboarding />} />
          {/* SCRUM-224: fuera de cualquier Layout por rol -- aplica a Miembro, Entrenador, Recepcionista y Administrador por igual. */}
          <Route path="/cambiar-password-inicial" element={<CambiarPasswordInicial />} />
          {/* Retorno de las pasarelas de pago (PayPal / Mercado Pago) */}
          <Route path="/pago/exito"     element={<PagoResultado resultado="exito" />} />
          <Route path="/pago/cancelado" element={<PagoResultado resultado="cancelado" />} />

          {/* 2. RUTAS OWNER GYM */}
          <Route element={<Layout role="owner_gym" key="owner_gym" />}>
            <Route path="/owner"               element={<OwnerDashboard />}   />
            <Route path="/owner/members"       element={<MiembrosDashboard />} />
            <Route path="/owner/payments"      element={<PagosDashboard />}   />
            <Route path="/owner/cobrar"        element={<CobrarMembresia />}  />
            <Route path="/owner/pos"           element={<PointOfSale />}      />
            <Route path="/owner/staff"         element={<OwnerStaff />}       />
            <Route path="/owner/sucursales"    element={<OwnerSucursales />}  />
            <Route path="/owner/verificar-sucursal" element={<VerificarMiembro />} />
            <Route path="/owner/memberships"   element={<OwnerMemberships />} />
            <Route path="/owner/profile"       element={<OwnerProfile />}     />
            <Route path="/owner/mi-perfil"     element={<OwnerMiPerfil />}    />
            <Route path="/owner/reportes"      element={<OwnerReportes />}    />
            <Route path="/owner/reportes-automaticos" element={<OwnerReportesAutomaticos />} />
            <Route path="/owner/subscription"  element={<OwnerSubscription />} />
            <Route path="/owner/pagos-online"  element={<OwnerPagos />}       />
            <Route path="/owner/perfil-publico" element={<OwnerPerfilPublico />} />
            <Route path="/owner/backups"       element={<BackupsDashboard />} />
            <Route path="/owner/mapreduce"     element={<AnalyticsMapReduce />} />
            <Route path="/owner/kmeans"        element={<AnalyticsKMeans />}  />
            <Route path="/owner/regresion"     element={<AnalyticsRegresion />} />
            <Route path="/owner/analytics"     element={<AdminAnalytics />}   />
          </Route>

          {/* 3. RUTAS USUARIO (MIEMBRO) */}
          <Route element={<Layout role="user" key="user" />}>
            <Route path="/user/dashboard"    element={<UserDashboard />} />
            <Route path="/user/routine"      element={<UserRoutineCreator />} />
            <Route path="/user/workout-log"  element={<UserWorkoutLog />} />
            <Route path="/user/progress"     element={<UserBodyProgress />} />
            <Route path="/user/prediction"   element={<UserWeightPrediction />} />
            <Route path="/user/body-metrics" element={<UserBodyProgress />} />
            <Route path="/user/meal-plan"    element={<UserMealPlan />} />
            <Route path="/user/nutrition"    element={<UserMealPlan />} />
            <Route path="/user/recipes"      element={<UserMealPlan />} />
            <Route path="/user/health"       element={<UserHealth />} />
            <Route path="/user-health-update" element={<UserHealthUpdate />} />
            <Route path="/user/payments"     element={<UserPayments />} />
            <Route path="/user/renew"        element={<UserMembershipRenewal />} />
            <Route path="/user/profile"      element={<UserProfile />} />
            <Route path="/user/pos"          element={<PointOfSale />} />
            <Route path="/user/training"     element={<UserTraining />} />
            <Route path="/complete-profile"  element={<CompleteProfile />} />
          </Route>

          {/* 4. RUTAS ENTRENADOR */}
          <Route element={<Layout role="trainer" key="trainer" />}>
            <Route path="/trainer-dashboard"         element={<TrainerDashboard />} />
            <Route path="/trainer/clients"           element={<TrainerClients />} />
            <Route path="/trainer/schedule"          element={<TrainerSchedule />} />
            <Route path="/trainer/routines"          element={<TrainerRoutines />} />
            <Route path="/trainer/diets"             element={<TrainerDiets />} />
            <Route path="/trainer/trainer-kmeans"    element={<TrainerKMeans />} />
            <Route path="/trainer/trainer-regresion" element={<TrainerRegresion />} />
            <Route path="/trainer/reports"           element={<TrainerReports />} />
            <Route path="/trainer/profile"           element={<TrainerProfile />} />
            <Route path="/trainer/pos"               element={<PointOfSale />} />
            <Route path="/trainer/requests"          element={<TrainerRequests />} />
            <Route path="/trainer/verificar-sucursal"  element={<VerificarMiembro />} />
            <Route path="/trainer/messages"          element={<TrainerMessages />} />
          </Route>

          {/* 5. RUTAS RECEPCIONISTA */}
          <Route element={<Layout role="receptionist" key="receptionist" />}>
            <Route path="/receptionist-dashboard"    element={<ReceptionistDashboard />} />
            <Route path="/receptionist/checkins"     element={<ReceptionistCheckin />} />
            <Route path="/receptionist/pos"          element={<PointOfSale />} />
            <Route path="/receptionist/appointments" element={<ReceptionistAppointments />} />
            <Route path="/receptionist/payments"     element={<ReceptionistPayments />} />
            <Route path="/receptionist/cobrar"       element={<CobrarMembresia />} />
            <Route path="/receptionist/members"      element={<ReceptionistMembers />} />
            <Route path="/receptionist/verificar-sucursal" element={<VerificarMiembro />} />
            <Route path="/receptionist/messages"     element={<ReceptionistMessages />} />
            <Route path="/receptionist/tasks"        element={<ReceptionistTasks />} />
            <Route path="/receptionist/deliveries"   element={<ReceptionistDeliveries />} />
            <Route path="/receptionist/analytics"    element={<ReceptionistAnalytics />} />
            <Route path="/receptionist/mapreduce"    element={<AnalyticsMapReduce />} />
            <Route path="/receptionist/kmeans"       element={<AnalyticsKMeans />} />
            <Route path="/receptionist/regresion"    element={<AnalyticsRegresion />} />
          </Route>

          {/* 6. RUTAS SUPERADMIN */}
          <Route element={<Layout role="superadmin" key="superadmin" />}>
            <Route path="/superadmin"               element={<SuperadminDashboard />}     />
            <Route path="/superadmin/gimnasios"     element={<SuperadminGimnasios />}     />
            <Route path="/superadmin/suscripciones" element={<SuperadminSuscripciones />} />
            <Route path="/superadmin/planes"        element={<SuperadminPlanes />}        />
            <Route path="/superadmin/usuarios"      element={<SuperadminUsuarios />}      />
            <Route path="/superadmin/backups"       element={<SuperadminBackups />}       />
            <Route path="/superadmin/analytics"     element={<SuperadminAnalytics />}     />
            <Route path="/superadmin/modelos"       element={<SuperadminModelos />}       />
          </Route>

          {/* 7. RUTA 404 */}
          <Route path="*" element={
            <div style={{
              color: 'var(--text-primary)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              background: 'var(--bg-main)',
              textAlign: 'center'
            }}>
              <h1 style={{ fontSize: '72px', marginBottom: '20px' }}>404</h1>
              <p style={{ fontSize: '20px' }}>Página no encontrada</p>
              <a href="/" style={{ marginTop: '20px', color: 'var(--accent)' }}>
                Volver al inicio
              </a>
            </div>
          } />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

import { AppProvider } from './store/AppContext'
import TopBar from './components/layout/TopBar'
import Sidebar from './components/layout/Sidebar'
import LiveGrid from './components/grid/LiveGrid'
import GisMap from './components/map/GisMap'
import ForensicPanel from './components/forensics/ForensicPanel'
import TrajectorySearch from './components/trajectory/TrajectorySearch'
import IncidentLog from './components/incidents/IncidentLog'
import SettingsDrawer from './components/drawers/SettingsDrawer'
import ModelAssignmentDrawer from './components/drawers/ModelAssignmentDrawer'
import AlertModal from './components/alerts/AlertModal'
import ToastStack from './components/alerts/ToastStack'
import { useApp } from './store/AppContext'

function MainContent() {
  const { tab } = useApp()
  switch (tab) {
    case 'grid':
      return <LiveGrid />
    case 'map':
      return <GisMap />
    case 'forensics':
      return <ForensicPanel />
    case 'trajectory':
      return <TrajectorySearch />
    case 'incidents':
      return <IncidentLog />
  }
}

export default function App() {
  return (
    <AppProvider>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-base text-slate-200">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col">
            <MainContent />
          </main>
        </div>

        {/* Overlays */}
        <SettingsDrawer />
        <ModelAssignmentDrawer />
        <AlertModal />
        <ToastStack />
      </div>
    </AppProvider>
  )
}

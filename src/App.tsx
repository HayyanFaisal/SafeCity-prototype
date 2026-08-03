import { AppProvider } from './store/AppContext'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import LiveWall from './components/pages/LiveWall'
import TacticalMap from './components/pages/TacticalMap'
import AnalyticsPage from './components/pages/AnalyticsPage'
import IncidentLog from './components/pages/IncidentLog'
import ModelsConfig from './components/pages/ModelsConfig'
import TrajectorySearch from './components/pages/TrajectorySearch'
import { useApp } from './store/AppContext'

function MainContent() {
  const { tab } = useApp()
  switch (tab) {
    case 'wall':
      return <LiveWall />
    case 'map':
      return <TacticalMap />
    case 'analytics':
      return <AnalyticsPage />
    case 'incidents':
      return <IncidentLog />
    case 'trajectory':
      return <TrajectorySearch />
    case 'models':
      return <ModelsConfig />
    default:
      return <LiveWall />
  }
}

export default function App() {
  return (
    <AppProvider>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-base text-slate-200">
        <TopBar />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar />
          <MainContent />
        </div>
      </div>
    </AppProvider>
  )
}

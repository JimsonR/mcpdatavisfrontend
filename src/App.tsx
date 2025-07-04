import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ChartDemo from './pages/ChartDemo'
import ChartTest from './pages/ChartTest'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import ServerManagement from './pages/ServerManagement'
import Tools from './pages/Tools'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/servers" element={<ServerManagement />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/charts" element={<ChartDemo />} />
          <Route path="/test-charts" element={<ChartTest />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

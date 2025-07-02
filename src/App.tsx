import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Layout from './components/Layout'
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
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

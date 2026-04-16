import { BrowserRouter, Route, Routes } from './lib/router'
import { AppShell } from './components/AppShell'
import { AppDataProvider } from './features/app-data/AppDataProvider'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import './App.css'

function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppDataProvider>
  )
}

export default App

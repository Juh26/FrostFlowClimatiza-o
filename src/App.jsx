import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Store from './pages/Store'
import Services from './pages/Services'
import Profile from './pages/Profile'
import Cart from './pages/Cart'
import MyOrders from './pages/MyOrders'
import MyServices from './pages/MyServices'
import AdminDashboard from './pages/admin/AdminDashboard'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-light">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/store" element={<Store />} />
          <Route path="/services" element={<Services />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/my-services" element={<MyServices />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
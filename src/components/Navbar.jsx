import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { Snowflake, ShoppingBag, Wrench, User, LogOut, ShoppingCart, LayoutDashboard, Menu, X } from 'lucide-react'

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth()
  const { cart } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
    setMobileMenuOpen(false)
  }

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <nav className="fixed top-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
            <Snowflake className="w-8 h-8 text-primary" />
            <span className="font-bold text-xl text-dark hidden sm:block">FrostFlow</span>
            <span className="font-bold text-xl text-dark sm:hidden">FF</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-primary transition-colors">
              Início
            </Link>
            <Link to="/store" className="text-gray-700 hover:text-primary transition-colors flex items-center gap-1">
              <ShoppingBag size={18} />
              Loja
            </Link>
            <Link to="/services" className="text-gray-700 hover:text-primary transition-colors flex items-center gap-1">
              <Wrench size={18} />
              Serviços
            </Link>
            
            {/* Carrinho Desktop */}
            <Link to="/cart" className="text-gray-700 hover:text-primary transition-colors relative">
              <ShoppingCart size={20} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/my-orders" className="text-gray-700 hover:text-primary transition-colors text-sm">
                  Meus Pedidos
                </Link>
                <Link to="/my-services" className="text-gray-700 hover:text-primary transition-colors text-sm">
                  Meus Serviços
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                    <LayoutDashboard size={18} />
                    Admin
                  </Link>
                )}
                <Link to="/profile" className="text-gray-700 hover:text-primary transition-colors flex items-center gap-1">
                  <User size={18} />
                  Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </div>
            ) : (
              <Link to="/profile" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">
                Entrar
              </Link>
            )}
          </div>

          {/* Mobile: Carrinho + Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            <Link to="/cart" className="text-gray-700 hover:text-primary transition-colors relative">
              <ShoppingCart size={22} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 bg-white">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/" 
                onClick={closeMenu}
                className="text-gray-700 hover:text-primary transition-colors px-2 py-2"
              >
                Início
              </Link>
              <Link 
                to="/store" 
                onClick={closeMenu}
                className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2 px-2 py-2"
              >
                <ShoppingBag size={18} /> Loja
              </Link>
              <Link 
                to="/services" 
                onClick={closeMenu}
                className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2 px-2 py-2"
              >
                <Wrench size={18} /> Serviços
              </Link>
              
              {user ? (
                <>
                  <Link 
                    to="/my-orders" 
                    onClick={closeMenu}
                    className="text-gray-700 hover:text-primary transition-colors px-2 py-2"
                  >
                    Meus Pedidos
                  </Link>
                  <Link 
                    to="/my-services" 
                    onClick={closeMenu}
                    className="text-gray-700 hover:text-primary transition-colors px-2 py-2"
                  >
                    Meus Serviços
                  </Link>
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      onClick={closeMenu}
                      className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2 px-2 py-2"
                    >
                      <LayoutDashboard size={18} /> Admin
                    </Link>
                  )}
                  <Link 
                    to="/profile" 
                    onClick={closeMenu}
                    className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2 px-2 py-2"
                  >
                    <User size={18} /> Perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 transition-colors flex items-center gap-2 px-2 py-2 w-full text-left"
                  >
                    <LogOut size={18} /> Sair
                  </button>
                </>
              ) : (
                <Link 
                  to="/profile" 
                  onClick={closeMenu}
                  className="bg-primary text-white px-4 py-2 rounded-lg text-center"
                >
                  Entrar / Cadastrar
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
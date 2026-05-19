import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthForm({ onSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp, signIn } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    
    let success
    if (isLogin) {
      success = await signIn(email, password)
    } else {
      success = await signUp(email, password, fullName)
    }
    
    setLoading(false)
    
    if (success && onSuccess) {
      onSuccess()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-primary">
          {isLogin ? 'Bem-vindo de volta!' : 'Criar conta'}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {isLogin ? 'Faça login para continuar' : 'Cadastre-se para aproveitar'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Seu nome"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="seu@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            'Carregando...'
          ) : isLogin ? (
            <>
              <LogIn size={18} /> Entrar
            </>
          ) : (
            <>
              <UserPlus size={18} /> Cadastrar
            </>
          )}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-primary hover:underline text-sm"
        >
          {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
        </button>
      </div>
    </motion.div>
  )
}
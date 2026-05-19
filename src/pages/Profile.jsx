import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthForm from '../components/AuthForm'
import { User, Camera, Mail, Shield, Calendar, Edit2, Phone, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Profile() {
  const { user, profile, isAdmin, updateAvatar, updateProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' })
  const fileInputRef = useRef(null)

  function handleEdit() {
    setEditForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
      address: profile?.address || ''
    })
    setEditing(true)
  }

  async function handleSaveEdit() {
    const success = await updateProfile(editForm)
    if (success) {
      setEditing(false)
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    
    setUploading(true)
    await updateAvatar(file)
    setUploading(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-light p-4">
        <AuthForm />
      </div>
    )
  }

  return (
    <div className="pt-16 min-h-screen bg-light">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Meu Perfil</h1>
              <p className="opacity-90">Gerencie suas informações</p>
            </div>
            {!editing && profile && (
              <button
                onClick={handleEdit}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <Edit2 size={18} />
              </button>
            )}
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center -mt-12 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            {uploading && <p className="text-sm text-gray-500 mt-2">Enviando...</p>}
          </div>

          {/* Info Cards */}
          <div className="p-6 space-y-4">
            {/* Email (não editável) */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="text-primary" size={20} />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            {/* Nome (editável) */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="text-primary" size={20} />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Nome</p>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border rounded px-2 py-1 mt-1"
                    placeholder="Seu nome"
                  />
                ) : (
                  <p className="font-medium">{profile?.name || 'Não informado'}</p>
                )}
              </div>
            </div>

            {/* Telefone (editável) */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="text-primary" size={20} />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Telefone</p>
                {editing ? (
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full border rounded px-2 py-1 mt-1"
                    placeholder="(00) 00000-0000"
                  />
                ) : (
                  <p className="font-medium">{profile?.phone || 'Não informado'}</p>
                )}
              </div>
            </div>

            {/* Endereço (editável) */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="text-primary" size={20} />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Endereço</p>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full border rounded px-2 py-1 mt-1"
                    placeholder="Seu endereço"
                  />
                ) : (
                  <p className="font-medium">{profile?.address || 'Não informado'}</p>
                )}
              </div>
            </div>

            {/* Tipo de conta */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="text-primary" size={20} />
              <div>
                <p className="text-xs text-gray-500">Tipo de Conta</p>
                <p className="font-medium">{isAdmin ? 'Administrador' : 'Cliente'}</p>
              </div>
            </div>

            {/* ID do usuário */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="text-primary" size={20} />
              <div>
                <p className="text-xs text-gray-500">ID do Usuário</p>
                <p className="font-mono text-sm">{user.id.slice(0, 16)}...</p>
              </div>
            </div>

            {/* Botões de ação quando editando */}
            {editing && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
                >
                  Salvar alterações
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Área Admin */}
            {isAdmin && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <h3 className="font-bold text-primary mb-2">🔧 Área Administrativa</h3>
                <p className="text-sm text-gray-600">
                  Você tem acesso para gerenciar produtos e pedidos.
                </p>
                <button className="mt-3 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
                  Gerenciar Estoque
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
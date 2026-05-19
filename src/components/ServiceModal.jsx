import { useState } from 'react'
import { X, Calendar, Clock, User, Phone, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import Swal from 'sweetalert2'

export default function ServiceModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)

  const services = [
    'Manutenção Corretiva',
    'Limpeza Profunda',
    'Instalação Profissional',
    'Manutenção Preventiva',
    'Recarga de Gás'
  ]

  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Verificar se está logado
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'Faça login',
        text: 'Você precisa estar logado para solicitar um serviço.',
        confirmButtonText: 'Fazer login'
      }).then(() => {
        onClose()
        window.location.href = '/profile'
      })
      setLoading(false)
      return
    }

    // Validar campos obrigatórios
    if (!formData.name || !formData.phone || !formData.service) {
      Swal.fire('Erro', 'Preencha nome, telefone e serviço desejado.', 'error')
      setLoading(false)
      return
    }

    try {
      // Combinar todas as informações em notes
      const fullNotes = `Nome: ${formData.name}\nTelefone: ${formData.phone}\nMensagem: ${formData.message || 'Nenhuma'}`

      // Inserir no Supabase
      const { data, error } = await supabase
        .from('service_requests')
        .insert([
          {
            user_id: user.id,
            service_name: formData.service,
            scheduled_date: formData.date || null,
            scheduled_time: formData.time || null,
            notes: fullNotes,
            status: 'pending'
          }
        ])
        .select()

      if (error) {
        console.error('Erro ao salvar:', error)
        throw new Error(error.message)
      }

      console.log('Solicitação criada com sucesso:', data)

      Swal.fire({
        icon: 'success',
        title: 'Solicitação enviada!',
        text: 'Entraremos em contato em breve.',
        confirmButtonColor: '#3085d6'
      })
      
      // Limpar formulário e fechar modal
      onClose()
      setFormData({
        name: '',
        phone: '',
        service: '',
        date: '',
        time: '',
        message: ''
      })
      
    } catch (error) {
      console.error('Erro detalhado:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: error.message || 'Não foi possível enviar a solicitação. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-primary">Solicitar Serviço</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <User size={16} />
              Nome completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Phone size={16} />
              Telefone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <MessageCircle size={16} />
              Serviço desejado *
            </label>
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="">Selecione um serviço</option>
              {services.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Calendar size={16} />
                Data
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Clock size={16} />
                Horário
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Mensagem adicional
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              placeholder="Informações adicionais sobre o serviço..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Enviando...
              </span>
            ) : (
              'Enviar Solicitação'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
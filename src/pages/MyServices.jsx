import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Wrench, Clock, Calendar } from 'lucide-react'

export default function MyServices() {
  const { user } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchServices()
    }
  }, [user])

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setServices(data)
    }
    setLoading(false)
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const texts = {
      pending: 'Aguardando',
      approved: 'Aprovado',
      in_progress: 'Em andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    }
    return texts[status] || status
  }

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-light flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="pt-16 min-h-screen bg-light">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-dark mb-8">Meus Serviços</h1>
        
        {services.length === 0 ? (
          <div className="text-center py-12">
            <Wrench size={80} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Você ainda não solicitou nenhum serviço.</p>
            <button className="mt-4 bg-primary text-white px-6 py-2 rounded-lg">
              Solicitar serviço
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{service.service_name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(service.status)}`}>
                    {getStatusText(service.status)}
                  </span>
                </div>
                {service.scheduled_date && (
                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                    <Calendar size={14} />
                    {new Date(service.scheduled_date).toLocaleDateString('pt-BR')}
                    {service.scheduled_time && ` às ${service.scheduled_time}`}
                  </p>
                )}
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-2">
                  <Clock size={14} />
                  Solicitado em: {new Date(service.created_at).toLocaleDateString('pt-BR')}
                </p>
                {service.notes && (
                  <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                    {service.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
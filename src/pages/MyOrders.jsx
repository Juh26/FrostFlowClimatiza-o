import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Package, Eye } from 'lucide-react'

export default function MyOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
    }
    setLoading(false)
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const texts = {
      pending: 'Aguardando',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      shipped: 'Enviado',
      delivered: 'Entregue',
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
        <h1 className="text-3xl font-bold text-dark mb-8">Meus Pedidos</h1>
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package size={80} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Você ainda não fez nenhum pedido.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Pedido #{order.order_number}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <p className="font-bold text-primary mt-2">
                      R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <button className="text-primary hover:text-primary/80 text-sm flex items-center gap-1">
                  <Eye size={16} />
                  Ver detalhes
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Package, Calendar, CreditCard, MapPin, Truck, Eye } from 'lucide-react'
import Swal from 'sweetalert2'

export default function OrderDetails() {
  const { orderId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchOrderDetails()
    }
  }, [user, orderId])

  const fetchOrderDetails = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderId)
        .single()

      if (orderError) throw orderError
      setOrder(orderData)

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id)

      if (itemsError) throw itemsError
      setItems(itemsData)

    } catch (error) {
      console.error('Erro:', error)
      Swal.fire('Erro', 'Não foi possível carregar os detalhes do pedido.', 'error')
      navigate('/my-orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      pending: { text: 'Aguardando pagamento', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      confirmed: { text: 'Pagamento confirmado', color: 'bg-blue-100 text-blue-800', icon: '✅' },
      preparing: { text: 'Preparando para envio', color: 'bg-purple-100 text-purple-800', icon: '📦' },
      shipped: { text: 'Enviado', color: 'bg-indigo-100 text-indigo-800', icon: '🚚' },
      delivered: { text: 'Entregue', color: 'bg-green-100 text-green-800', icon: '🏠' },
      cancelled: { text: 'Cancelado', color: 'bg-red-100 text-red-800', icon: '❌' }
    }
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800', icon: '📋' }
  }

  const getPaymentMethodText = (method) => {
    const methodMap = {
      card: 'Cartão de Crédito',
      pix: 'PIX',
      boleto: 'Boleto Bancário'
    }
    return methodMap[method] || method
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getStepIndex(status) {
    const steps = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered']
    const index = steps.indexOf(status)
    return index === -1 ? 0 : index
  }

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-light flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="pt-16 min-h-screen bg-light flex justify-center items-center">
        <div className="text-center">
          <p className="text-gray-500">Pedido não encontrado.</p>
          <button onClick={() => navigate('/my-orders')} className="mt-4 text-primary">Voltar</button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusText(order.status)

  return (
    <div className="pt-16 min-h-screen bg-light">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/my-orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar para meus pedidos
        </button>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-dark">Pedido #{order.order_number}</h1>
              <p className="text-gray-500 mt-1">Realizado em {formatDate(order.created_at)}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${statusInfo.color}`}>
              <span className="mr-1">{statusInfo.icon}</span>
              {statusInfo.text}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Status do pedido</h2>
          <div className="relative">
            <div className="flex justify-between">
              {['pending', 'confirmed', 'preparing', 'shipped', 'delivered'].map((step, index) => {
                const stepStatus = getStatusText(step)
                const isCompleted = getStepIndex(order.status) >= index
                return (
                  <div key={step} className="text-center flex-1">
                    <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${isCompleted ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {isCompleted ? '✓' : stepStatus.icon}
                    </div>
                    <p className="text-xs mt-2 text-gray-600">{stepStatus.text}</p>
                  </div>
                )
              })}
            </div>
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10">
              <div className="h-full bg-primary transition-all" style={{ width: `${(getStepIndex(order.status) / 4) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow mb-6">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Package size={20} className="text-primary" />
              Itens do pedido
            </h2>
          </div>
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="p-6 flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-dark">{item.product_name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Quantidade: {item.quantity} x R$ {item.price.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    R$ {(item.quantity * item.price).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-primary" />
              Endereço de entrega
            </h2>
            <p className="text-gray-600 whitespace-pre-line">{order.shipping_address || 'Endereço não informado'}</p>
            {order.delivery_option === 'pickup' && (
              <p className="text-sm text-green-600 mt-2">✓ Retirada na loja</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-primary" />
              Pagamento e entrega
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Forma de pagamento:</span>
                <span className="font-medium">{getPaymentMethodText(order.payment_method)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status do pagamento:</span>
                <span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.payment_status === 'paid' ? 'Pago' : 'Aguardando pagamento'}
                </span>
              </div>
              {order.delivery_option !== 'pickup' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo de entrega:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Truck size={14} />
                    {order.delivery_option === 'standard' ? 'Normal' : 'Expresso'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <div className="border-b pb-3 mb-3">
            <h2 className="text-lg font-bold">Resumo financeiro</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal dos produtos</span>
              <span>R$ {(order.total - (order.shipping_cost || 0)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Frete</span>
              <span>{order.shipping_cost > 0 ? `R$ ${order.shipping_cost.toFixed(2)}` : 'Grátis'}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="bg-yellow-50 rounded-xl p-4 mt-6 border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Observações:</span> {order.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
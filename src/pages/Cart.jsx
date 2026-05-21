import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react'
import Swal from 'sweetalert2'

export default function Cart() {
  const { cart, total, updateQuantity, removeFromCart, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const generateOrderNumber = () => {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase()
  }

  const handleCheckout = async () => {
    // Verificar se está logado
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'Faça login',
        text: 'Você precisa estar logado para finalizar a compra.',
        confirmButtonText: 'Fazer login'
      }).then(() => {
        navigate('/profile')
      })
      return
    }

    // Verificar se há itens no carrinho
    if (cart.length === 0) {
      Swal.fire('Carrinho vazio', 'Adicione produtos ao carrinho primeiro.', 'warning')
      return
    }

    setLoading(true)

    try {
      const orderNumber = generateOrderNumber()
      
      // 1. Criar o pedido na tabela orders
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          total: total,
          status: 'pending',
          payment_status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (orderError) {
        console.error('Erro ao criar pedido:', orderError)
        throw new Error(orderError.message)
      }

      // 2. Criar os itens do pedido
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Erro ao criar itens:', itemsError)
        throw new Error(itemsError.message)
      }

      // 3. Limpar o carrinho
      clearCart()

      // 4. Mostrar sucesso e redirecionar
      Swal.fire({
        icon: 'success',
        title: 'Pedido realizado!',
        text: `Número do pedido: ${orderNumber}`,
        confirmButtonText: 'Ver meus pedidos'
      }).then(() => {
        navigate('/my-orders')
      })

    } catch (error) {
      console.error('Erro detalhado:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erro ao finalizar',
        text: error.message || 'Não foi possível finalizar o pedido. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="pt-16 min-h-screen bg-light flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <ShoppingBag size={80} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Seu carrinho está vazio</h2>
          <p className="text-gray-500 mb-6">Adicione produtos para continuar comprando</p>
          <button
            onClick={() => navigate('/store')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={18} />
            Ir para loja
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-16 min-h-screen bg-light">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/store')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Continuar comprando
        </button>

        <h1 className="text-3xl font-bold text-dark mb-8">Meu Carrinho</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lista de produtos */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow p-4 flex gap-4 hover:shadow-lg transition-shadow">
                <img 
                  src={item.image_url || 'https://images.unsplash.com/photo-1631049035186-7c7b7e0a4c7a?w=100'} 
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-dark text-lg">{item.name}</h3>
                  {item.brand && <p className="text-sm text-gray-500">Marca: {item.brand}</p>}
                  {item.btus && <p className="text-sm text-gray-500">{item.btus} BTUs</p>}
                  <p className="text-primary font-bold mt-1">
                    R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-4 text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={16} />
                      <span className="text-sm">Remover</span>
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-dark text-lg">
                    R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo do pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-6 sticky top-20">
              <h3 className="text-xl font-bold mb-4 border-b pb-2">Resumo do pedido</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frete</span>
                  <span className="text-green-600">Grátis</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {!user && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                  ⚠️ Faça login para finalizar a compra
                </div>
              )}

          <button
  onClick={() => navigate('/checkout')}
  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all"
>
  Finalizar compra
</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
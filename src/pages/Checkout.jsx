import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { MapPin, Home, Building, Truck, CreditCard, ArrowLeft, Search, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'
import axios from 'axios'

export default function Checkout() {
  const { cart, total, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)

  const [formData, setFormData] = useState({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    residenceType: 'house',
    apartmentNumber: '',
    floor: '',
    fullName: '',
    email: '',
    phone: '',
    deliveryOption: 'standard',
    paymentMethod: 'card',
    notes: ''
  })

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        fullName: user.user_metadata?.full_name || ''
      }))
    }
  }, [user])

  useEffect(() => {
    if (cart.length === 0 && !loading) {
      navigate('/cart')
    }
  }, [cart, navigate, loading])

  const fetchAddressByCep = async () => {
    const cep = formData.cep.replace(/\D/g, '')
    if (cep.length !== 8) {
      Swal.fire('Erro', 'CEP inválido. Digite 8 números.', 'error')
      return
    }

    setLoadingCep(true)
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`)
      if (response.data.erro) {
        Swal.fire('Erro', 'CEP não encontrado.', 'error')
        return
      }

      const data = response.data
      setFormData(prev => ({
        ...prev,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      }))

      Swal.fire('Sucesso', 'Endereço encontrado!', 'success')
    } catch (error) {
      Swal.fire('Erro', 'Não foi possível buscar o CEP.', 'error')
    } finally {
      setLoadingCep(false)
    }
  }

  const calculateShipping = () => {
    const options = {
      standard: { name: 'Normal', price: 15.90, days: 5 },
      express: { name: 'Expresso', price: 29.90, days: 2 },
      pickup: { name: 'Retirar na loja', price: 0, days: 0 }
    }
    return options[formData.deliveryOption]
  }

  const shipping = calculateShipping()
  const finalTotal = total + shipping.price

  const generateOrderNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `ORD-${year}${month}${day}-${random}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validações
    if (!user) {
      Swal.fire({
        icon: 'error',
        title: 'Faça login',
        text: 'Você precisa estar logado para finalizar a compra.',
        confirmButtonText: 'Fazer login'
      }).then(() => {
        navigate('/profile')
      })
      return
    }

    if (!formData.fullName || !formData.phone) {
      Swal.fire('Erro', 'Preencha nome e telefone.', 'error')
      return
    }

    if (formData.deliveryOption !== 'pickup') {
      if (!formData.street || !formData.number || !formData.city) {
        Swal.fire('Erro', 'Preencha o endereço completo.', 'error')
        return
      }
    }

    setLoading(true)

    try {
      const orderNumber = generateOrderNumber()
      
      const fullAddress = formData.deliveryOption === 'pickup' 
        ? 'Retirada na loja - Av. Paulista, 1000, São Paulo - SP'
        : `${formData.street}, ${formData.number}${formData.complement ? `, ${formData.complement}` : ''}, ${formData.neighborhood}, ${formData.city} - ${formData.state}, CEP: ${formData.cep}`

      // 1. Criar o pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          total: finalTotal,
          status: 'pending',
          payment_status: 'pending',
          payment_method: formData.paymentMethod,
          shipping_address: fullAddress,
          delivery_option: formData.deliveryOption,
          shipping_cost: shipping.price,
          notes: formData.notes
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

      // 4. Mostrar SweetAlert com o código do pedido
      await Swal.fire({
        icon: 'success',
        title: '✅ Pedido realizado com sucesso!',
        html: `
          <div style="text-align: center;">
            <p style="font-size: 16px; margin-bottom: 10px;">Seu pedido foi confirmado!</p>
            <div style="background: #f0f0f0; padding: 12px; border-radius: 8px; margin: 15px 0;">
              <strong style="font-size: 14px; color: #666;">CÓDIGO DO PEDIDO</strong><br/>
              <span style="font-size: 20px; font-weight: bold; color: #1e3a5f;">${orderNumber}</span>
            </div>
            <p style="font-size: 14px; color: #666;">Total: <strong style="color: #1e3a5f;">R$ ${finalTotal.toFixed(2)}</strong></p>
            <p style="font-size: 12px; color: #999; margin-top: 15px;">Um email de confirmação foi enviado</p>
          </div>
        `,
        confirmButtonText: '📦 Ver meus pedidos',
        confirmButtonColor: '#1e3a5f',
        showCancelButton: true,
        cancelButtonText: '🏠 Continuar comprando',
        cancelButtonColor: '#666'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/my-orders')
        } else {
          navigate('/store')
        }
      })

    } catch (error) {
      console.error('Erro detalhado:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erro ao finalizar',
        text: error.message || 'Não foi possível finalizar o pedido. Tente novamente.',
        confirmButtonText: 'Tentar novamente'
      })
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0 && !loading) {
    return null
  }

  return (
    <div className="pt-16 min-h-screen bg-light">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar ao carrinho
        </button>

        <h1 className="text-3xl font-bold text-dark mb-8">Finalizar Pedido</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Pessoais */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" />
                  Seus Dados
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome completo *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      required
                      placeholder="Digite seu nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Endereço de Entrega */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-primary" />
                  Endereço de Entrega
                </h2>

                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="house"
                      checked={formData.residenceType === 'house'}
                      onChange={(e) => setFormData({...formData, residenceType: e.target.value})}
                    />
                    <Home size={16} /> Casa
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="apartment"
                      checked={formData.residenceType === 'apartment'}
                      onChange={(e) => setFormData({...formData, residenceType: e.target.value})}
                    />
                    <Building size={16} /> Apartamento
                  </label>
                </div>

                <div className="flex gap-2 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">CEP *</label>
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={(e) => setFormData({...formData, cep: e.target.value})}
                      placeholder="00000-000"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={fetchAddressByCep}
                    disabled={loadingCep}
                    className="mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
                  >
                    {loadingCep ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    Buscar
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Rua *</label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({...formData, street: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Número *</label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData({...formData, number: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Complemento</label>
                    <input
                      type="text"
                      value={formData.complement}
                      onChange={(e) => setFormData({...formData, complement: e.target.value})}
                      placeholder="Apto, Bloco, etc"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {formData.residenceType === 'apartment' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Apartamento</label>
                        <input
                          type="text"
                          value={formData.apartmentNumber}
                          onChange={(e) => setFormData({...formData, apartmentNumber: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                          placeholder="Nº do apto"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Andar</label>
                        <input
                          type="text"
                          value={formData.floor}
                          onChange={(e) => setFormData({...formData, floor: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                          placeholder="Ex: 5º"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Bairro *</label>
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cidade *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Estado *</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      maxLength={2}
                      placeholder="SP"
                    />
                  </div>
                </div>
              </div>

              {/* Opções de Entrega */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Truck size={20} className="text-primary" />
                  Opções de Entrega
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        value="standard"
                        checked={formData.deliveryOption === 'standard'}
                        onChange={(e) => setFormData({...formData, deliveryOption: e.target.value})}
                      />
                      <div>
                        <p className="font-medium">Normal</p>
                        <p className="text-sm text-gray-500">5-7 dias úteis</p>
                      </div>
                    </div>
                    <span className="font-semibold">R$ 15,90</span>
                  </label>
                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        value="express"
                        checked={formData.deliveryOption === 'express'}
                        onChange={(e) => setFormData({...formData, deliveryOption: e.target.value})}
                      />
                      <div>
                        <p className="font-medium">Expresso</p>
                        <p className="text-sm text-gray-500">1-2 dias úteis</p>
                      </div>
                    </div>
                    <span className="font-semibold">R$ 29,90</span>
                  </label>
                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        value="pickup"
                        checked={formData.deliveryOption === 'pickup'}
                        onChange={(e) => setFormData({...formData, deliveryOption: e.target.value})}
                      />
                      <div>
                        <p className="font-medium">Retirar na loja</p>
                        <p className="text-sm text-gray-500">Av. Paulista, 1000 - São Paulo</p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">Grátis</span>
                  </label>
                </div>
              </div>

              {/* Método de Pagamento */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" />
                  Pagamento
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    />
                    <div>
                      <p className="font-medium">Cartão de Crédito</p>
                      <p className="text-sm text-gray-500">Visa, Mastercard, Elo, American Express</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="pix"
                      checked={formData.paymentMethod === 'pix'}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    />
                    <div>
                      <p className="font-medium">PIX</p>
                      <p className="text-sm text-gray-500">Pagamento instantâneo</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="boleto"
                      checked={formData.paymentMethod === 'boleto'}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    />
                    <div>
                      <p className="font-medium">Boleto Bancário</p>
                      <p className="text-sm text-gray-500">Vencimento em 3 dias úteis</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Observações */}
              <div className="bg-white rounded-xl shadow p-6">
                <label className="block text-sm font-medium mb-1">Observações (opcional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Alguma informação adicional sobre o pedido?"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Processando...
                  </span>
                ) : (
                  `Finalizar Pedido - R$ ${finalTotal.toFixed(2)}`
                )}
              </button>
            </form>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-bold mb-4 border-b pb-2">Resumo do Pedido</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name.length > 30 ? item.name.substring(0, 30) + '...' : item.name}</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete ({shipping.name})</span>
                  <span>R$ {shipping.price.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">R$ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
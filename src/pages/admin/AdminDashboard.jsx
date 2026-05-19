import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { Users, Package, Wrench, ShoppingBag, Edit, Trash2, Plus, X, RefreshCw } from 'lucide-react'
import Swal from 'sweetalert2'

export default function AdminDashboard() {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('products')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [usersList, setUsersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', category: '', stock: '', brand: '', btus: '', image_url: ''
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'orders') {
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50)
        if (data) setOrders(data)
      } else if (activeTab === 'products') {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
        if (data) setProducts(data)
      } else if (activeTab === 'services-requests') {
        const { data } = await supabase.from('service_requests').select('*').order('created_at', { ascending: false }).limit(50)
        if (data) setServices(data)
      } else if (activeTab === 'users') {
        const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(50)
        if (data) setUsersList(data)
      }
    } catch (error) {
      console.error('Erro:', error)
    }
    setLoading(false)
  }, [activeTab])

  useEffect(() => {
    if (isAdmin) fetchData()
  }, [activeTab, isAdmin, fetchData])

  // ============================================
  // ABRIR MODAL DE PRODUTO
  // ============================================
  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category || '',
        stock: product.stock || '',
        brand: product.brand || '',
        btus: product.btus || '',
        image_url: product.image_url || ''
      })
    } else {
      setEditingProduct(null)
      setProductForm({ name: '', description: '', price: '', category: '', stock: '', brand: '', btus: '', image_url: '' })
    }
    setShowProductModal(true)
  }

  // ============================================
  // SALVAR PRODUTO (CRIAR/EDITAR)
  // ============================================
  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      Swal.fire('Erro', 'Nome e preço são obrigatórios.', 'error')
      return
    }

    const productData = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      category: productForm.category,
      stock: parseInt(productForm.stock) || 0,
      brand: productForm.brand,
      btus: productForm.btus ? parseInt(productForm.btus) : null,
      image_url: productForm.image_url
    }

    let result
    if (editingProduct) {
      result = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)
    } else {
      result = await supabase
        .from('products')
        .insert([productData])
    }

    if (!result.error) {
      Swal.fire('Sucesso!', editingProduct ? 'Produto atualizado!' : 'Produto criado!', 'success')
      setShowProductModal(false)
      fetchData()
    } else {
      Swal.fire('Erro', 'Não foi possível salvar.', 'error')
      console.error(result.error)
    }
  }

  // ============================================
  // EXCLUIR PRODUTO - CORRIGIDO!
  // ============================================
  const handleDeleteProduct = async (product) => {
    const result = await Swal.fire({
      title: '⚠️ Confirmar exclusão',
      text: `Tem certeza que deseja excluir "${product.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    })
    
    if (result.isConfirmed) {
      try {
        // Mostrar loading
        Swal.fire({
          title: 'Excluindo...',
          text: 'Aguarde um momento',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          }
        })

        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', product.id)

        if (error) {
          throw error
        }

        // Fechar loading e mostrar sucesso
        Swal.fire({
          icon: 'success',
          title: 'Excluído!',
          text: `"${product.name}" foi removido com sucesso.`,
          timer: 2000,
          showConfirmButton: false
        })
        
        // Recarregar lista
        fetchData()
        
      } catch (error) {
        console.error('Erro ao excluir:', error)
        Swal.fire({
          icon: 'error',
          title: 'Erro!',
          text: error.message || 'Não foi possível excluir o produto.'
        })
      }
    }
  }

  // ============================================
  // ATUALIZAR STATUS DO PEDIDO
  // ============================================
  const updateOrderStatus = async (orderId, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
    
    if (!error) {
      Swal.fire('Sucesso', 'Status atualizado!', 'success')
      fetchData()
    } else {
      Swal.fire('Erro', 'Não foi possível atualizar.', 'error')
    }
  }

  // ============================================
  // ATUALIZAR STATUS DO SERVIÇO
  // ============================================
  const updateServiceStatus = async (serviceId, newStatus) => {
    const { error } = await supabase
      .from('service_requests')
      .update({ status: newStatus })
      .eq('id', serviceId)
    
    if (!error) {
      Swal.fire('Sucesso', 'Status atualizado!', 'success')
      fetchData()
    } else {
      Swal.fire('Erro', 'Não foi possível atualizar.', 'error')
    }
  }

  // ============================================
  // TORNAR USUÁRIO ADMIN
  // ============================================
  const toggleAdmin = async (userId, currentIsAdmin) => {
    const { error } = await supabase
      .from('users')
      .update({ is_admin: !currentIsAdmin })
      .eq('user_id', userId)
    
    if (!error) {
      Swal.fire('Sucesso', `Usuário ${!currentIsAdmin ? 'agora é admin' : 'não é mais admin'}!`, 'success')
      fetchData()
    } else {
      Swal.fire('Erro', 'Não foi possível alterar.', 'error')
    }
  }

  if (!isAdmin) {
    return (
      <div className="pt-16 min-h-screen bg-light flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Acesso negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-16 min-h-screen bg-light">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-dark">Painel Administrativo</h1>
          <button onClick={fetchData} className="text-gray-500 hover:text-primary transition-colors">
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { id: 'products', icon: ShoppingBag, label: 'Produtos' },
            { id: 'orders', icon: Package, label: 'Pedidos' },
            { id: 'services-requests', icon: Wrench, label: 'Serviços' },
            { id: 'users', icon: Users, label: 'Usuários' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === tab.id ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
        ) : (
          <>
            {/* ========== PRODUTOS ========== */}
            {activeTab === 'products' && (
              <div>
                <button onClick={() => handleOpenProductModal()} className="mb-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Plus size={18} /> Novo Produto
                </button>
                <div className="bg-white rounded-xl shadow overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">Produto</th>
                        <th className="px-4 py-3 text-left">Preço</th>
                        <th className="px-4 py-3 text-left">Estoque</th>
                        <th className="px-4 py-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.description?.substring(0, 50)}</p>
                          </td>
                          <td className="px-4 py-3 text-primary font-semibold">
                            R$ {product.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3">{product.stock || 0} unid.</td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleOpenProductModal(product)}
                              className="text-blue-500 hover:text-blue-700 mr-3 transition-colors"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========== PEDIDOS ========== */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Pedido</th>
                      <th className="px-4 py-3 text-left">Total</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t">
                        <td className="px-4 py-3 font-mono text-sm">{order.order_number}</td>
                        <td className="px-4 py-3">R$ {order.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="pending">⏳ Aguardando</option>
                            <option value="confirmed">✅ Confirmado</option>
                            <option value="preparing">📦 Preparando</option>
                            <option value="shipped">🚚 Enviado</option>
                            <option value="delivered">🏠 Entregue</option>
                            <option value="cancelled">❌ Cancelado</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ========== SERVIÇOS ========== */}
            {activeTab === 'services-requests' && (
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <p className="font-semibold">{service.service_name}</p>
                        <p className="text-sm text-gray-500 mt-1">{service.notes?.substring(0, 100)}</p>
                      </div>
                      <select
                        value={service.status}
                        onChange={(e) => updateServiceStatus(service.id, e.target.value)}
                        className="border rounded px-3 py-2 text-sm"
                      >
                        <option value="pending">⏳ Aguardando</option>
                        <option value="approved">✅ Aprovado</option>
                        <option value="in_progress">🔄 Em andamento</option>
                        <option value="completed">✔️ Concluído</option>
                        <option value="cancelled">❌ Cancelado</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ========== USUÁRIOS ========== */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Nome</th>
                      <th className="px-4 py-3 text-center">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((user) => (
                      <tr key={user.id} className="border-t">
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">{user.name || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleAdmin(user.user_id, user.is_admin)}
                            className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                              user.is_admin 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {user.is_admin ? 'Admin' : 'Tornar Admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========== MODAL DE PRODUTO ========== */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-primary">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <input type="text" name="name" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preço *</label>
                  <input type="number" step="0.01" name="price" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea name="description" value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} rows={3} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select name="category" value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} className="w-full px-4 py-2 border rounded-lg">
                    <option value="">Selecione</option>
                    <option value="split">Split</option>
                    <option value="portatil">Portátil</option>
                    <option value="central">Central</option>
                    <option value="multi">Multi-split</option>
                    <option value="janela">Janela</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estoque</label>
                  <input type="number" name="stock" value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleSaveProduct} className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90">
                  {editingProduct ? 'Atualizar' : 'Criar'}
                </button>
                <button onClick={() => setShowProductModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
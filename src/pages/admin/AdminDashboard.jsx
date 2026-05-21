import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { Users, Package, Wrench, ShoppingBag, Edit, Trash2, Plus, X, RefreshCw, Upload } from 'lucide-react'
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
  const [uploadingImage, setUploadingImage] = useState(false)
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', category: '', stock: '', brand: '', btus: '', image_url: ''
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'products') {
        const { data } = await supabase.from('products').select('id, name, description, price, category, stock, brand, btus, image_url').order('created_at', { ascending: false }).limit(30)
        if (data) setProducts(data)
      } else if (activeTab === 'orders') {
        const { data } = await supabase.from('orders').select('id, order_number, total, status, created_at').order('created_at', { ascending: false }).limit(30)
        if (data) setOrders(data)
      } else if (activeTab === 'services-requests') {
        const { data } = await supabase.from('service_requests').select('id, service_name, status, notes, created_at').order('created_at', { ascending: false }).limit(30)
        if (data) setServices(data)
      } else if (activeTab === 'users') {
        const { data } = await supabase.from('users').select('id, email, name, is_admin, created_at, user_id').order('created_at', { ascending: false }).limit(30)
        if (data) setUsersList(data)
      }
    } catch (error) { console.error('Erro:', error) }
    setLoading(false)
  }, [activeTab])

  useEffect(() => { if (isAdmin) fetchData() }, [activeTab, isAdmin, fetchData])

  async function handleProductImageUpload(file) {
    if (!file) return null
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) { Swal.fire('Erro', 'Apenas imagens são permitidas.', 'error'); return null }
    if (file.size > 2 * 1024 * 1024) { Swal.fire('Erro', 'A imagem deve ter no máximo 2MB.', 'error'); return null }
    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `product-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file, { cacheControl: '3600', upsert: true })
      if (uploadError) throw new Error(uploadError.message)
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
      return publicUrl
    } catch (error) { Swal.fire('Erro', 'Não foi possível enviar a imagem.', 'error'); return null }
    finally { setUploadingImage(false) }
  }

  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name || '', description: product.description || '', price: product.price || '',
        category: product.category || '', stock: product.stock || '', brand: product.brand || '',
        btus: product.btus || '', image_url: product.image_url || ''
      })
    } else {
      setEditingProduct(null)
      setProductForm({ name: '', description: '', price: '', category: '', stock: '', brand: '', btus: '', image_url: '' })
    }
    setShowProductModal(true)
  }

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) { Swal.fire('Erro', 'Nome e preço são obrigatórios.', 'error'); return }
    const productData = {
      name: productForm.name, description: productForm.description, price: parseFloat(productForm.price),
      category: productForm.category, stock: parseInt(productForm.stock) || 0, brand: productForm.brand,
      btus: productForm.btus ? parseInt(productForm.btus) : null, image_url: productForm.image_url
    }
    let result
    if (editingProduct) result = await supabase.from('products').update(productData).eq('id', editingProduct.id)
    else result = await supabase.from('products').insert([productData])
    if (!result.error) { Swal.fire('Sucesso!', editingProduct ? 'Produto atualizado!' : 'Produto criado!', 'success'); setShowProductModal(false); fetchData() }
    else { Swal.fire('Erro', 'Não foi possível salvar.', 'error'); console.error(result.error) }
  }

  const handleDeleteProduct = async (product) => {
    const result = await Swal.fire({ title: '⚠️ Confirmar exclusão', text: `Excluir "${product.name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sim, excluir!' })
    if (result.isConfirmed) {
      try {
        Swal.fire({ title: 'Excluindo...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })
        const { error } = await supabase.from('products').delete().eq('id', product.id)
        if (error) throw error
        Swal.fire({ icon: 'success', title: 'Excluído!', timer: 1500, showConfirmButton: false })
        fetchData()
      } catch (error) { Swal.fire('Erro!', 'Não foi possível excluir.', 'error') }
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    if (!error) { Swal.fire('Sucesso', 'Status atualizado!', 'success'); fetchData() }
    else Swal.fire('Erro', 'Não foi possível atualizar.', 'error')
  }

  const updateServiceStatus = async (serviceId, newStatus) => {
    const { error } = await supabase.from('service_requests').update({ status: newStatus }).eq('id', serviceId)
    if (!error) { Swal.fire('Sucesso', 'Status atualizado!', 'success'); fetchData() }
    else Swal.fire('Erro', 'Não foi possível atualizar.', 'error')
  }

  const toggleAdmin = async (userId, currentIsAdmin) => {
    const { error } = await supabase.from('users').update({ is_admin: !currentIsAdmin }).eq('user_id', userId)
    if (!error) { Swal.fire('Sucesso', `Usuário ${!currentIsAdmin ? 'agora é admin' : 'não é mais admin'}!`, 'success'); fetchData() }
    else Swal.fire('Erro', 'Não foi possível alterar.', 'error')
  }

  if (!isAdmin) return <div className="pt-16 min-h-screen bg-light flex justify-center items-center"><div className="text-center"><h2 className="text-2xl font-bold text-red-600 mb-2">Acesso negado</h2><p className="text-gray-600">Você não tem permissão.</p></div></div>

  return (
    <div className="pt-16 min-h-screen bg-light">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold text-dark">Painel Administrativo</h1><button onClick={fetchData}><RefreshCw size={20} className="text-gray-500 hover:text-primary" /></button></div>
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { id: 'products', icon: ShoppingBag, label: 'Produtos' },
            { id: 'orders', icon: Package, label: 'Pedidos' },
            { id: 'services-requests', icon: Wrench, label: 'Serviços' },
            { id: 'users', icon: Users, label: 'Usuários' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>
        {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div> : (
          <>
            {activeTab === 'products' && (
              <div><button onClick={() => handleOpenProductModal()} className="mb-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> Novo Produto</button>
              <div className="bg-white rounded-xl shadow overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Produto</th><th className="px-4 py-3 text-left">Preço</th><th className="px-4 py-3 text-left">Estoque</th><th className="px-4 py-3 text-center">Ações</th></tr></thead>
              <tbody>{products.map((product) => (<tr key={product.id} className="border-t hover:bg-gray-50"><td className="px-4 py-3"><div className="flex items-center gap-3">{product.image_url && <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded" />}<div><p className="font-medium">{product.name}</p><p className="text-sm text-gray-500">{product.description?.substring(0, 50)}</p></div></div></td>
              <td className="px-4 py-3 text-primary font-semibold">R$ {product.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td className="px-4 py-3">{product.stock || 0} unid.</td>
              <td className="px-4 py-3 text-center"><button onClick={() => handleOpenProductModal(product)} className="text-blue-500 hover:text-blue-700 mr-3"><Edit size={18} /></button><button onClick={() => handleDeleteProduct(product)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button></td></tr>))}</tbody></table></div></div>)}
            {activeTab === 'orders' && (<div className="bg-white rounded-xl shadow overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Pedido</th><th className="px-4 py-3 text-left">Total</th><th className="px-4 py-3 text-left">Status</th></tr></thead>
            <tbody>{orders.map((order) => (<tr key={order.id} className="border-t"><td className="px-4 py-3 font-mono text-sm">{order.order_number}</td><td className="px-4 py-3">R$ {order.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td className="px-4 py-3"><select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="border rounded px-2 py-1 text-sm"><option value="pending">⏳ Aguardando</option><option value="confirmed">✅ Confirmado</option><option value="preparing">📦 Preparando</option><option value="shipped">🚚 Enviado</option><option value="delivered">🏠 Entregue</option><option value="cancelled">❌ Cancelado</option></select></td></tr>))}</tbody></table></div>)}
            {activeTab === 'services-requests' && (<div className="space-y-4">{services.map((service) => (<div key={service.id} className="bg-white rounded-lg shadow p-4"><div className="flex justify-between items-start flex-wrap gap-4"><div className="flex-1"><p className="font-semibold">{service.service_name}</p><p className="text-sm text-gray-500 mt-1">{service.notes?.substring(0, 100)}</p></div><select value={service.status} onChange={(e) => updateServiceStatus(service.id, e.target.value)} className="border rounded px-3 py-2 text-sm"><option value="pending">⏳ Aguardando</option><option value="approved">✅ Aprovado</option><option value="in_progress">🔄 Em andamento</option><option value="completed">✔️ Concluído</option><option value="cancelled">❌ Cancelado</option></select></div></div>))}</div>)}
            {activeTab === 'users' && (<div className="bg-white rounded-xl shadow overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Nome</th><th className="px-4 py-3 text-center">Admin</th></tr></thead>
            <tbody>{usersList.map((user) => (<tr key={user.id} className="border-t"><td className="px-4 py-3">{user.email}</td><td className="px-4 py-3">{user.name || '-'}</td><td className="px-4 py-3 text-center"><button onClick={() => toggleAdmin(user.user_id, user.is_admin)} className={`px-2 py-1 rounded text-xs font-semibold ${user.is_admin ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{user.is_admin ? 'Admin' : 'Tornar Admin'}</button></td></tr>))}</tbody></table></div>)}
          </>
        )}
      </div>
      {showProductModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-center p-6 border-b"><h2 className="text-2xl font-bold text-primary">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2><button onClick={() => setShowProductModal(false)}><X size={24} /></button></div>
      <div className="p-6 space-y-4"><div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Nome *</label><input type="text" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div><div><label className="block text-sm font-medium mb-1">Preço *</label><input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div></div>
      <div><label className="block text-sm font-medium mb-1">Descrição</label><textarea value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} rows={3} className="w-full px-4 py-2 border rounded-lg" /></div>
      <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Categoria</label><select value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} className="w-full px-4 py-2 border rounded-lg"><option value="">Selecione</option><option value="split">Split</option><option value="portatil">Portátil</option><option value="central">Central</option><option value="multi">Multi-split</option><option value="janela">Janela</option></select></div><div><label className="block text-sm font-medium mb-1">Estoque</label><input type="number" value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} className="w-full px-4 py-2 border rounded-lg" /></div></div>
      <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Marca</label><input type="text" value={productForm.brand} onChange={(e) => setProductForm({...productForm, brand: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: LG" /></div><div><label className="block text-sm font-medium mb-1">BTUs</label><input type="number" value={productForm.btus} onChange={(e) => setProductForm({...productForm, btus: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: 12000" /></div></div>
      <div><label className="block text-sm font-medium mb-1">Imagem</label><div className="flex gap-2"><input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files[0]; if (file) { const url = await handleProductImageUpload(file); if (url) setProductForm({...productForm, image_url: url}); } }} className="flex-1 px-4 py-2 border rounded-lg" />{uploadingImage && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mt-3"></div>}</div>
      {productForm.image_url && <div className="mt-2"><img src={productForm.image_url} alt="Preview" className="w-24 h-24 object-cover rounded" /></div>}
      <input type="text" placeholder="Ou cole a URL da imagem" value={productForm.image_url} onChange={(e) => setProductForm({...productForm, image_url: e.target.value})} className="w-full mt-2 px-4 py-2 border rounded-lg" /></div>
      <div className="flex gap-3 pt-4"><button onClick={handleSaveProduct} className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold">{editingProduct ? 'Atualizar' : 'Criar'}</button><button onClick={() => setShowProductModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg">Cancelar</button></div></div></div></div>)}
    </div>
  )
}
import { useState } from 'react'
import { X, Upload } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

export default function ProductForm({ product, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    btus: product?.btus || '',
    price: product?.price || '',
    stock: product?.stock || '',
    image_url: product?.image_url || ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(product?.image_url || '')

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function uploadImage() {
    if (!imageFile) return formData.image_url

    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `products/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, imageFile)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath)

    return publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = formData.image_url
      if (imageFile) {
        imageUrl = await uploadImage()
      }

      const productData = {
        name: formData.name,
        brand: formData.brand,
        btus: parseInt(formData.btus),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        image_url: imageUrl
      }

      let error
      if (product) {
        // Atualizar
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
        error = updateError
      } else {
        // Criar
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData])
        error = insertError
      }

      if (error) throw error

      toast.success(product ? 'Produto atualizado!' : 'Produto criado!')
      onSuccess()
    } catch (error) {
      toast.error('Erro ao salvar produto')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Produto *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca *
            </label>
            <input
              type="text"
              required
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BTUs *
              </label>
              <input
                type="number"
                required
                value={formData.btus}
                onChange={(e) => setFormData({ ...formData, btus: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estoque *
            </label>
            <input
              type="number"
              required
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagem do Produto
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="mx-auto h-32 w-auto object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview('')
                        setFormData({ ...formData, image_url: '' })
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80">
                        <span>Upload de arquivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG até 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : (product ? 'Atualizar' : 'Criar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
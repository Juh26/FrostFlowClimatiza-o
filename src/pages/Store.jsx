import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { supabase } from '../lib/supabaseClient'

export default function Store() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, selectedCategory, searchTerm])

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setProducts(data)
      // Extrair categorias únicas
      const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))]
      setCategories(uniqueCategories)
    } else {
      console.error('Erro ao buscar produtos:', error)
    }
    setLoading(false)
  }

  function filterProducts() {
    let filtered = [...products]
    
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    setFilteredProducts(filtered)
  }

  return (
    <div className="pt-16 min-h-screen bg-light">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-dark mb-2">Nossa Loja</h1>
          <p className="text-gray-600">Encontre o ar-condicionado perfeito para seu espaço</p>
        </motion.div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'split' ? 'Split' : 
                     category === 'portatil' ? 'Portátil' :
                     category === 'central' ? 'Central' :
                     category === 'multi' ? 'Multi-split' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
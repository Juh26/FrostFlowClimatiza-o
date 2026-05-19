import { ShoppingBag } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import Swal from 'sweetalert2'

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product, 1);
    Swal.fire({
      icon: 'success',
      title: 'Adicionado!',
      text: `${product.name} foi adicionado ao carrinho.`,
      timer: 1500,
      showConfirmButton: false,
      position: 'bottom-end',
      toast: true
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="h-48 overflow-hidden bg-gray-100">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ShoppingBag size={48} />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg text-dark mb-1 line-clamp-2">
          {product.name}
        </h3>
        
        {product.brand && (
          <p className="text-sm text-gray-500 mb-1">Marca: {product.brand}</p>
        )}
        
        {product.btus && (
          <p className="text-sm text-gray-500 mb-2">{product.btus} BTUs</p>
        )}
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-2xl font-bold text-primary">
            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          
          <button
            onClick={handleAddToCart}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <ShoppingBag size={18} />
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
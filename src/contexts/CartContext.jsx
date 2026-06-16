import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import Swal from 'sweetalert2'

const CartContext = createContext({})

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  return useContext(CartContext)
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    // Inicializar com localStorage (evita useEffect desnecessário)
    const savedCart = localStorage.getItem('frostflow_cart')
    return savedCart ? JSON.parse(savedCart) : []
  })
  
  const [total, setTotal] = useState(0)

  // ============================================
  // CALCULAR TOTAL (sem setState dentro do effect)
  // ============================================
  const calculateTotal = useCallback((items) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }, [])

  // ============================================
  // SALVAR NO LOCALSTORAGE E ATUALIZAR TOTAL
  // ============================================
  useEffect(() => {
    localStorage.setItem('frostflow_cart', JSON.stringify(cart))
    setTotal(calculateTotal(cart))
  }, [cart, calculateTotal])

  // ============================================
  // ADICIONAR AO CARRINHO
  // ============================================
  const addToCart = useCallback((product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Adicionado!',
        text: `${product.name} foi adicionado ao carrinho.`,
        timer: 1500,
        showConfirmButton: false,
        position: 'bottom-end',
        toast: true
      })
      
      return [...prevCart, { ...product, quantity }]
    })
  }, [])

  // ============================================
  // REMOVER DO CARRINHO
  // ============================================
  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
    Swal.fire({
      icon: 'info',
      title: 'Removido',
      text: 'Produto removido do carrinho.',
      timer: 1500,
      showConfirmButton: false,
      position: 'bottom-end',
      toast: true
    })
  }, [])

  // ============================================
  // ATUALIZAR QUANTIDADE
  // ============================================
  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }, [removeFromCart])

  // ============================================
  // LIMPAR CARRINHO
  // ============================================
  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  return (
    <CartContext.Provider value={{
      cart,
      total,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  )
}
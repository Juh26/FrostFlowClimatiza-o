import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Swal from 'sweetalert2'

const AuthContext = createContext({})

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // ============================================
  // BUSCAR PERFIL
  // ============================================
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error)
        return null
      }

      if (data) {
        setProfile(data)
        return data
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      return null
    }
  }

  // ============================================
  // INICIALIZAR AUTENTICAÇÃO
  // ============================================
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      setLoading(true)
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mounted) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else if (mounted) {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Erro na autenticação:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return
        
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // ============================================
  // CADASTRO - CORRIGIDO (SEM NO-UNUSED-VARS)
  // ============================================
  async function signUp(email, password, fullName) {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            full_name: fullName
          } 
        }
      })
      
      if (signUpError) {
        if (signUpError.status === 429 || signUpError.message.includes('rate limit')) {
          Swal.fire({
            icon: 'info',
            title: 'Aguarde um momento',
            text: 'Muitas tentativas. Aguarde 1 minuto e tente novamente.',
            confirmButtonText: 'OK'
          })
          return false
        }
        
        if (signUpError.message.includes('User already registered')) {
          Swal.fire({
            icon: 'warning',
            title: 'Email já cadastrado',
            text: 'Faça login ou use outro email.',
            confirmButtonText: 'OK'
          })
          return false
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Erro ao cadastrar',
          text: signUpError.message,
          confirmButtonText: 'OK'
        })
        return false
      }
      
      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            user_id: authData.user.id,
            email: email,
            name: fullName,
            is_admin: email === 'admin@frostflow.com'
          }])

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
        }
      }
      
      Swal.fire({
        icon: 'success',
        title: '✅ Cadastro realizado!',
        text: 'Agora faça login.',
        confirmButtonText: 'OK'
      })
      return true
      
    } catch (error) {
      console.error('Erro:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Falha na conexão. Tente novamente.',
        confirmButtonText: 'OK'
      })
      return false
    }
  }

  // ============================================
  // LOGIN
  // ============================================
  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          Swal.fire({
            icon: 'error',
            title: 'Email ou senha incorretos',
            text: 'Verifique seus dados.',
            confirmButtonText: 'OK'
          })
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erro ao entrar',
            text: error.message,
            confirmButtonText: 'OK'
          })
        }
        return false
      }
      
      if (data?.user) {
        await fetchProfile(data.user.id)
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Bem-vindo!',
        text: `Olá ${data.user.email}!`,
        timer: 2000,
        showConfirmButton: false
      })
      return true
      
    } catch (error) {
      console.error('Erro:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Falha na conexão.',
        confirmButtonText: 'OK'
      })
      return false
    }
  }

  // ============================================
  // LOGOUT
  // ============================================
  async function signOut() {
    try {
      await supabase.auth.signOut()
      setProfile(null)
      setUser(null)
      Swal.fire({
        icon: 'info',
        title: 'Até logo!',
        text: 'Você saiu da conta.',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (error) {
      console.error('Erro ao sair:', error)
    }
  }

  // ============================================
  // ATUALIZAR PERFIL
  // ============================================
  async function updateProfile(updates) {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', user.id)

      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível atualizar o perfil.',
          confirmButtonText: 'OK'
        })
        return false
      }

      setProfile(prev => ({ ...prev, ...updates }))
      Swal.fire({
        icon: 'success',
        title: 'Perfil atualizado!',
        timer: 1500,
        showConfirmButton: false
      })
      return true
      
    } catch (error) {
      console.error('Erro:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Falha na conexão.',
        confirmButtonText: 'OK'
      })
      return false
    }
  }

  // ============================================
  // ATUALIZAR AVATAR
  // ============================================
  async function updateAvatar(file) {
    if (!user) return false
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível enviar a foto.',
          confirmButtonText: 'OK'
        })
        return false
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Erro ao atualizar perfil.',
          confirmButtonText: 'OK'
        })
        return false
      }

      setProfile({ ...profile, avatar_url: publicUrl })
      Swal.fire({
        icon: 'success',
        title: 'Foto atualizada!',
        timer: 1500,
        showConfirmButton: false
      })
      return true
      
    } catch (error) {
      console.error('Erro:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível enviar a foto.',
        confirmButtonText: 'OK'
      })
      return false
    }
  }

  // ============================================
  // VERIFICAR ADMIN
  // ============================================
  const isAdmin = profile?.is_admin === true

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin,
      signUp,
      signIn,
      signOut,
      updateProfile,
      updateAvatar
    }}>
      {children}
    </AuthContext.Provider>
  )
}
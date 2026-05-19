import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Swal from 'sweetalert2'

const AuthContext = createContext({})

// ESSA É A EXPORTAÇÃO CORRETA - NÃO MUDE!
export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    // Ouvir mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // BUSCAR PERFIL
  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (!error && data) {
      setProfile(data)
    } else if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar perfil:', error)
    }
  }

  // CADASTRO
  async function signUp(email, password, fullName) {
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
      if (signUpError.message.includes('rate limit')) {
        Swal.fire('Aguarde', 'Muitas tentativas. Espere 5 minutos.', 'error')
      } else {
        Swal.fire('Erro', signUpError.message, 'error')
      }
      return false
    }
    
    // Criar perfil
    if (authData?.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          user_id: authData.user.id,
          email: email,
          name: fullName,
          is_admin: email === 'admin@frostflow.com' // admin se for esse email
        }])

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError)
        Swal.fire('Aviso', 'Conta criada mas perfil incompleto.', 'warning')
      } else {
        Swal.fire('Sucesso!', 'Cadastro realizado! Faça login.', 'success')
      }
    }
    
    return true
  }

  // LOGIN
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      Swal.fire('Erro', error.message, 'error')
      return false
    }
    
    Swal.fire('Bem-vindo!', `Olá ${data.user.email}!`, 'success')
    return true
  }

  // LOGOUT
  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setUser(null)
    Swal.fire('Até logo!', 'Você saiu da conta.', 'info')
  }

  // ATUALIZAR PERFIL
  async function updateProfile(updates) {
    if (!user) return false

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', user.id)

    if (error) {
      Swal.fire('Erro', 'Não foi possível atualizar o perfil.', 'error')
      return false
    }

    setProfile(prev => ({ ...prev, ...updates }))
    Swal.fire('Sucesso!', 'Perfil atualizado!', 'success')
    return true
  }

  // ATUALIZAR AVATAR
  async function updateAvatar(file) {
    if (!user) return false
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = fileName

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) {
      Swal.fire('Erro', 'Não foi possível enviar a foto.', 'error')
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
      Swal.fire('Erro', 'Erro ao atualizar perfil.', 'error')
      return false
    }

    setProfile({ ...profile, avatar_url: publicUrl })
    Swal.fire('Sucesso!', 'Foto de perfil atualizada!', 'success')
    return true
  }

  const isAdmin = profile?.is_admin === true

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updateAvatar
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
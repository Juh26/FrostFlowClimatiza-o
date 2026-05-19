import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wrench, Droplets, Shield, Clock, CheckCircle } from 'lucide-react'
import ServiceModal from '../components/ServiceModal'
import { supabase } from '../lib/supabaseClient'

export default function Services() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  // Mapeamento de ícones (fallback se não tiver no banco)
  const iconMap = {
    'Wrench': Wrench,
    'Droplets': Droplets,
    'Shield': Shield,
    'Clock': Clock
  }

  useEffect(() => {
    fetchServices()
  }, [])

  async function fetchServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (!error && data && data.length > 0) {
      // Mapear os dados do banco para o formato esperado
      const formattedServices = data.map(service => ({
        id: service.id,
        title: service.title,
        desc: service.description,
        price: `A partir de R$ ${service.price}`,
        icon: iconMap[service.icon_name] || Wrench // fallback
      }))
      setServices(formattedServices)
    } else {
      // Dados fallback se a tabela estiver vazia
      setServices([
        { icon: Wrench, title: 'Manutenção Corretiva', desc: 'Conserto de aparelhos com defeito', price: 'A partir de R$ 150' },
        { icon: Droplets, title: 'Limpeza Profunda', desc: 'Limpeza completa e higienização', price: 'A partir de R$ 120' },
        { icon: Shield, title: 'Instalação', desc: 'Instalação profissional', price: 'A partir de R$ 200' },
        { icon: Clock, title: 'Preventiva', desc: 'Manutenção periódica', price: 'A partir de R$ 100' },
      ])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-light flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="pt-16 min-h-screen bg-light">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold text-dark mb-2">Nossos Serviços</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Oferecemos serviços especializados para garantir o melhor desempenho do seu ar-condicionado
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.map((service, i) => (
            <motion.div
              key={service.id || i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow"
            >
              <service.icon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{service.desc}</p>
              <p className="text-primary font-bold">{service.price}</p>
            </motion.div>
          ))}
        </div>

        {/* Why Choose Us */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">Por que escolher nossos serviços?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              'Técnicos certificados',
              'Garantia de 90 dias',
              'Atendimento rápido',
              'Peças originais',
              'Orçamento sem compromisso',
              'Atendimento 24h'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle size={20} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
          >
            Solicitar Orçamento
          </button>
        </div>
      </div>

      <ServiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
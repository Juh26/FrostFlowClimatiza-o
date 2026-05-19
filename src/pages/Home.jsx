import { motion } from 'framer-motion'
import { Snowflake, Wrench, Truck, Shield, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-secondary text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 animate-float">
            <Snowflake size={80} />
          </div>
          <div className="absolute bottom-20 right-20 animate-float" style={{ animationDelay: '1s' }}>
            <Snowflake size={60} />
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Climatização com <span className="text-secondary">Excelência</span>
            </h1>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Os melhores aparelhos de ar-condicionado e serviços especializados para seu conforto
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/store"
                className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                Comprar Agora <ArrowRight size={18} />
              </Link>
              <Link
                to="/services"
                className="border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all"
              >
                Solicitar Orçamento
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-light">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-dark">
            Por que escolher a <span className="text-primary">FrostFlow</span>?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Snowflake, title: 'Produtos de Alta Qualidade', desc: 'As melhores marcas e tecnologia inverter' },
              { icon: Wrench, title: 'Manutenção Especializada', desc: 'Técnicos certificados e ágeis' },
              { icon: Truck, title: 'Entrega Rápida', desc: 'Instalação em até 24h' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow"
              >
                <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para climatizar seu ambiente?</h2>
          <p className="text-lg mb-6 opacity-90">Entre em contato e solicite um orçamento sem compromisso</p>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Solicitar Orçamento <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
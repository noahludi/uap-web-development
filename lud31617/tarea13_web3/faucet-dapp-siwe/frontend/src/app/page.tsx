import Header from '@/components/Header'
import Faucet from '@/components/Faucet'

export default function Home() {
  return (
    <main className="min-h-dvh">
      <Header />
      <div className="container-app py-6 sm:py-8 space-y-6">
        <section className="card">
          <h1 className="card-title">Conectá tu wallet</h1>
          <p className="muted">Asegurate de estar en Sepolia y de iniciar sesión con SIWE para reclamar.</p>
        </section>

        {/* Tu componente ya arma los 4 paneles; se verá mejor gracias a las clases nuevas */}
        <Faucet />
      </div>
    </main>
  )
}

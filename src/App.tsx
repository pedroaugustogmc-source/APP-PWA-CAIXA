const MEU_GESTOR_URL = 'https://gestor-investimentos-web.vercel.app'

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white mx-auto">
          CC
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Catira Control</h1>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            O Catira Control foi incorporado ao <strong className="text-slate-900">Meu Gestor</strong> — seus dados
            de estoque, fornecedores, plataformas e vendas já estão lá, dentro do módulo Estoque.
          </p>
          <a
            href={MEU_GESTOR_URL}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 active:bg-slate-950"
          >
            Abrir o Meu Gestor
          </a>
        </div>
      </div>
    </div>
  )
}

export default App

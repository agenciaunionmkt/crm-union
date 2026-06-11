export default function PlaceholderPage({ title, description }) {
  return (
    <div>
      <h1 className="text-xl font-normal text-gray-900">{title}</h1>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}

      <div className="mt-6 flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-transparent">
        <p className="text-sm text-gray-400">Em construção — próxima etapa</p>
      </div>
    </div>
  )
}

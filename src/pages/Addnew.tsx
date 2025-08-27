import { createSignal, type Component } from 'solid-js'
import Navbar from "../components/Navbar"
import { invoke } from '@tauri-apps/api/core';

interface Product {
  name: string
  price: number
  quantity: number
  costPrice: number
  brand: string
  material: string
  image: File | null
}

const Addnew: Component = () => {
  const [formData, setFormData] = createSignal<Product>({
    name: '',
    price: 0,
    quantity: 0,
    costPrice: 0,
    brand: '',
    material: '',
    image: null
  })

  // text inputs for prices
  const [priceInput, setPriceInput] = createSignal('')
  const [costPriceInput, setCostPriceInput] = createSignal('')

  const [imagePreview, setImagePreview] = createSignal<string>('')
  const [loading, setLoading] = createSignal(false)
  const [success, setSuccess] = createSignal('')
  const [error, setError] = createSignal('')

  const handleInput = (field: keyof Product, value: string | number | File) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: Event) => {
    const input = e.target as HTMLInputElement
    if (input.files?.[0]) {
      const file = input.files[0]
      handleInput('image', file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleNumberInput = (field: keyof Product, value: string) => {
    const n = parseInt(value, 10)
    if (!isNaN(n)) setFormData(prev => ({ ...prev, [field]: n }))
    else if (value === '') setFormData(prev => ({ ...prev, [field]: 0 }))
  }

  // parse "25.99" or "25,99" -> 25.99
  const parseMoney = (s: string): number | null => {
    const normalized = s.trim().replace(/\s/g, '').replace(',', '.')
    if (normalized === '') return 0
    const n = Number(normalized)
    return Number.isFinite(n) && n >= 0 ? n : null
  }

  const parsedPrice = () => parseMoney(priceInput())
  const parsedCostPrice = () => parseMoney(costPriceInput())

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const price = parsedPrice()
      const costPrice = parsedCostPrice()

      if (price === null || costPrice === null) {
        setError("Veuillez saisir des montants valides pour les prix (ex: 25.99 ou 25,99).")
        return
      }

      // keep formData numbers in sync (optional, nice for preview/consistency)
      setFormData(prev => ({ 
        ...prev, 
        price, 
        costPrice 
      }))

      // image to base64 (if present)
      let imageString: string | null = null
      const currentImage = formData().image
      if (currentImage instanceof File) {
        imageString = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target?.result as string)
          reader.onerror = reject
          reader.readAsDataURL(currentImage)
        })
      }

      const productData = {
        name: formData().name,
        price,
        quantity: formData().quantity,
        costPrice,
        brand: formData().brand,
        material: formData().material,
        image: imageString,
      }

      await invoke('add_product', { product: productData })

      setSuccess('Produit ajouté avec succès!')
      setFormData({
        name: '',
        price: 0,
        quantity: 0,
        costPrice: 0,
        brand: '',
        material: '',
        image: null
      })
      setPriceInput('')
      setCostPriceInput('')
      setImagePreview('')
    } catch (err) {
      setError("Erreur lors de l'ajout du produit: " + err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main class="w-full flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <section class="w-full flex flex-col min-h-screen">
        <Navbar />
        <div class="w-full h-full p-4 md:p-8 overflow-y-auto">
          <h1 class="text-2xl text-left font-semibold mb-6 w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">Nouveau Produit</h1>
          <div class="w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {error() && (
              <div class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error()}
              </div>
            )}
            <p class="text-rose-500 p-1 mb-4">Tous les champs (*) sont obligatoires</p>

            <form onSubmit={handleSubmit} class="grid grid-cols-1 p-4 md:grid-cols-2 gap-6">
              {/* Left Column - Form Inputs */}
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Nom du Produit *</label>
                  <input
                    type="text"
                    required
                    value={formData().name}
                    onInput={(e) => handleInput('name', e.currentTarget.value)}
                    class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Prix de Vente * (TND)</label>
                  <input
                    type="text"
                    inputmode="decimal"
                    placeholder="ex: 25.99 ou 25,99"
                    required
                    value={priceInput()}
                    onInput={(e) => setPriceInput(e.currentTarget.value)}
                    class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Quantité *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData().quantity === 0 ? '' : formData().quantity}
                    onInput={(e) => handleNumberInput('quantity', e.currentTarget.value)}
                    class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Prix d'Achat * (TND)</label>
                  <input
                    type="text"
                    inputmode="decimal"
                    placeholder="ex: 20.50 ou 20,50"
                    required
                    value={costPriceInput()}
                    onInput={(e) => setCostPriceInput(e.currentTarget.value)}
                    class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Marque *</label>
                  <input
                    type="text"
                    required
                    value={formData().brand}
                    onInput={(e) => handleInput('brand', e.currentTarget.value)}
                    class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Matériau *</label>
                  <input
                    type="text"
                    required
                    value={formData().material}
                    onInput={(e) => handleInput('material', e.currentTarget.value)}
                    class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Image *</label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={handleImageUpload}
                    class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Right Column - Preview */}
              <div class="flex flex-col p-4 items-center">
                <h2 class="text-lg font-medium mb-4">Aperçu du Produit</h2>
                <div class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md w-full h-full max-h-96">
                  {imagePreview() ? (
                    <img src={imagePreview()} alt="Preview" class="w-full h-48 object-contain mb-4 rounded-md" />
                  ) : (
                    <div class="w-full h-48 bg-gray-200 dark:bg-gray-600 flex items-center justify-center mb-4 rounded-md">
                      <span class="text-gray-500 dark:text-gray-400">Aucune image</span>
                    </div>
                  )}
                  <div class="space-y-2 text-sm">
                    <h3 class="font-semibold text-center text-lg">{formData().name || "Nom du produit"}</h3>
                    <p><span class="font-medium">Marque:</span> {formData().brand || "Non spécifiée"}</p>
                    <p><span class="font-medium">Matériau:</span> {formData().material || "Non spécifié"}</p>
                    <p>
                      <span class="font-medium">Prix:</span>{" "}
                      {parsedPrice() !== null ? `${parsedPrice()!.toFixed(2)} TND` : "0.00 TND"}
                    </p>
                    <p><span class="font-medium">Quantité:</span> {formData().quantity || 0}</p>
                    <p>
                      <span class="font-medium">Coût:</span>{" "}
                      {parsedCostPrice() !== null ? `${parsedCostPrice()!.toFixed(2)} TND` : "0.00 TND"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div class="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading()}
                  class="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white rounded-md font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {loading() ? 'Traitement...' : 'Ajouter le Produit'}
                </button>
              </div>
            </form>

            {/* Success Modal */}
            {success() && (
              <div class="fixed inset-0 w-full min-h-screen flex flex-col gap-4 items-center justify-center text-center bg-black/50 z-50">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md mx-4">
                  <div class="text-green-500 text-lg font-medium mb-4">
                    {success()}
                  </div>
                  <button 
                    class='bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition-colors'
                    onClick={() => setSuccess('')}
                  >
                    Ok
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default Addnew

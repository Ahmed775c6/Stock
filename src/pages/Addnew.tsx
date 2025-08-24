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

const handleSubmit = async (e: Event) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccess('');

  try {
    // Handle image conversion
    let imageString: string | null = null;
    const currentImage = formData().image;
    
    if (currentImage instanceof File) {
      imageString = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(currentImage);
      });
    }

    // Prepare product data for Rust
    const productData = {
      name: formData().name,
      price: formData().price,
      quantity: formData().quantity,
      costPrice: formData().costPrice,
      brand: formData().brand,
      material: formData().material,
      image: imageString,
    };

    // Call Tauri command
    await invoke('add_product', { product: productData });
    
    setSuccess('Produit ajouté avec succès!');
    setFormData({
      name: '',
      price: 0,
      quantity: 0,
      costPrice: 0,
      brand: '',
      material: '',
      image: null
    });
    setImagePreview('');
  } catch (err) {
    setError("Erreur lors de l'ajout du produit: " + err);
  } finally {
    setLoading(false);
  }
};
  return (
    <main class="w-full flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <section class="w-full flex flex-col min-h-screen">
        <Navbar />
        <div class="w-full h-full p-4 md:p-8 overflow-y-auto">
                  <h1 class="text-xl text-left font-semibold mb-6 w-full p-4 bg-white dark:bg-gray-800 rounded-sm shadow-md">Nouveau Produit</h1>
          <div class="w-full p-4 bg-white dark:bg-gray-900 rounded-sm shadow-md">
                       {error() && (
              <div class="mt-4 p-3 bg-red-100 text-red-700 rounded-sm">
                {error()}
              </div>
            )}
      <p class="text-rose-500 p-1 ">Touts les champs (*) oblegatoire</p>

            <form onSubmit={handleSubmit} class="grid grid-cols-1   p-4  md:grid-cols-2 gap-6">
              {/* Left Column - Form Inputs */}
              <div class="space-y-4  bg-gary-800">
                <div >
                  <label class="block text-sm font-medium mb-1">Nom du Produit *</label>
                  <input
                    type="text"
                    required
                    value={formData().name}
                    onInput={(e) => handleInput('name', e.currentTarget.value)}
                    class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 dark:text-white text-gray-900"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">Prix de Vente * (TND)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData().price}
                    onInput={(e) => handleInput('price', parseFloat(e.currentTarget.value))}
                    class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 dark:text-white text-gray-900"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">Quantité *</label>
                  <input
                    type="number"
                    required
                    value={formData().quantity}
                    onInput={(e) => handleInput('quantity', parseInt(e.currentTarget.value))}
                    class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 dark:text-white text-gray-900"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">Prix d'Achat * (TND)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData().costPrice}
                    onInput={(e) => handleInput('costPrice', parseFloat(e.currentTarget.value))}
                    class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 dark:text-white text-gray-900"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">Marque *</label>
                  <input
                    type="text"
                    required
                    value={formData().brand}
                    onInput={(e) => handleInput('brand', e.currentTarget.value)}
                    class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 dark:text-white text-gray-900"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">Matériau *</label>
                  <input
                    type="text"
                    required
                    value={formData().material}
                    onInput={(e) => handleInput('material', e.currentTarget.value)}
                    class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 dark:text-white text-gray-900"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">Image *</label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={handleImageUpload}
                    class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Right Column - Preview */}
              <div class="flex flex-col   p-4 items-center">
                <h2 class="text-lg font-medium mb-4">Aperçu du Produit</h2>
                <div class="bg-white dark:bg-gray-700 p-4 rounded-sm shadow-md w-full h-full max-h-64">
                  {imagePreview() ? (
                    <img src={imagePreview()} alt="Preview" class="w-full h-full object-contain mb-4" />
                  ) : (
                    <div class="w-full h-48 bg-gray-200 dark:bg-gray-600 flex items-center justify-center mb-4">
                      <span class="text-gray-200">Aucune image</span>
                    </div>
                  )}
                  <div class="space-y-2">
                    <h3 class="font-semibold text-center">{formData().name || "Nom du produit"}</h3>
                    <p>Marque: {formData().brand || "Non spécifiée"}</p>
                    <p>Matériau: {formData().material || "Non spécifié"}</p>
                    <p>Prix: {formData().price ? `${formData().price}€` : "0€"}</p>
                    <p>Quantité: {formData().quantity || 0}</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div class="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading()}
                  class="w-full py-2 px-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white rounded-sm font-medium"
                >
                  {loading() ? 'Traitement...' : 'Ajouter le Produit'}
                </button>
              </div>
            </form>

            {/* Status Messages */}
            {success() && (
       <div class="fixed top-0 w-full min-h-screen flex flex-col gap-3 h-full left-0 z-10 justify-center items-center text-center bg-black/50">
               <div class="mt-4 p-3  text-white rounded-sm">
                {success()}
              </div>
              <button class='bg-emerald-500 hover:bg-emerald-700 transition-all ' onclick={()=>{
                setSuccess('')
              }}>Ok</button>
       </div>
            )}
 
          </div>
        </div>
      </section>
    </main>
  )
}

export default Addnew
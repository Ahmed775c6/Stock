import { createSignal, createResource, Show, Component } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate, useParams } from '@solidjs/router';
import { toast } from 'solid-toast';
import Navbar from '../components/Navbar';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  costPrice: number;
  brand: string;
  material: string;
  image: string | null;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  price: number;
  quantity: number;
  costPrice: number;
  brand: string;
  material: string;
  image: string | null;
}

const ModifyProduct: Component = () => {
  const navigate = useNavigate();
  const params = useParams();
  const productId = (): number => parseInt(params.id, 10);
  console.log(params.id)

  const [formData, setFormData] = createSignal<FormData>({
    name: '',
    price: 0,
    quantity: 0,
    costPrice: 0,
    brand: '',
    material: '',
    image: null,
  });

  const [isSubmitting, setIsSubmitting] = createSignal<boolean>(false);
  const [imageFile, setImageFile] = createSignal<File | null>(null);
  const [imagePreview, setImagePreview] = createSignal<string | null>(null);

  // Fetch product data
  const [product] = createResource<Product | null>(async (): Promise<Product | null> => {
    try {
      const productData = await invoke<Product>('get_product', { id: productId() });
      setFormData({
        name: productData.name,
        price: productData.price,
        quantity: productData.quantity,
        costPrice: productData.costPrice,
        brand: productData.brand,
        material: productData.material,
        image: productData.image,
      });
      if (productData.image) {
        setImagePreview(productData.image);
      }
      return productData;
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Erreur lors du chargement du produit');
      return null;
    }
  });

  const handleInputChange = (field: keyof FormData, value: string | number): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      console.log(imageFile())
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (): void => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: null }));
  };

  const handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare product data for update
      const productData: Product = {
        id: productId(),
        name: formData().name,
        price: formData().price,
        quantity: formData().quantity,
        costPrice: formData().costPrice,
        brand: formData().brand,
        material: formData().material,
        image: imagePreview() || formData().image,
        created_at: product()?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await invoke('update_product', {
        id: productId(),
        product: productData
      });

      toast.success('Produit modifié avec succès');
      navigate('/produits');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Erreur lors de la modification du produit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (): void => {
    navigate('/produits');
  };

  return (
    <main class="w-full flex min-h-screen bg-gray-100 flex-col dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <div class="w-full h-full p-4 md:p-8 overflow-y-auto  ">
         <div class="w-full p-4 bg-gradient-to-r from-gray-300 dark:from-gray-800 dark:to-gray-700 flex justify-between mb-6 rounded-lg shadow-md">
          <h1 class="text-left font-semibold text-lg p-2 text-white">Modifier le Produit</h1>
        </div>

        <div class="flex flex-col lg:flex-row gap-6">
          {/* Left Side - Product Preview */}
          <div class="w-full lg:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Aperçu du Produit</h2>
            
            <div class="mb-6">
              <Show when={imagePreview()} fallback={
                <div class="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <svg class="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              }>
                <img 
                  src={imagePreview()!} 
                  alt="Product preview" 
                  class="w-full h-64 object-contain rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                />
              </Show>
            </div>
            
            <div class="space-y-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">{formData().name}</h3>
                <p class="text-gray-600 dark:text-gray-400">{formData().brand}</p>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">{formData().price.toFixed(2)} TND</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">Prix de revient: {formData().costPrice.toFixed(2)} TND</span>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-300">Matériau: {formData().material}</span>
                <span class={`px-3 py-1 rounded-full text-sm font-medium ${
                  formData().quantity > 0 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {formData().quantity > 0 ? `${formData().quantity} en stock` : 'Rupture de stock'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Edit Form */}
          <div class="w-full lg:w-2/3">
            <Show when={!product.loading} fallback={
              <div class="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            }>
              <form onSubmit={handleSubmit} class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 border border-gray-200 dark:border-gray-700">
                {/* Image Upload Section */}
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image du produit</label>
                  <div class="flex items-center space-x-6">
                    <Show when={imagePreview()}>
                      <div class="relative">
                        <img 
                          src={imagePreview()!} 
                          alt="Preview" 
                          class="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          class="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </Show>
                    <label class="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700 transition-colors">
                      <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span class="mt-2 text-sm text-gray-500 dark:text-gray-400">Ajouter une image</span>
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>

                {/* Product Information */}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom du produit *
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData().name}
                      onInput={(e) => handleInputChange('name', e.currentTarget.value)}
                      class="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Nom du produit"
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label for="brand" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Marque *
                    </label>
                    <input
                      id="brand"
                      type="text"
                      required
                      value={formData().brand}
                      onInput={(e) => handleInputChange('brand', e.currentTarget.value)}
                      class="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Marque"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label for="price" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prix de vente (TND) *
                    </label>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData().price}
                      onInput={(e) => handleInputChange('price', parseFloat(e.currentTarget.value) || 0)}
                      class="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Cost Price */}
                  <div>
                    <label for="costPrice" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prix de revient (TND) *
                    </label>
                    <input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData().costPrice}
                      onInput={(e) => handleInputChange('costPrice', parseFloat(e.currentTarget.value) || 0)}
                      class="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label for="quantity" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantité en stock *
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      min="0"
                      required
                      value={formData().quantity}
                      onInput={(e) => handleInputChange('quantity', parseInt(e.currentTarget.value, 10) || 0)}
                      class="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="0"
                    />
                  </div>

                  {/* Material */}
                  <div>
                    <label for="material" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Matériau *
                    </label>
                    <input
                      id="material"
                      type="text"
                      required
                      value={formData().material}
                      onInput={(e) => handleInputChange('material', e.currentTarget.value)}
                      class="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Matériau"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCancel}
                    class="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                    disabled={isSubmitting()}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting()}
                    class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <Show when={isSubmitting()} fallback="Mettre à jour">
                      <div class="flex items-center space-x-2">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Mise à jour...</span>
                      </div>
                    </Show>
                  </button>
                </div>
              </form>
            </Show>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ModifyProduct;
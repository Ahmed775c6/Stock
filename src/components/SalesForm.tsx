// SaleForm.tsx
import { createSignal, Show, onMount, For } from "solid-js";
import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api/core";

export type Product = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  cost_price: number;
  brand: string;
  material: string;
  image?: string;
};

export type OrderItem = {
  productName: string;
  quantity: number;
  price: number;
  total: number;
};

export type SaleFormData = {
  clientName: string;
  status: string;
  items: OrderItem[];
  date: string;
  totalAmount: number;
};

type SaleFormProps = {
  show: boolean;
  onClose: () => void;
  onSave: (data: SaleFormData) => void;
};

const SaleForm = (props: SaleFormProps) => {
  // Format current date and time for initial value
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [products, setProducts] = createSignal<Product[]>([]);
  const [formData, setFormData] = createStore<SaleFormData>({
    clientName: "",
    status: "",
    items: [],
    date: formatDateTimeLocal(new Date()),
    totalAmount: 0,
  });

  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  // Fetch products on mount
  onMount(async () => {
    try {
      const productsData = await invoke<Product[]>('get_products');
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    }
  });

  const handleInputChange = (field: keyof SaleFormData, value: any) => {
    setFormData(field, value);
    setError(""); // Clear error on input change
  };

  const addProductItem = () => {
    const newItem: OrderItem = {
      productName: "",
      quantity: 1,
      price: 0,
      total: 0
    };
    setFormData('items', [...formData.items, newItem]);
  };

  const removeProductItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const totalAmount = newItems.reduce((total, item) => total + item.total, 0);
    setFormData({ items: newItems, totalAmount });
  };

  const updateProductItem = (index: number, field: keyof OrderItem, value: any) => {
    if (field === 'quantity') {
      // Allow empty string for better UX during editing
      if (value === '') {
        setFormData('items', index, {
          [field]: 0,
          total: 0
        });
      } else {
        const numericValue = parseInt(value) || 0;
        const newTotal = formData.items[index].price * numericValue;
        setFormData('items', index, {
          [field]: numericValue,
          total: newTotal
        });
      }
    } else {
      setFormData('items', index, field, value);
      
      // If product name changes, update the price and total
      if (field === 'productName') {
        const selectedProduct = products().find(p => p.name === value);
        if (selectedProduct) {
          const newTotal = selectedProduct.price * formData.items[index].quantity;
          setFormData('items', index, {
            price: selectedProduct.price,
            total: newTotal
          });
        }
      }
    }
    
    // Update total amount
    const totalAmount = formData.items.reduce((total, item) => total + item.total, 0);
    setFormData('totalAmount', totalAmount);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Validate all items before submitting
      for (const item of formData.items) {
        if (!item.productName) {
          throw new Error("Veuillez sélectionner un produit pour tous les articles");
        }
        
        if (item.quantity <= 0) {
          throw new Error("La quantité doit être supérieure à zéro pour tous les articles");
        }
        
        // Check if product has sufficient quantity
        const product = products().find(p => p.name === item.productName);
        if (product && item.quantity > product.quantity) {
          throw new Error(`Quantité insuffisante pour "${product.name}". Disponible: ${product.quantity}, Demandée: ${item.quantity}`);
        }
      }

      // Save each product item as a separate order
      for (const item of formData.items) {
        const orderData = {
          clientName: formData.clientName,
          status: formData.status,
          productName: item.productName,
          date: formData.date,
          quantity: item.quantity,
        };

        console.log("Saving order:", orderData);
        
        await invoke('save_order', {
          order: {
            client_name: orderData.clientName,
            status: orderData.status,
            product_name: orderData.productName,
            date: orderData.date,
            quantity: orderData.quantity,
          }
        });
      }
      
      console.log("All orders saved successfully");
      
      // Call the parent callback for UI updates
      props.onSave({ ...formData });
      
      // Reset form and close
      setFormData({
        clientName: "",
        status: "",
        items: [],
        date: formatDateTimeLocal(new Date()),
        totalAmount: 0,
      });
      
      props.onClose();
      
    } catch (error) {
      console.error('Error saving order:', error);
      
      // Handle specific error messages
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        // Map common error messages to user-friendly French messages
        if (errorMessage.includes('Insufficient product quantity')) {
          const match = errorMessage.match(/Available: (\d+), Requested: (\d+)/);
          if (match) {
            setError(`Stock insuffisant. Disponible: ${match[1]}, Demandé: ${match[2]}`);
          } else {
            setError('Stock insuffisant pour ce produit');
          }
        } 
        else if (errorMessage.includes('Product') && errorMessage.includes('not found')) {
          setError('Produit non trouvé dans la base de données');
        }
        else if (errorMessage.includes('quantity') || errorMessage.includes('quantité')) {
          setError(errorMessage); // Use the specific quantity error message
        }
        else {
          // Generic error mapping
          setError(`Erreur: ${errorMessage}`);
        }
      } else {
        setError('Erreur inconnue lors de la sauvegarde');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Show when={props.show}>
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
        <div class="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 transform transition-transform duration-300 scale-95 animate-scaleIn max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-bold mb-4">Ajouter une nouvelle vente</h2>
          
          {/* Error message */}
          <Show when={error()}>
            <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error()}
            </div>
          </Show>
          
          <form onSubmit={handleSubmit}>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-200 mb-1">
                Nom du client
              </label>
              <input
                type="text"
                required
                value={formData.clientName}
                onInput={(e) => handleInputChange("clientName", e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-gray-700 text-white"
                placeholder="Entrez le nom du client"
                disabled={isSubmitting()}
              />
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-200 mb-1">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-gray-700 text-white"
                disabled={isSubmitting()}
              >
                <option value="">Sélectionner un statut</option>
                <option value="Crédit">En attend</option>
                <option value="Khaless">Payé</option>
              </select>
            </div>
            
            <div class="mb-4">
              <div class="flex justify-between items-center mb-2">
                <label class="block text-sm font-medium text-gray-200">
                  Produits
                </label>
                <button
                  type="button"
                  onClick={addProductItem}
                  class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  disabled={isSubmitting()}
                >
                  + Ajouter un produit
                </button>
              </div>
              
              <For each={formData.items}>
                {(item, index) => (
                  <div class="grid grid-cols-12 gap-2 mb-3 p-3 bg-gray-700 rounded-lg">
                    <div class="col-span-5">
                      <select
                        required
                        value={item.productName}
                        onChange={(e) => updateProductItem(index(), 'productName', e.currentTarget.value)}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-gray-600 text-white"
                        disabled={isSubmitting()}
                      >
                        <option value="">Sélectionner un produit</option>
                        <For each={products()}>
                          {(product) => (
                            <option value={product.name}>
                              {product.name} - {product.price}TND
                            </option>
                          )}
                        </For>
                      </select>
                    </div>
                    
                    <div class="col-span-3">
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onInput={(e) => updateProductItem(index(), 'quantity', e.currentTarget.value)}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-gray-600 text-white"
                        placeholder="Quantité"
                        disabled={isSubmitting()}
                      />
                    </div>
                    
                    <div class="col-span-3 flex items-center justify-end">
                      <span class="text-white font-medium">
                        {item.total.toFixed(2)} TND
                      </span>
                    </div>
                    
                    <div class="col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeProductItem(index())}
                        class="text-red-500 hover:text-red-700 transition-colors"
                        disabled={isSubmitting()}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </For>
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-200 mb-1">
                Date et heure
              </label>
              <input
                type="datetime-local"
                required
                value={formData.date}
                onInput={(e) => handleInputChange("date", e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-gray-700 text-white"
                disabled={isSubmitting()}
              />
            </div>
            
            <div class="mb-6 p-3 bg-gray-700 rounded-lg">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-200">Total de la commande:</span>
                <span class="text-lg font-bold text-emerald-400">
                  {formData.totalAmount.toFixed(3)} TND
                </span>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                onClick={props.onClose}
                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-sm hover:bg-gray-300 transition-colors"
                disabled={isSubmitting()}
              >
                Annuler
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-emerald-600 text-white rounded-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting() || formData.items.length === 0}
              >
                {isSubmitting() ? "Ajout..." : "Ajouter la vente"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
};

export default SaleForm;
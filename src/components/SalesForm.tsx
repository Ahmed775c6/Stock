// SaleForm.tsx
import { createSignal, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

export type SaleFormData = {
  clientName: string;
  status: string;
  productName: string;
  date: string; // This will now include time
  quantity: number;
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

  const [formData, setFormData] = createSignal<SaleFormData>({
    clientName: "",
    status: "",
    productName: "",
    date: formatDateTimeLocal(new Date()), // Use formatted datetime
    quantity: 1,
  });

  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleInputChange = (field: keyof SaleFormData, value: any) => {
    setFormData({ ...formData(), [field]: value });
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      console.log("Saving order:", formData());
      
      await invoke('save_order', {
        order: {
          client_name: formData().clientName,
          status: formData().status,
          product_name: formData().productName,
          date: formData().date,
          quantity: formData().quantity,
        }
      });
      
      console.log("Order saved successfully");
      
      // Call the parent callback for UI updates only
      props.onSave(formData());
      
      // Reset form and close
      setFormData({
        clientName: "",
        status: "",
        productName: "",
        date: formatDateTimeLocal(new Date()),
        quantity: 1,
      });
      
      props.onClose();
      
    } catch (error) {
      console.error('Error saving order:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Show when={props.show}>
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
        <div class="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 transform transition-transform duration-300 scale-95 animate-scaleIn">
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
                value={formData().clientName}
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
                value={formData().status}
                onChange={(e) => handleInputChange("status", e.currentTarget.value )}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-gray-700 text-white"
                disabled={isSubmitting()}
              >
                <option value="Crédit">En attend</option>
                <option value="Khaless">payé</option>
              </select>
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-200 mb-1">
                Produit
              </label>
              <input 
                type="text"
                required
                value={formData().productName}
                onInput={(e) => handleInputChange("productName", e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-gray-700 text-white"
                placeholder="Nom du produit"
                disabled={isSubmitting()}
              />
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-200 mb-1">
                Date et heure
              </label>
              <input
                type="datetime-local"
                required
                value={formData().date}
                onInput={(e) => handleInputChange("date", e.currentTarget.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-gray-700 text-white"
                disabled={isSubmitting()}
              />
            </div>
            
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-200 mb-1">
                Quantité
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData().quantity}
                onInput={(e) => handleInputChange("quantity", parseInt(e.currentTarget.value) || 1)}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all bg-gray-700 text-white"
                placeholder="Entrez la quantité"
                disabled={isSubmitting()}
              />
            </div>
            
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                onClick={props.onClose}
                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={isSubmitting()}
              >
                Annuler
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting()}
              >
                {isSubmitting() ? "Ajout..." : "Ajouter"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
};

export default SaleForm;
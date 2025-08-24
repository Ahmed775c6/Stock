// components/FactureWindow.tsx
import { createSignal, createEffect, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

type Product = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  cost_price: number;
  brand: string;
  material: string;
  image?: string;
};

const FactureWindow = () => {
  const [products, setProducts] = createSignal<Product[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const [form, setForm] = createStore({
    client_name: "",
    status: "Khaless" as "Crédit" | "Khaless",
    product_name: "",
    quantity: 1,
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch products for dropdown
  createEffect(async () => {
    try {
      const productsData: Product[] = await invoke("get_products");
      setProducts(productsData);
      if (productsData.length > 0 && !form.product_name) {
        setForm("product_name", productsData[0].name);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Erreur lors du chargement des produits");
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await invoke("save_order", {
        order: {
          client_name: form.client_name,
          status: form.status,
          product_name: form.product_name,
          quantity: form.quantity,
          date: form.date
        }
      });

      // Close the window after successful submission
      const currentWindow = getCurrentWebviewWindow();
      await currentWindow.close();
      
    } catch (err) {
      console.error("Error creating invoice:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la création de la facture");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = () => products().find(p => p.name === form.product_name);

  const handleClose = async () => {
    const currentWindow = getCurrentWebviewWindow();
    await currentWindow.close();
  };

  return (
    <div class="w-full h-screen bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
      {/* Header */}
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h1 class="text-2xl font-bold">Nouvelle Facture</h1>
        <button
          onClick={handleClose}
          class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          title="Fermer"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form Content */}
      <div class="p-6 h-[calc(100vh-80px)] overflow-y-auto">
        <form onSubmit={handleSubmit} class="max-w-2xl mx-auto space-y-6">
          {error() && (
            <div class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
              {error()}
            </div>
          )}

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom du Client *
              </label>
              <input
                type="text"
                required
                value={form.client_name}
                onInput={(e) => setForm("client_name", e.currentTarget.value)}
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                placeholder="Entrez le nom du client"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Statut de Paiement *
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm("status", e.currentTarget.value as "Crédit" | "Khaless")}
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              >
                <option value="Khaless">Khaless (Payé)</option>
                <option value="Crédit">Crédit</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Produit *
              </label>
              <select
                value={form.product_name}
                onChange={(e) => setForm("product_name", e.currentTarget.value)}
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              >
                <For each={products()}>
                  {(product) => (
                    <option value={product.name}>
                      {product.name} - {product.price.toFixed(3)} TND (Stock: {product.quantity})
                    </option>
                  )}
                </For>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantité *
              </label>
              <input
                type="number"
                min="1"
                max={selectedProduct()?.quantity || 1}
                value={form.quantity}
                onInput={(e) => setForm("quantity", parseInt(e.currentTarget.value))}
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              />
              <Show when={selectedProduct()}>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Stock disponible: {selectedProduct()?.quantity} unités
                </p>
              </Show>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                required
                value={form.date}
                onInput={(e) => setForm("date", e.currentTarget.value)}
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
          </div>

          <Show when={selectedProduct()}>
            <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 class="font-semibold text-lg text-gray-900 dark:text-white mb-4">Récapitulatif</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <span class="text-gray-600 dark:text-gray-400">Produit:</span>
                <span class="text-gray-900 dark:text-white">{selectedProduct()?.name}</span>
                
                <span class="text-gray-600 dark:text-gray-400">Prix unitaire:</span>
                <span class="text-gray-900 dark:text-white">{selectedProduct()?.price.toFixed(3)} TND</span>
                
                <span class="text-gray-600 dark:text-gray-400">Quantité:</span>
                <span class="text-gray-900 dark:text-white">{form.quantity}</span>
                
                <span class="text-gray-600 dark:text-gray-400">Statut:</span>
                <span class="text-gray-900 dark:text-white">{form.status}</span>
                
                <span class="text-gray-600 dark:text-gray-400">Total:</span>
                <span class="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {(selectedProduct()!.price * form.quantity).toFixed(3)} TND
                </span>
              </div>
            </div>
          </Show>

          {/* Action Buttons */}
          <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              class="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading()}
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading() ? "Création en cours..." : "Créer la Facture"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FactureWindow;
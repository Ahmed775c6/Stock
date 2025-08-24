// InventoryInvoices.tsx
import { createSignal, createEffect, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api/core";

interface InventoryInvoice {
  id: number;
  type: string;
  product_id: number;
  product_name: string;
  quantity_change: number;
  cost_price: number;
  total_cost: number;
  client_name: string | null;
  status: string | null;
  created_at: string;
}

const InventoryInvoices = () => {
  const [invoices, setInvoices] = createStore<InventoryInvoice[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");

  // Fetch inventory invoices data
  createEffect(async () => {
    try {
      setLoading(true);
      const invoicesData: InventoryInvoice[] = await invoke("get_inventory_invoices");
      setInvoices(invoicesData);
      setError("");
    } catch (err) {
      console.error("Error fetching inventory invoices:", err);
      setError("Erreur lors du chargement des factures d'inventaire");
    } finally {
      setLoading(false);
    }
  });

  // Format date with time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div class="w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-6">
      <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Factures d'Inventaire
      </h2>
      
      {/* Loading State */}
      <Show when={loading()}>
        <div class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Show>

      {/* Error State */}
      <Show when={error()}>
        <div class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
          {error()}
        </div>
      </Show>

      {/* Invoices Table */}
      <Show when={!loading() && !error()}>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Produit
                </th>
                <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Changement de Quantité
                </th>
                <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Prix de Revient
                </th>
                <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Coût Total
                </th>
                <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date et Heure
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
              <Show when={invoices.length > 0} fallback={
                <tr>
                  <td colspan={5} class="py-8 px-4 text-center text-gray-500 dark:text-gray-400">
                    Aucune facture d'inventaire trouvée
                  </td>
                </tr>
              }>
                <For each={invoices}>
                  {(invoice) => (
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {invoice.product_name}
                      </td>
                      <td class="py-3 px-4 text-sm">
                        <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.quantity_change > 0 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}>
                          {invoice.quantity_change > 0 ? "+" : ""}{invoice.quantity_change}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {invoice.cost_price.toFixed(3)} TND
                      </td>
                      <td class="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {invoice.total_cost.toFixed(3)} TND
                      </td>
                      <td class="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {formatDateTime(invoice.created_at)}
                      </td>
                    </tr>
                  )}
                </For>
              </Show>
            </tbody>
          </table>
        </div>
      </Show>
    </div>
  );
};

export default InventoryInvoices;
import { createSignal, createEffect, Show } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { invoke } from "@tauri-apps/api/core";

type Invoice = {
  id: number;
  client_name: string;
  status: "Crédit" | "Khaless";
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  total_amount: number;
  date: string;
  created_at: string;
  updated_at: string;
};

const FacturePage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = createSignal<Invoice | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");

  // Fetch invoice data
  createEffect(async () => {
    try {
      setLoading(true);
      const invoiceData: Invoice = await invoke("get_sale_by_id", { id: parseInt(params.id) });
      setInvoice(invoiceData);
      setError("");
    } catch (err) {
      console.error("Error fetching invoice:", err);
      setError("Erreur lors du chargement de la facture");
    } finally {
      setLoading(false);
    }
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Print invoice
  const handlePrint = () => {
    window.print();
  };

  // Go back
  const handleBack = () => {
    navigate("/factures");
  };

  return (
    <main class="w-full min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Non-printable header */}
      <div class="print:hidden bg-white dark:bg-gray-800 shadow-sm p-4">
        <div class="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={handleBack}
            class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          >
            ← Retour
          </button>
          <button
            onClick={handlePrint}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd" />
            </svg>
            Imprimer
          </button>
        </div>
      </div>

      {/* Invoice content */}
      <div class="p-4 print:p-0">
        <div class="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg print:shadow-none">
          <Show when={loading()}>
            <div class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </Show>

          <Show when={error()}>
            <div class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg m-4">
              {error()}
            </div>
          </Show>

          <Show when={invoice()}>
            {(inv) => (
              <div class="p-8 print:p-12">
                {/* Header */}
                <div class="flex justify-between items-start mb-8">
                  <div>
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">FACTURE</h1>
                    <p class="text-gray-600 dark:text-gray-400">N° {inv().id}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-gray-600 dark:text-gray-400">Date: {formatDate(inv().created_at)}</p>
                    <p class="text-gray-600 dark:text-gray-400">Statut: 
                      <span class={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        inv().status === "Crédit" 
                          ? "bg-rose-100 text-rose-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {inv().status === "Crédit" ? "En Attend" : "Payé"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Client Information */}
                <div class="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Client</h2>
                    <p class="text-gray-600 dark:text-gray-400">{inv().client_name}</p>
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Informations de facturation</h2>
                    <p class="text-gray-600 dark:text-gray-400">Facture #{inv().id}</p>
                    <p class="text-gray-600 dark:text-gray-400">Émise le: {formatDate(inv().created_at)}</p>
                  </div>
                </div>

                {/* Product Details */}
                <div class="mb-8">
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Détails de la vente</h2>
                  <div class="border border-gray-200 dark:border-gray-600 rounded-lg">
                    <table class="w-full">
                      <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Produit
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Quantité
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Prix Unitaire
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                        <tr>
                          <td class="px-6 py-4">
                            <div class="flex items-center">
                              {inv().product_image && (
                                <img 
                                  src={inv().product_image} 
                                  alt={inv().product_name} 
                                  class="w-12 h-12 object-cover rounded-md mr-3"
                                />
                              )}
                              <span class="text-sm font-medium text-gray-900 dark:text-white">
                                {inv().product_name}
                              </span>
                            </div>
                          </td>
                          <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {inv().quantity}
                          </td>
                          <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {inv().price.toFixed(3)} TND
                          </td>
                          <td class="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                            {inv().total_amount.toFixed(3)} TND
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total */}
                <div class="flex justify-end">
                  <div class="w-64">
                    <div class="flex justify-between py-2">
                      <span class="text-gray-600 dark:text-gray-400">Sous-total:</span>
                      <span class="text-gray-900 dark:text-white">{inv().total_amount.toFixed(3)} TND</span>
                    </div>
                    <div class="flex justify-between py-2 border-t border-gray-200 dark:border-gray-600">
                      <span class="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
                      <span class="text-lg font-semibold text-gray-900 dark:text-white">{inv().total_amount.toFixed(3)} TND</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-600">
                  <p class="text-center text-gray-500 dark:text-gray-400 text-sm">
                    Merci pour votre confiance. Pour toute question, veuillez nous contacter.
                  </p>
                </div>
              </div>
            )}
          </Show>
        </div>
      </div>
    </main>
  );
};

export default FacturePage;
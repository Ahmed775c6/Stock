import { createSignal, createEffect, Show, For } from "solid-js";
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

const InvoiceYear = () => {
  const params = useParams();
  const navigate = useNavigate();
  const year = parseInt(params.year);
  const [invoices, setInvoices] = createSignal<Invoice[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");
  const [totalAmount, setTotalAmount] = createSignal(0);

  createEffect(async () => {
    try {
      setLoading(true);
      const allInvoices: Invoice[] = await invoke("get_sales");
      
      // Filter invoices by year
      const yearInvoices = allInvoices.filter(invoice => {
        const invoiceYear = new Date(invoice.created_at).getFullYear();
        return invoiceYear === year;
      });
      
      setInvoices(yearInvoices);
      
      // Calculate total amount
      const total = yearInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
      setTotalAmount(total);
      
      setError("");
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError("Erreur lors du chargement des factures");
    } finally {
      setLoading(false);
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate("/factures");
  };

  return (
    <main class="w-full flex min-h-screen bg-white text-gray-900">
      <div class="w-full h-full md:p-4 bg-white overflow-y-auto">
        {/* Action Buttons - Hidden when printing */}
        <div class="flex justify-between items-center mb-6 print:hidden">
          <h1 class="text-2xl font-bold">Factures de {year}</h1>
          <div class="flex gap-2">
            <button
              onClick={handleBack}
              class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Retour
            </button>
            <button
              onClick={handlePrint}
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Imprimer
            </button>
          </div>
        </div>

        {/* Loading State */}
        <Show when={loading()}>
          <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </Show>

        {/* Error State */}
        <Show when={error()}>
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error()}
          </div>
        </Show>

        {/* Invoices Table */}
        <Show when={!loading() && !error()}>
          <div class="bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none print:rounded-none print:bg-white">
            {/* Invoice Header */}
            <div class="p-6 border-b border-gray-200 print:border-b print:p-4">
              <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:flex-row">
                <div>
                  <h2 class="text-xl font-bold print:text-lg">Factures Annuelle</h2>
                  <p class="text-gray-600 print:text-sm">Année: {year}</p>
                </div>
                <div class="text-left md:text-right print:text-right">
                  <p class="text-lg font-semibold print:text-base">Total: {totalAmount().toFixed(3)} TND</p>
                  <p class="text-gray-600 print:text-sm">{invoices().length} factures</p>
                </div>
              </div>
            </div>

            {/* Desktop Table */}
            <div class="hidden md:block print:block">
              <table class="w-full">
                <thead class="bg-gray-50 print:bg-gray-100">
                  <tr>
                    <th class="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:py-2 print:px-3 print:text-xs">
                      ID
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:py-2 print:px-3 print:text-xs">
                      Produit
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:py-2 print:px-3 print:text-xs">
                      Client
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:py-2 print:px-3 print:text-xs">
                      Statut
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:py-2 print:px-3 print:text-xs">
                      Date
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:py-2 print:px-3 print:text-xs">
                      Quantité
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:py-2 print:px-3 print:text-xs">
                      Prix
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:py-2 print:px-3 print:text-xs">
                      Montant
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <Show when={invoices().length > 0} fallback={
                    <tr>
                      <td colspan="8" class="py-8 px-6 text-center text-gray-500 print:py-4 print:px-3">
                        Aucune facture trouvée pour {year}
                      </td>
                    </tr>
                  }>
                    <For each={invoices()}>
                      {(invoice) => (
                        <tr class="hover:bg-gray-50 transition-colors duration-200 print:break-inside-avoid">
                          <td class="py-4 px-6 text-sm text-gray-900 print:py-2 print:px-3 print:text-xs">
                            #{invoice.id}
                          </td>
                          <td class="py-4 px-6 text-sm text-gray-900 print:py-2 print:px-3 print:text-xs">
                            {invoice.product_name}
                          </td>
                          <td class="py-4 px-6 text-sm text-gray-900 print:py-2 print:px-3 print:text-xs">
                            {invoice.client_name}
                          </td>
                          <td class="py-4 px-6 print:py-2 print:px-3">
                            <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              invoice.status === "Crédit" 
                                ? "bg-rose-100 text-rose-800 print:bg-rose-100 print:text-rose-800" 
                                : "bg-green-100 text-green-800 print:bg-green-100 print:text-green-800"
                            }`}>
                              {invoice.status === "Crédit" ? 'En attend' : "Payé"}
                            </span>
                          </td>
                          <td class="py-4 px-6 text-sm text-gray-900 print:py-2 print:px-3 print:text-xs">
                            {formatDate(invoice.created_at)}
                          </td>
                          <td class="py-4 px-6 text-sm text-gray-900 print:py-2 print:px-3 print:text-xs">
                            {invoice.quantity}
                          </td>
                          <td class="py-4 px-6 text-sm text-gray-900 print:py-2 print:px-3 print:text-xs">
                            {invoice.price.toFixed(3)} TND
                          </td>
                          <td class="py-4 px-6 text-sm font-semibold text-gray-900 print:py-2 print:px-3 print:text-xs">
                            {invoice.total_amount.toFixed(3)} TND
                          </td>
                        </tr>
                      )}
                    </For>
                  </Show>
                </tbody>
                <tfoot class="bg-gray-50 print:bg-gray-100">
                  <tr>
                    <td colspan="7" class="py-4 px-6 text-sm font-semibold text-right print:py-2 print:px-3 print:text-xs">
                      Total:
                    </td>
                    <td class="py-4 px-6 text-sm font-semibold text-gray-900 print:py-2 print:px-3 print:text-xs">
                      {totalAmount().toFixed(3)} TND
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Cards */}
            <div class="md:hidden print:hidden">
              <Show when={invoices().length > 0} fallback={
                <div class="py-8 px-6 text-center text-gray-500">
                  Aucune facture trouvée pour {year}
                </div>
              }>
                <For each={invoices()}>
                  {(invoice) => (
                    <div class="p-4 border-b border-gray-200">
                      <div class="flex justify-between items-start mb-2">
                        <span class="font-semibold">#{invoice.id}</span>
                        <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === "Crédit" 
                            ? "bg-rose-100 text-rose-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {invoice.status === "Crédit" ? 'En attend' : "Payé"}
                        </span>
                      </div>
                      <div class="mb-2">
                        <span class="font-medium">Client:</span> {invoice.client_name}
                      </div>
                      <div class="mb-2">
                        <span class="font-medium">Produit:</span> {invoice.product_name}
                      </div>
                      <div class="mb-2">
                        <span class="font-medium">Date:</span> {formatDate(invoice.created_at)}
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <span class="font-medium">Quantité:</span> {invoice.quantity}
                        </div>
                        <div>
                          <span class="font-medium">Prix:</span> {invoice.price.toFixed(3)} TND
                        </div>
                      </div>
                      <div class="mt-2 font-semibold">
                        Total: {invoice.total_amount.toFixed(3)} TND
                      </div>
                    </div>
                  )}
                </For>
                <div class="p-4 bg-gray-50 font-semibold">
                  <div class="flex justify-between">
                    <span>Total général:</span>
                    <span>{totalAmount().toFixed(3)} TND</span>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </main>
  );
};

export default InvoiceYear;
import { createSignal, createEffect, Show, For } from "solid-js";
import { useParams, useSearchParams } from "@solidjs/router";
import { invoke } from "@tauri-apps/api/core";
import { A } from "@solidjs/router";

type InvoiceItem = {
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

type ClientInvoiceData = {
  client_name: string;
  period: string;
  items: InvoiceItem[];
  total: number;
  credit_total: number;
  paid_total: number;
};

const ClientInvoice = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [invoiceData, setInvoiceData] = createSignal<ClientInvoiceData | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");

  // Determine the type of invoice based on URL parameters
  const invoiceType = () => {
    if (params.year && params.month) return "month";
    if (params.year) return "year";
    if (params.clientName) return "client";
    return "unknown";
  };

  // Format period based on invoice type
  const formatPeriod = () => {
    const type = invoiceType();
    const data = invoiceData();
    
    if (!data) return "";
    
    if (type === "year") {
      return `Année ${new Date(data.period).getFullYear()}`;
    } else if (type === "month") {
      const date = new Date(data.period);
      const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
      ];
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    } else if (type === "client") {
      if (searchParams.year && searchParams.month) {
        const monthNames = [
          "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
          "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ];
        return `${monthNames[parseInt(searchParams?.month as any) - 1]} ${searchParams.year}`;
      } else if (searchParams.year) {
        return `Année ${searchParams.year}`;
      } else if (searchParams.date) {
        const date = new Date(searchParams.date as any);
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
      return "Toutes les périodes";
    }
    
    return data.period;
  };

  // Fetch invoice data
  createEffect(async () => {
    try {
      setLoading(true);
      let data: ClientInvoiceData;
      
      const type = invoiceType();
      
      if (type === "year") {
        data = await invoke("get_client_invoices_by_year", {
          year: parseInt(params.year)
        });
      } else if (type === "month") {
        data = await invoke("get_client_invoices_by_month", {
          year: parseInt(params.year),
          month: parseInt(params.month)
        });
      } else if (type === "client") {
        // For client-specific invoices with optional date filters
        const filters: any = { clientName: params.clientName };
        
        if (searchParams.year) filters.year = parseInt(searchParams.year as any);
        if (searchParams.month) filters.month = parseInt(searchParams.month as any) ;
        if (searchParams.date) filters.date = searchParams.date;
        
        data = await invoke("get_client_invoices", filters);
      } else {
        throw new Error("Type de facture non reconnu");
      }
      
      setInvoiceData(data);
      setError("");
    } catch (err) {
      console.error("Error fetching invoice data:", err);
      setError("Erreur lors du chargement de la facture");
    } finally {
      setLoading(false);
    }
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Print invoice
  const handlePrint = () => {
    window.print();
  };

  return (
    <main class="w-full flex min-h-screen bg-gray-100 text-gray-900">
      <section class="w-full flex flex-col min-h-screen">
       
        <div class="w-full h-full   overflow-y-auto">
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

          {/* Invoice Content */}
          <Show when={!loading() && invoiceData()}>
            <div class="bg-white rounded-lg shadow-lg p-6 md:p-8 print:shadow-none">
              {/* Print Button */}
              <div class="flex justify-end mb-6 gap-3 print:hidden">
                <A href = {"/factures"} class=" bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">Retour</A>
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

              {/* Invoice Header */}
              <div class="flex flex-col md:flex-row justify-between items-start mb-8 pb-6 border-b border-gray-200">
                <div>
                  <h1 class="text-2xl md:text-3xl font-bold">Facture Client</h1>
                  <p class="text-gray-600 mt-2">
                    Période: {formatPeriod()}
                  </p>
                </div>
                <div class="mt-4 md:mt-0 text-right">
                  <p class="text-lg font-semibold">{invoiceData()?.client_name}</p>
                  <p class="text-gray-600">
                    Date de génération: {new Date().toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Invoice Summary */}
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="bg-blue-50 p-4 rounded-lg">
                  <h3 class="text-lg font-semibold text-blue-800">Total Facturé</h3>
                  <p class="text-2xl font-bold text-blue-900">
                    {formatCurrency(invoiceData()?.total || 0)}
                  </p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                  <h3 class="text-lg font-semibold text-green-800">Payé</h3>
                  <p class="text-2xl font-bold text-green-900">
                    {formatCurrency(invoiceData()?.paid_total || 0)}
                  </p>
                </div>
                <div class="bg-amber-50 p-4 rounded-lg">
                  <h3 class="text-lg font-semibold text-amber-800">En Attente</h3>
                  <p class="text-2xl font-bold text-amber-900">
                    {formatCurrency(invoiceData()?.credit_total || 0)}
                  </p>
                </div>
              </div>

              {/* Invoice Items Table */}
              <div class="mb-8">
                <h2 class="text-xl font-semibold mb-4">Détails des Transactions</h2>
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="py-3 px-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th class="py-3 px-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Produit
                        </th>
                        <th class="py-3 px-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Quantité
                        </th>
                        <th class="py-3 px-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Prix Unitaire
                        </th>
                        <th class="py-3 px-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th class="py-3 px-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                      <For each={invoiceData()?.items}>
                        {(item) => (
                          <tr class="hover:bg-gray-50 transition-colors duration-200">
                            <td class="py-3 px-4 text-sm text-gray-900">
                              {formatDate(item.created_at)}
                            </td>
                            <td class="py-3 px-4 text-sm text-gray-900">
                              {item.product_name}
                            </td>
                            <td class="py-3 px-4 text-sm text-gray-900">
                              {item.quantity}
                            </td>
                            <td class="py-3 px-4 text-sm text-gray-900">
                              {formatCurrency(item.price)}
                            </td>
                            <td class="py-3 px-4">
                              <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.status === "Crédit" 
                                  ? "bg-rose-100 text-rose-800" 
                                  : "bg-green-100 text-green-800"
                              }`}>
                                {item.status === "Crédit" ? 'En attend' : "Payé"}
                              </span>
                            </td>
                            <td class="py-3 px-4 text-sm font-semibold text-gray-900 text-right">
                              {formatCurrency(item.total_amount)}
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                    <tfoot class="bg-gray-50">
                      <tr>
                        <td colspan="5" class="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                          Total Général:
                        </td>
                        <td class="py-3 px-4 text-sm font-bold text-gray-900 text-right">
                          {formatCurrency(invoiceData()?.total || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Additional Notes */}
              <div class="mt-8 pt-6 border-t border-gray-200">
                <h3 class="text-lg font-semibold mb-2">Notes</h3>
                <p class="text-gray-600">
                  Cette facture récapitulative inclut toutes les transactions pour le client {invoiceData()?.client_name} 
                  pour la période spécifiée. Les montants en attente représentent les transactions crédit qui n'ont pas encore été réglées.
                </p>
              </div>
            </div>
          </Show>
        </div>
      </section>
    </main>
  );
};

export default ClientInvoice;
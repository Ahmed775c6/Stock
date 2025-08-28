// Create a new file at src/pages/DayInvoice.tsx
import { createSignal, createEffect, For } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { invoke } from "@tauri-apps/api/core";
import Navbar from "../components/Navbar";

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

const DayInvoice = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [invoices, setInvoices] = createSignal<Invoice[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");
  const [totalAmount, setTotalAmount] = createSignal(0);

  createEffect(async () => {
    try {
      setLoading(true);
      const day = params.day;
      const invoicesData: Invoice[] = await invoke("get_sales_by_day", { day });
      setInvoices(invoicesData);
      
      // Calculate total amount
      const total = invoicesData.reduce((sum, invoice) => sum + invoice.total_amount, 0);
      setTotalAmount(total);
      
      setError("");
    } catch (err) {
      console.error("Error fetching day invoices:", err);
      setError("Erreur lors du chargement des factures du jour");
    } finally {
      setLoading(false);
    }
  });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReturn = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <main class="w-full flex min-h-screen bg-gray-100 text-gray-900">
      {/* Print styles */}
      <style>
        {`
          @media print {
            @page {
              margin: 0.5cm;
              size: landscape;
            }
            .no-print {
              display: none !important;
            }
            body, html, main {
              background: white !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .print-table {
              width: 100% !important;
              font-size: 10px !important;
              border-collapse: collapse;
            }
            .print-table th, .print-table td {
              padding: 2px 4px !important;
              border: 1px solid #ddd;
            }
            .print-table th {
              background-color: #f5f5f5 !important;
              color: black !important;
              -webkit-print-color-adjust: exact;
            }
            .print-header {
              text-align: center;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 2px solid #333;
            }
            .print-summary {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px solid #333;
              font-weight: bold;
            }
            .status-badge {
              border: 1px solid #000 !important;
              background-color: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact;
            }
            .status-credit {
              background-color: #ffebee !important;
            }
            .status-paid {
              background-color: #e8f5e9 !important;
            }
          }
        `}
      </style>
      
      <section class="w-full flex flex-col min-h-screen">
        <div class="w-full h-full p-4 md:p-8 overflow-y-auto">
          <div class="mb-6 flex justify-between items-center no-print">
            <div>
              <h1 class="text-2xl font-bold mb-2">
                Factures du {formatDate(params.day)}
              </h1>
              <p class="text-gray-600">
                {invoices().length} facture(s) - Total: {totalAmount().toFixed(3)} TND
              </p>
            </div>
            <div class="flex space-x-2">
              <button 
                onClick={handleReturn}
                class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Retour
              </button>
              <button 
                onClick={handlePrint}
                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Imprimer
              </button>
            </div>
          </div>

          {/* Print-only header */}
          <div class="hidden print:block print-header">
            <h1 class="text-lg font-bold">
              Factures du {formatDate(params.day)}
            </h1>
            <p class="text-sm">
              {invoices().length} facture(s) - Total: {totalAmount().toFixed(3)} TND
            </p>
            <p class="text-xs">Imprimé le {new Date().toLocaleDateString('fr-FR')}</p>
          </div>

          {/* Loading State */}
          {loading() && (
            <div class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Error State */}
          {error() && (
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error()}
            </div>
          )}

          {/* Invoices Table */}
          {!loading() && !error() && (
            <div class="bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none">
              <table class="w-full print-table">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Heure
                    </th>
                    <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <For each={invoices()} fallback={
                    <tr>
                      <td colspan="7" class="py-8 px-6 text-center text-gray-500">
                        Aucune facture trouvée pour cette date
                      </td>
                    </tr>
                  }>
                    {(invoice) => (
                      <tr class="hover:bg-gray-50 transition-colors duration-200">
                        <td class="py-2 px-3 text-sm text-gray-900">
                          {invoice.client_name}
                        </td>
                        <td class="py-2 px-3">
                          <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full status-badge ${
                            invoice.status === "Crédit" 
                              ? "status-credit" 
                              : "status-paid"
                          }`}>
                            {invoice.status === "Crédit" ? 'En attend' : "Payé"}
                          </span>
                        </td>
                        <td class="py-2 px-3 text-sm text-gray-900">
                          {invoice.product_name}
                        </td>
                        <td class="py-2 px-3 text-sm text-gray-900">
                          {invoice.quantity}
                        </td>
                        <td class="py-2 px-3 text-sm text-gray-900">
                          {invoice.price.toFixed(3)} TND
                        </td>
                        <td class="py-2 px-3 text-sm text-gray-900">
                          {formatDateTime(invoice.created_at)}
                        </td>
                        <td class="py-2 px-3 text-sm font-semibold text-gray-900">
                          {invoice.total_amount.toFixed(3)} TND
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
                <tfoot class="bg-gray-50">
                  <tr>
                    <td colspan="6" class="py-2 px-3 text-sm font-semibold text-gray-900 text-right">
                      Total:
                    </td>
                    <td class="py-2 px-3 text-sm font-bold text-gray-900">
                      {totalAmount().toFixed(3)} TND
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default DayInvoice;
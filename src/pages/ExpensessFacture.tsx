import { createSignal, onMount, Show, For } from "solid-js";
import { useParams } from "@solidjs/router";
import { invoke } from "@tauri-apps/api/core";

type Expense = {
  id: number;
  product_name: string;
  cost_price: number;
  quantity: number;
  total_cost: number;
  date: string;
  created_at: string;
};

type ExpensesInvoiceData = {
  period: string;
  expenses: Expense[];
  total_cost: number;
};

const ExpensesFacture = () => {
  const params = useParams();
  const [invoiceData, setInvoiceData] = createSignal<ExpensesInvoiceData | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");

  onMount(async () => {
    try {
      setLoading(true);
      let data: ExpensesInvoiceData;
      
      // Determine the type based on which parameters are present
      if (params.year && !params.month && !params.date) {
        // Year route: /expenses-invoice/year/:year
        data = await invoke("get_expenses_by_year", { year: parseInt(params.year) });
      } else if (params.year && params.month) {
        // Month route: /expenses-invoice/month/:year/:month
        data = await invoke("get_expenses_by_month", { 
          year: parseInt(params.year), 
          month: parseInt(params.month) 
        });
      } else if (params.date) {
        // Day route: /expenses-invoice/day/:date
        data = await invoke("get_expenses_by_day", { date: params.date });
      } else {
        throw new Error("Type de rapport non supporté");
      }

      setInvoiceData(data);
      setError("");
    } catch (err) {
      console.error("Error fetching expenses data:", err);
      setError("Erreur lors du chargement des données de dépenses");
    } finally {
      setLoading(false);
    }
  });

  // Update getTitle function to match new parameter structure
  const getTitle = () => {
    if (params.year && !params.month && !params.date) {
      return `Dépenses - Année ${params.year}`;
    } else if (params.year && params.month) {
      const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
      ];
      return `Dépenses - ${monthNames[parseInt(params.month) - 1]} ${params.year}`;
    } else if (params.date) {
      return `Dépenses - ${formatDate(params.date)}`;
    }
    return "Rapport des Dépenses";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "TND"
    }).format(amount);

  const handlePrint = () => window.print();

  return (
    <main class="w-full flex min-h-screen bg-gray-100 text-gray-900 print:bg-white print:text-black">
      <section class="w-full flex flex-col min-h-screen print:block">
     
        <div class="w-full h-full p-4 md:p-8 overflow-y-auto print:p-2">
          
          {/* Print Button */}
          <div class="mb-6 flex justify-end print:hidden">
            <button
              onClick={handlePrint}
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Imprimer
            </button>
          </div>

          {/* Loading State */}
          <Show when={loading()}>
            <div class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </Show>

          {/* Error State */}
          <Show when={error()}>
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 print:bg-white print:border-gray-300 print:text-black">
              {error()}
            </div>
          </Show>

          {/* Expenses Report */}
          <Show when={!loading() && invoiceData()}>
            <div class="bg-white rounded-lg shadow-lg p-6 print:shadow-none print:bg-white print:border print:border-gray-300">
              
              {/* Header */}
              <div class="text-center mb-8 print:mb-4">
                <h1 class="text-2xl font-bold mb-2 print:text-xl">{getTitle()}</h1>
                <p class="text-gray-600 print:text-black">
                  Généré le {new Date().toLocaleDateString("fr-FR")}
                </p>
              </div>

              {/* Summary */}
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg print:bg-gray-100 print:border print:border-gray-300 print:p-2">
                <div class="text-center">
                  <p class="text-sm text-gray-600 print:text-black">Période</p>
                  <p class="font-semibold">{invoiceData()?.period}</p>
                </div>
                <div class="text-center">
                  <p class="text-sm text-gray-600 print:text-black">Nombre d'articles achetés</p>
                  <p class="font-semibold">{invoiceData()?.expenses.length}</p>
                </div>
                <div class="text-center">
                  <p class="text-sm text-gray-600 print:text-black">Dépenses totales</p>
                  <p class="font-semibold text-red-600 print:text-red-700">
                    {formatCurrency(invoiceData()?.total_cost || 0)}
                  </p>
                </div>
              </div>

              {/* Expenses Table */}
              <div class="overflow-x-auto">
                <table class="w-full border-collapse print:border print:border-gray-300">
                  <thead>
                    <tr class="bg-gray-50 print:bg-gray-200">
                      <th class="py-3 px-4 text-left border-b border-gray-200 print:border-gray-400 print:text-black">Produit</th>
                      <th class="py-3 px-4 text-left border-b border-gray-200 print:border-gray-400 print:text-black">Prix d'achat</th>
                      <th class="py-3 px-4 text-left border-b border-gray-200 print:border-gray-400 print:text-black">Quantité</th>
                      <th class="py-3 px-4 text-left border-b border-gray-200 print:border-gray-400 print:text-black">Coût total</th>
                      <th class="py-3 px-4 text-left border-b border-gray-200 print:border-gray-400 print:text-black">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={invoiceData()?.expenses}>
                      {(expense) => (
                        <tr class="border-b border-gray-200 hover:bg-gray-50 print:border-gray-400">
                          <td class="py-3 px-4 print:py-2">{expense.product_name}</td>
                          <td class="py-3 px-4 print:py-2">{formatCurrency(expense.cost_price)}</td>
                          <td class="py-3 px-4 print:py-2">{expense.quantity}</td>
                          <td class="py-3 px-4 text-red-600 font-semibold print:text-red-700 print:py-2">
                            {formatCurrency(expense.total_cost)}
                          </td>
                          <td class="py-3 px-4 print:py-2">{formatDate(expense.date)}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                  <tfoot>
                    <tr class="bg-gray-50 font-semibold print:bg-gray-200">
                      <td class="py-3 px-4 print:py-2 print:border-t print:border-gray-400" colSpan={3}>Total des dépenses</td>
                      <td class="py-3 px-4 text-red-600 print:text-red-700 print:border-t print:border-gray-400 print:py-2" colSpan={2}>
                        {formatCurrency(invoiceData()?.total_cost || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer */}
              <div class="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-600 print:border-gray-400 print:text-black print:mt-4 print:pt-2">
                <p>Rapport généré automatiquement par le système de gestion</p>
              </div>
            </div>
          </Show>
        </div>
      </section>
    </main>
  );
};

export default ExpensesFacture;
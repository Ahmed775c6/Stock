import { createSignal, createEffect, For, Show, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import SaleForm, { SaleFormData } from "./SalesForm";
import { invoke } from "@tauri-apps/api/core";

type Status = "Crédit" | "Khaless";

type TableRow = {
  id: number;
  client_name: string;
  status: Status;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  total_amount: number;
  date: string;
  created_at: string;
  updated_at: string;
};

const TableComponent = () => {
  const [data, setData] = createStore<TableRow[]>([]);
  const [filteredData, setFilteredData] = createStore<TableRow[]>([]);
  const [editingId, setEditingId] = createSignal<number | null>(null);
  const [tempEdit, setTempEdit] = createStore<Partial<TableRow>>({});
  const [showModal, setShowModal] = createSignal(false);
  const [currentPage, setCurrentPage] = createSignal(1);
  const [showSaleForm, setShowSaleForm] = createSignal(false);
  const [darkMode, setDarkMode] = createSignal(true);
  
  const itemsPerPage = 5;

  // Filters
  const [clientFilter, setClientFilter] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal<Status | "Tous">("Tous");

  // Check for saved theme preference or system preference
  onMount(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme) {
      setDarkMode(savedTheme === "dark");
    } else {
      setDarkMode(prefersDark);
    }
    
    // Update the class on the document element
    document.documentElement.classList.toggle("dark", darkMode());
  });

  // Update the theme when darkMode changes
  createEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode());
    localStorage.setItem("theme", darkMode() ? "dark" : "light");
  });

  // Fetch sales data
  createEffect(async () => {
    try {
      const salesData: TableRow[] = await invoke("get_sales");
      console.log("Sales data:", salesData);
      setData(salesData);
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  });

  // Calculate pagination
  const totalPages = () => Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = () => {
    const start = (currentPage() - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  };

  // Apply filters
  createEffect(() => {
    let result = [...data];
    
    // Client name filter
    if (clientFilter()) {
      result = result.filter(item => 
        item.client_name.toLowerCase().includes(clientFilter().toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter() !== "Tous") {
      result = result.filter(item => item.status === statusFilter());
    }
    
    setFilteredData(result);
    if (currentPage() > totalPages() && totalPages() > 0) {
      setCurrentPage(totalPages());
    }
  });

  // Start editing a row
  const startEditing = (id: number, row: TableRow) => {
    setEditingId(id);
    setTempEdit({ ...row });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setTempEdit({});
  };

  // Update sale
  const saveChanges = async () => {
    if (editingId() !== null) {
      try {
        await invoke("update_sale", {
          id: editingId(),
          clientName: tempEdit.client_name,
          status: tempEdit.status,
          productName: tempEdit.product_name,
          date: tempEdit.date,
          quantity: tempEdit.quantity,
        });
        
        // Refresh data
        const salesData: TableRow[] = await invoke("get_sales");
        setData(salesData);
      } catch (error) {
        console.error("Error updating sale:", error);
      }
    }
    cancelEditing();
  };

  // Delete sale
  const deleteRow = async (id: number) => {
    try {
      await invoke("delete_sale", { id });
      
      // Refresh data
      const salesData: TableRow[] = await invoke("get_sales");
      setData(salesData);
    } catch (error) {
      console.error("Error deleting sale:", error);
    }
  };

  // Add new sale
  const handleAddNewSale = async (saleData: SaleFormData) => {
    try {
      console.log(saleData);
      // Refresh data
      const salesData: TableRow[] = await invoke("get_sales");
      setData(salesData);
      
      // Close the form
      setShowSaleForm(false);
    } catch (error) {
      console.error("Error saving sale:", error);
    }
  };

  // Handle modal confirmation
  const confirmSave = () => {
    saveChanges();
    setShowModal(false);
  };

  // Handle input changes during editing
  const handleEditChange = (field: keyof TableRow, value: any) => {
    setTempEdit({ ...tempEdit, [field]: value });
  };

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
    <div class="p-4 bg-white dark:bg-gray-800 animate-fadeIn transition-colors duration-300">
      {/* Filters Section */}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg shadow-md transition-all duration-300">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Client</label>
          <input
            type="text"
            placeholder="Rechercher client..."
            value={clientFilter()}
            onInput={(e) => setClientFilter(e.currentTarget.value)}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Statut</label>
          <select
            value={statusFilter()}
            onChange={(e) => setStatusFilter(e.currentTarget.value as Status | "Tous")}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
          >
            <option value="Tous">Tous</option>
            <option value="Crédit">En attend</option>
            <option value="Khaless">payé</option>
          </select>
        </div>
        
        <div class="md:col-span-2 mt-5">
          <button 
            onClick={() => setShowSaleForm(true)}
            class="w-full p-2 bg-sky-700 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Ajouter nouvelle vente
          </button>
        </div>

        <SaleForm 
          show={showSaleForm()} 
          onClose={() => setShowSaleForm(false)} 
          onSave={handleAddNewSale} 
        />
      </div>

      {/* Table Container with Horizontal Scroll */}
      <div class="overflow-x-auto rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
        <table class="w-full bg-white dark:bg-gray-800 min-w-[800px]">
          <thead class="bg-gradient-to-r from-sky-700 to-blue- text-white">
            <tr>
              <th class="py-4 px-6 text-left rounded-tl-lg">Client</th>
              <th class="py-4 px-6 text-left">Statut</th>
              <th class="py-4 px-6 text-left">Produit</th>
              <th class="py-4 px-6 text-left">Date et Heure</th>
              <th class="py-4 px-6 text-left">Quantité</th>
              <th class="py-4 px-6 text-left">Prix Unitaire</th>
              <th class="py-4 px-6 text-left">Montant Total</th>
              <th class="py-4 px-6 text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            <Show when={paginatedData().length > 0} fallback={
              <tr>
                <td colspan="8" class="py-8 px-6 text-center text-gray-500 dark:text-gray-400">
                  Aucune vente effectuée pour le moment
                </td>
              </tr>
            }>
              <For each={paginatedData()}>
                {(row) => (
                  <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200">
                    <td class="py-3 px-6 text-gray-900 dark:text-gray-100">
                      {editingId() === row.id ? (
                        <input
                          type="text"
                          value={tempEdit.client_name || ""}
                          onInput={(e) => handleEditChange("client_name", e.currentTarget.value)}
                          class="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded focus:ring focus:ring-blue-300 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                        />
                      ) : (
                        row.client_name
                      )}
                    </td>
                    <td class="py-3 px-6">
                      {editingId() === row.id ? (
                        <select
                          value={tempEdit.status || ""}
                          onChange={(e) => handleEditChange("status", e.currentTarget.value)}
                          class="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded focus:ring focus:ring-blue-300 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                        >
                          <option value="Crédit">En attend</option>
                          <option value="Khaless">payé</option>
                        </select>
                      ) : (
                        <span class={`p-2 rounded-full text-xs font-semibold ${
                          row.status === "Crédit" 
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" 
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}>
                          { row.status == "Crédit" ? "En attend" : "payé" }
                        </span>
                      )}
                    </td>
                    <td class="py-3 px-6">
                      {editingId() === row.id ? (
                        <div class="flex items-center">
                          {tempEdit.product_image && (
                            <img 
                              src={tempEdit.product_image} 
                              alt={tempEdit.product_name || "Product"} 
                              class="w-10 h-10 object-cover rounded-md mr-3"
                            />
                          )}
                          <input
                            type="text"
                            value={tempEdit.product_name || ""}
                            onInput={(e) => handleEditChange("product_name", e.currentTarget.value)}
                            class="flex-1 hidden border border-gray-300 dark:border-gray-700 rounded focus:ring focus:ring-blue-300 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                          />
                        </div>
                      ) : (
                        <div class="flex items-center">
                          {row.product_image && (
                            <img 
                              src={row.product_image} 
                              alt={row.product_name} 
                              class="w-10 h-10 object-cover rounded-md mr-3"
                            />
                          )}
                          <span class="text-gray-900 dark:text-gray-100">{row.product_name}</span>
                        </div>
                      )}
                    </td>
                    <td class="py-3 px-6 text-gray-900 dark:text-gray-100">
                      {editingId() === row.id ? (
                        <input
                          type="datetime-local"
                    value={tempEdit.date ? new Date(tempEdit.date).toLocaleString('sv-SE').slice(0, 16) : ""}
                          onInput={(e) => handleEditChange("date", e.currentTarget.value)}
                          class="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded focus:ring focus:ring-blue-300 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                        />
                      ) : (
                        formatDateTime(row.date)
                      )}
                    </td>
                    <td class="py-3 px-6 text-gray-900 dark:text-gray-100">
                      {editingId() === row.id ? (
                        <input
                          type="number"
                          value={tempEdit.quantity || ""}
                          onInput={(e) => handleEditChange("quantity", parseInt(e.currentTarget.value))}
                          class="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded focus:ring focus:ring-blue-300 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                        />
                      ) : (
                        row.quantity
                      )}
                    </td>
                    <td class="py-3 px-6 text-gray-900 dark:text-gray-100">
                      {editingId() === row.id ? (
                        <input
                          type="number"
                          value={tempEdit.price || ""}
                          onInput={(e) => handleEditChange("price", parseFloat(e.currentTarget.value))}
                          class="w-full hidden px-2 py-1 border border-gray-300 dark:border-gray-700 rounded focus:ring focus:ring-blue-300 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                        />
                      ) : (
                        `${row.price.toFixed(3)} TND`
                      )}
                    </td>
                    <td class="py-3 px-6 font-semibold text-gray-900 dark:text-gray-100">
                      {editingId() === row.id ? (
                        <span>
                          {((tempEdit.quantity || row.quantity) * (tempEdit.price || row.price)).toFixed(3)} TND
                        </span>
                      ) : (
                        `${row.total_amount.toFixed(3)} TND`
                      )}
                    </td>
                    <td class="py-3 px-6 text-right">
                      {editingId() === row.id ? (
                        <div class="flex justify-end space-x-2">
                          <button
                            onClick={cancelEditing}
                            class="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            title="Annuler"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setShowModal(true)}
                            class="p-2 bg-sky-900 text-white rounded-lg hover:bg-sky-700 transition-colors"
                            title="Sauvegarder"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div class="flex justify-end space-x-2">
                          <button
                            onClick={() => startEditing(row.id, row)}
                            class="p-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-colors"
                            title="Modifier"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteRow(row.id)}
                            class="p-2 bg-rose-700 text-white rounded-lg hover:bg-rose-700 transition-colors"
                            title="Supprimer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </For>
            </Show>
          </tbody>
        </table>
      </div>

      {/* Pagination - Responsive Layout */}
      <div class="flex flex-col sm:flex-row items-center justify-between mt-6 px-4 space-y-4 sm:space-y-0">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {currentPage()} sur {totalPages()} • {filteredData.length} résultats
        </div>
        <div class="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <button
            disabled={currentPage() === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            class={`w-full sm:w-auto px-4 py-2 rounded-lg transition-all ${
              currentPage() === 1 
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                : "bg-sky-700 text-white hover:bg-sky-600"
            }`}
          >
            Précédent
          </button>
          
          <div class="flex flex-wrap justify-center gap-1">
            {Array.from({ length: totalPages() }, (_, i) => i + 1).map(page => (
              <button
                onClick={() => setCurrentPage(page)}
                class={`min-w-[40px] h-10 flex items-center justify-center transition-all rounded-lg ${
                  currentPage() === page
                    ? "bg-sky-700 text-white"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            disabled={currentPage() === totalPages()}
            onClick={() => setCurrentPage(p => Math.min(totalPages(), p + 1))}
            class={`w-full sm:w-auto px-4 py-2 rounded-lg transition-all ${
              currentPage() === totalPages()
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                : "bg-sky-700 text-white hover:bg-sky-600"
            }`}
          >
            Suivant
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Show when={showModal()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn p-4">
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-auto transform transition-transform duration-300 scale-95 animate-scaleIn">
            <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Confirmer les modifications</h2>
            <p class="mb-6 text-gray-700 dark:text-gray-300">Êtes-vous sûr de vouloir sauvegarder ces modifications? Cette action ne peut pas être annulée.</p>
            
            <div class="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowModal(false)}
                class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmSave}
                class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default TableComponent;
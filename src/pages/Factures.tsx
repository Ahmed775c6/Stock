import { createSignal, createEffect, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "@solidjs/router";
import Navbar from "../components/Navbar";
import InventoryInvoices from "../components/InventoryInvoices";

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

const Factures = () => {
  const [invoices, setInvoices] = createStore<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = createStore<Invoice[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = createSignal("sales");
  
  // Filters
  const [clientFilter, setClientFilter] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal<"Crédit" | "Khaless" | "Tous">("Tous");

  // Pagination
  const [currentPage, setCurrentPage] = createSignal(1);
  const itemsPerPage = 10;

  // Year and Month selection for invoice generation
  const [showYearForm, setShowYearForm] = createSignal(false);
  const [showMonthForm, setShowMonthForm] = createSignal(false);
  const [showClientForm, setShowClientForm] = createSignal(false);
  const [selectedYear, setSelectedYear] = createSignal(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = createSignal(new Date().getMonth() + 1);
  const [selectedClient, setSelectedClient] = createSignal("");
  const [dateType, setDateType] = createSignal<"year" | "month" | "full" | "none">("none");
  const [selectedDate, setSelectedDate] = createSignal("");

  // Expense invoice generation
  const [showExpensesYearForm, setShowExpensesYearForm] = createSignal(false);
  const [showExpensesMonthForm, setShowExpensesMonthForm] = createSignal(false);
  const [showExpensesDayForm, setShowExpensesDayForm] = createSignal(false);
  const [expensesSelectedYear, setExpensesSelectedYear] = createSignal(new Date().getFullYear());
  const [expensesSelectedMonth, setExpensesSelectedMonth] = createSignal(new Date().getMonth() + 1);
  const [expensesSelectedDay, setExpensesSelectedDay] = createSignal("");

  // Fetch invoices data
  createEffect(async () => {
    try {
      setLoading(true);
      const invoicesData: Invoice[] = await invoke("get_sales");
      setInvoices(invoicesData);
      setError("");
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError("Erreur lors du chargement des factures");
    } finally {
      setLoading(false);
    }
  });

  // Apply filters
  createEffect(() => {
    let result = [...invoices];
    
    // Client name filter
    if (clientFilter()) {
      result = result.filter(invoice => 
        invoice.client_name.toLowerCase().includes(clientFilter().toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter() !== "Tous") {
      result = result.filter(invoice => invoice.status === statusFilter());
    }
    
    setFilteredInvoices(result);
    if (currentPage() > totalPages() && totalPages() > 0) {
      setCurrentPage(totalPages());
    }
  });

  // Calculate pagination
  const totalPages = () => Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = () => {
    const start = (currentPage() - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
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

  // Handle preview click
  const handlePreview = (id: number) => {
    navigate(`/facture/${id}`);
  };

  // Handle year invoice generation
  const handleYearInvoice = () => {
    if (selectedYear()) {
      navigate(`/invoice/${selectedYear()}`);
      setShowYearForm(false);
    }
  };

  // Handle month invoice generation
  const handleMonthInvoice = () => {
    if (selectedYear() && selectedMonth()) {
      navigate(`/invoice/${selectedYear()}/${selectedMonth()}`);
      setShowMonthForm(false);
    }
  };

  // Handle client-specific invoice generation
  const handleClientInvoice = () => {
    if (selectedClient()) {
      let url = `/invoice/client/${selectedClient()}`;
      
      // Add date parameters based on selection
      if (dateType() === "year" && selectedYear()) {
        url += `?year=${selectedYear()}`;
      } else if (dateType() === "month" && selectedYear() && selectedMonth()) {
        url += `?year=${selectedYear()}&month=${selectedMonth()}`;
      } else if (dateType() === "full" && selectedDate()) {
        url += `?date=${selectedDate()}`;
      }
      
      navigate(url);
      setShowClientForm(false);
    }
  };

  // Handle expense year invoice generation
  const handleExpensesYearInvoice = () => {
    if (expensesSelectedYear()) {
      navigate(`/expenses-invoice/year/${expensesSelectedYear()}`);
      setShowExpensesYearForm(false);
    }
  };

  // Handle expense month invoice generation
  const handleExpensesMonthInvoice = () => {
    if (expensesSelectedYear() && expensesSelectedMonth()) {
    navigate(`/expenses-invoice/month/${expensesSelectedYear()}/${expensesSelectedMonth()}`);
      setShowExpensesMonthForm(false);
    }
  };

  // Handle expense day invoice generation
  const handleExpensesDayInvoice = () => {
    if (expensesSelectedDay()) {
      navigate(`/expenses-invoice/day/${expensesSelectedDay()}`);
      setShowExpensesDayForm(false);
    }
  };

  // Get unique client names from invoices
  const getClientNames = () => {
    const clients = new Set<string>();
    invoices.forEach(invoice => {
      clients.add(invoice.client_name);
    });
    return Array.from(clients).sort();
  };

  // Get available years from invoices
  const getAvailableYears = () => {
    const years = new Set<number>();
    invoices.forEach(invoice => {
      const year = new Date(invoice.created_at).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
  };

  // Generate month options
  const monthOptions = [
    { value: 1, label: "Janvier" },
    { value: 2, label: "Février" },
    { value: 3, label: "Mars" },
    { value: 4, label: "Avril" },
    { value: 5, label: "Mai" },
    { value: 6, label: "Juin" },
    { value: 7, label: "Juillet" },
    { value: 8, label: "Août" },
    { value: 9, label: "Septembre" },
    { value: 10, label: "Octobre" },
    { value: 11, label: "Novembre" },
    { value: 12, label: "Décembre" }
  ];

  return (
    <main class="w-full flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <section class="w-full flex flex-col min-h-screen">
        <Navbar />
        <div class="w-full h-full p-4 md:p-8 overflow-y-auto">

          {/* Invoice Generation Buttons - Show based on active tab */}
          <Show when={activeTab() === "sales"}>
            <div class="flex gap-4 mb-6 flex-wrap">
              <button
                onClick={() => setShowYearForm(true)}
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Facture d'une année
              </button>
              <button
                onClick={() => setShowMonthForm(true)}
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Facture d'un mois
              </button>
              <button
                onClick={() => setShowClientForm(true)}
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Facture spécifique client
              </button>
            </div>
          </Show>

          <Show when={activeTab() === "expenses"}>
            <div class="flex gap-4 mb-6 flex-wrap">
              <button
                onClick={() => setShowExpensesYearForm(true)}
                class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Dépenses d'une année
              </button>
              <button
                onClick={() => setShowExpensesMonthForm(true)}
                class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Dépenses d'un mois
              </button>
              <button
                onClick={() => setShowExpensesDayForm(true)}
                class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Dépenses d'un jour
              </button>
            </div>
          </Show>

          {/* Year Selection Modal */}
          <Show when={showYearForm()}>
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
                <h2 class="text-xl font-bold mb-4">Générer une facture annuelle</h2>
                <div class="mb-4">
                  <label class="block text-sm font-medium mb-2">Sélectionner l'année</label>
                  <select
                    value={selectedYear()}
                    onChange={(e) => setSelectedYear(parseInt(e.currentTarget.value))}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <For each={getAvailableYears()}>
                      {(year) => <option value={year}>{year}</option>}
                    </For>
                  </select>
                </div>
                <div class="flex justify-end gap-2">
                  <button
                    onClick={() => setShowYearForm(false)}
                    class="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleYearInvoice}
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Générer
                  </button>
                </div>
              </div>
            </div>
          </Show>

          {/* Month Selection Modal */}
          <Show when={showMonthForm()}>
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
                <h2 class="text-xl font-bold mb-4">Générer une facture mensuelle</h2>
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">Année</label>
                    <select
                      value={selectedYear()}
                      onChange={(e) => setSelectedYear(parseInt(e.currentTarget.value))}
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <For each={getAvailableYears()}>
                        {(year) => <option value={year}>{year}</option>}
                      </For>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">Mois</label>
                    <select
                      value={selectedMonth()}
                      onChange={(e) => setSelectedMonth(parseInt(e.currentTarget.value))}
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <For each={monthOptions}>
                        {(month) => <option value={month.value}>{month.label}</option>}
                      </For>
                    </select>
                  </div>
                </div>
                <div class="flex justify-end gap-2">
                  <button
                    onClick={() => setShowMonthForm(false)}
                    class="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleMonthInvoice}
                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Générer
                  </button>
                </div>
              </div>
            </div>
          </Show>

          {/* Client Selection Modal */}
          <Show when={showClientForm()}>
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96 max-h-[90vh] overflow-y-auto">
                <h2 class="text-xl font-bold mb-4">Générer une facture client</h2>
                
                {/* Client Selection */}
                <div class="mb-4">
                  <label class="block text-sm font-medium mb-2">Sélectionner le client</label>
                  <select
                    value={selectedClient()}
                    onChange={(e) => setSelectedClient(e.currentTarget.value)}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Sélectionner un client</option>
                    <For each={getClientNames()}>
                      {(client) => <option value={client}>{client}</option>}
                    </For>
                  </select>
                </div>
                
                {/* Date Type Selection */}
                <div class="mb-4">
                  <label class="block text-sm font-medium mb-2">Filtrer par date</label>
                  <select
                    value={dateType()}
                    onChange={(e) => setDateType(e.currentTarget.value as "year" | "month" | "full" | "none")}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="none">Aucun filtre de date</option>
                    <option value="year">Année seulement</option>
                    <option value="month">Année et mois</option>
                 
                  </select>
                </div>
                
                {/* Date Selection based on type */}
                <Show when={dateType() === "year"}>
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Sélectionner l'année</label>
                    <select
                      value={selectedYear()}
                      onChange={(e) => setSelectedYear(parseInt(e.currentTarget.value))}
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <For each={getAvailableYears()}>
                        {(year) => <option value={year}>{year}</option>}
                      </For>
                    </select>
                  </div>
                </Show>
                
                <Show when={dateType() === "month"}>
                  <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label class="block text-sm font-medium mb-2">Année</label>
                      <select
                        value={selectedYear()}
                        onChange={(e) => setSelectedYear(parseInt(e.currentTarget.value))}
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <For each={getAvailableYears()}>
                          {(year) => <option value={year}>{year}</option>}
                        </For>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2">Mois</label>
                      <select
                        value={selectedMonth()}
                        onChange={(e) => setSelectedMonth(parseInt(e.currentTarget.value))}
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <For each={monthOptions}>
                          {(month) => <option value={month.value}>{month.label}</option>}
                        </For>
                      </select>
                    </div>
                  </div>
                </Show>
                
                <Show when={dateType() === "full"}>
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Sélectionner la date</label>
                    <input
                      type="date"
                      value={selectedDate()}
                      onInput={(e) => setSelectedDate(e.currentTarget.value)}
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </Show>
                
                <div class="flex justify-end gap-2">
                  <button
                    onClick={() => setShowClientForm(false)}
                    class="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleClientInvoice}
                    disabled={!selectedClient()}
                    class={`px-4 py-2 text-white rounded-lg transition-colors ${
                      selectedClient() 
                        ? "bg-purple-600 hover:bg-purple-700" 
                        : "bg-purple-400 cursor-not-allowed"
                    }`}
                  >
                    Générer
                  </button>
                </div>
              </div>
            </div>
          </Show>

          {/* Expenses Year Selection Modal */}
          <Show when={showExpensesYearForm()}>
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
                <h2 class="text-xl font-bold mb-4">Générer un rapport de dépenses annuel</h2>
                <div class="mb-4">
                  <label class="block text-sm font-medium mb-2">Sélectionner l'année</label>
                  <select
                    value={expensesSelectedYear()}
                    onChange={(e) => setExpensesSelectedYear(parseInt(e.currentTarget.value))}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <For each={getAvailableYears()}>
                      {(year) => <option value={year}>{year}</option>}
                    </For>
                  </select>
                </div>
                <div class="flex justify-end gap-2">
                  <button
                    onClick={() => setShowExpensesYearForm(false)}
                    class="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleExpensesYearInvoice}
                    class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Générer
                  </button>
                </div>
              </div>
            </div>
          </Show>

          {/* Expenses Month Selection Modal */}
          <Show when={showExpensesMonthForm()}>
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
                <h2 class="text-xl font-bold mb-4">Générer un rapport de dépenses mensuel</h2>
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">Année</label>
                    <select
                      value={expensesSelectedYear()}
                      onChange={(e) => setExpensesSelectedYear(parseInt(e.currentTarget.value))}
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <For each={getAvailableYears()}>
                        {(year) => <option value={year}>{year}</option>}
                      </For>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">Mois</label>
                    <select
                      value={expensesSelectedMonth()}
                      onChange={(e) => setExpensesSelectedMonth(parseInt(e.currentTarget.value))}
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <For each={monthOptions}>
                        {(month) => <option value={month.value}>{month.label}</option>}
                      </For>
                    </select>
                  </div>
                </div>
                <div class="flex justify-end gap-2">
                  <button
                    onClick={() => setShowExpensesMonthForm(false)}
                    class="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleExpensesMonthInvoice}
                    class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Générer
                  </button>
                </div>
              </div>
            </div>
          </Show>

          {/* Expenses Day Selection Modal */}
          <Show when={showExpensesDayForm()}>
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
                <h2 class="text-xl font-bold mb-4">Générer un rapport de dépenses quotidien</h2>
                <div class="mb-4">
                  <label class="block text-sm font-medium mb-2">Sélectionner la date</label>
                  <input
                    type="date"
                    value={expensesSelectedDay()}
                    onInput={(e) => setExpensesSelectedDay(e.currentTarget.value)}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div class="flex justify-end gap-2">
                  <button
                    onClick={() => setShowExpensesDayForm(false)}
                    class="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleExpensesDayInvoice}
                    disabled={!expensesSelectedDay()}
                    class={`px-4 py-2 text-white rounded-lg transition-colors ${
                      expensesSelectedDay() 
                        ? "bg-yellow-600 hover:bg-yellow-700" 
                        : "bg-yellow-400 cursor-not-allowed"
                    }`}
                  >
                    Générer
                  </button>
                </div>
              </div>
            </div>
          </Show>

          {/* Rest of the component */}
          <div class="mb-6">
            <div class="border-b border-gray-200 dark:border-gray-700">
              <nav class="flex p-2 gap-3">
                <button
                  onClick={() => setActiveTab("sales")}
                  class={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab() === "sales"
                      ? "border-blue-500 bg-sky-700 text-white  dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Factures de Vente
                </button>
                <button
                  onClick={() => setActiveTab("expenses")}
                  class={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab() === "expenses"
                      ? "border-blue-500 bg-sky-700 text-white  dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Factures de Dépenses
                </button>
              </nav>
            </div>
          </div>

          {/* Show the appropriate content based on active tab */}
          <Show when={activeTab() === "sales"}>
            {/* Your existing sales invoices table */}
            {/* Filters Section */}
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client
                </label>
                <input
                  type="text"
                  placeholder="Rechercher client..."
                  value={clientFilter()}
                  onInput={(e) => setClientFilter(e.currentTarget.value)}
                  class="w-full bg-white text-gray-900 px-3  py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Statut
                </label>
                <select
                  value={statusFilter()}
                  onChange={(e) => setStatusFilter(e.currentTarget.value as "Crédit" | "Khaless" | "Tous")}
                  class="w-full px-3 py-2 border border-gray-300 outline-none dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                >
                  <option value="Tous">Tous</option>
                  <option value="Crédit">En attend</option>
                  <option value="Khaless">Payé</option>
                </select>
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
              <div class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
                {error()}
              </div>
            </Show>

            {/* Invoices Table */}
            <Show when={!loading() && !error()}>
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <table class="w-full">
                  <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th class="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ID
                      </th>
                      <th class="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Client
                      </th>
                      <th class="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Statut
                      </th>
                      <th class="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date et Heure
                      </th>
                      <th class="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Montant Total
                      </th>
                      <th class="py-4 px-6 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                    <Show when={paginatedInvoices().length > 0} fallback={
                      <tr>
                        <td colspan="6" class="py-8 px-6 text-center text-gray-500 dark:text-gray-400">
                          Aucune facture trouvée
                        </td>
                      </tr>
                    }>
                      <For each={paginatedInvoices()}>
                        {(invoice) => (
                          <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                            <td class="py-4 px-6 text-sm text-gray-900 dark:text-white">
                              #{invoice.id}
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-900 dark:text-white">
                              {invoice.client_name}
                            </td>
                            <td class="py-4 px-6">
                              <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                invoice.status === "Crédit" 
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" 
                                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              }`}>
                                {invoice.status === "Crédit" ? 'En attend' : "Payé"}
                              </span>
                            </td>
                            <td class="py-4 px-6 text-sm text-gray-900 dark:text-white">
                              {formatDateTime(invoice.created_at)}
                            </td>
                            <td class="py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                              {invoice.total_amount.toFixed(3)} TND
                            </td>
                            <td class="py-4 px-6 text-right">
                              <button
                                onClick={() => handlePreview(invoice.id)}
                                class="inline-flex items-center px-3 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                title="Prévisualiser la facture"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                                </svg>
                                Prévisualiser
                              </button>
                            </td>
                          </tr>
                        )}
                      </For>
                    </Show>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div class="flex items-center justify-between mt-6 px-4">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage()} sur {totalPages()} • {filteredInvoices.length} factures
                </div>
                <div class="flex space-x-2">
                  <button
                    disabled={currentPage() === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    class={`px-4 py-2 rounded-lg transition-all ${
                      currentPage() === 1 
                        ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                        : "bg-sky-600 text-white hover:bg-sky-700"
                    }`}
                  >
                    Précédent
                  </button>
                  
                  <div class="flex space-x-1">
                    {Array.from({ length: totalPages() }, (_, i) => i + 1).map(page => (
                      <button
                        onClick={() => setCurrentPage(page)}
                        class={`w-10 h-10 flex items-center justify-center transition-all rounded-lg ${
                          currentPage() === page
                            ? "bg-sky-600 text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    disabled={currentPage() === totalPages()}
                    onClick={() => setCurrentPage(p => Math.min(totalPages(), p + 1))}
                    class={`px-4 py-2 rounded-lg transition-all ${
                      currentPage() === totalPages()
                        ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                        : "bg-sky-600 text-white hover:bg-sky-700"
                    }`}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </Show>
          </Show>

          <Show when={activeTab() === "expenses"}>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 class="text-xl font-bold mb-4">Factures de Dépenses</h2>
              <p class="text-gray-600 dark:text-gray-300">
                Sélectionnez une option ci-dessus pour générer un rapport de dépenses.
              </p>
              {/* You can add expense-specific content here */}
            </div>
          </Show>

          <Show when={activeTab() === "inventory"}>
            <InventoryInvoices />
          </Show>
        </div>
      </section>
    </main>
  );
};

export default Factures;
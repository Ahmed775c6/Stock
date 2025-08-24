import { onMount, onCleanup, createSignal, Show } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataset,
  ChartOptions,
  ChartData
} from 'chart.js';

// Enregistrement des composants Chart.js
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface OrderItem {
  quantity: number;
  current_price: string;
  [key: string]: unknown;
}



// Modification de l'interface pour correspondre à vos données
interface OrderEntry {
  status: string;
  date: string;
  items?: OrderItem[];
  total_amount?: number;
  quantity?: number;
  price?: number;
  [key: string]: unknown;
}

interface ChartDatasetCustom extends ChartDataset<'line'> {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  borderWidth: number;
  fill: boolean;
  tension: number;
}

interface ChartDataCustom extends ChartData<'line'> {
  labels: string[] | number[];
  datasets: ChartDatasetCustom[];
}

// Fonction utilitaire pour parser les dates correctement
const parseDate = (dateString: string): Date => {
  // Pour le format "2025-07-30T20:56"
  if (dateString.includes('T')) {
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  }
  
  // Pour le format "30/07/2025, 20:56"
  const [datePart, timePart] = dateString.split(', ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

const OVChart = () => {
  const [data, setData] = createSignal<OrderEntry[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  
  let weeklyChartRef: HTMLCanvasElement | undefined;
  let monthlyChartRef: HTMLCanvasElement | undefined;
  let weeklyChartInstance: Chart<'line'> | undefined;
  let monthlyChartInstance: Chart<'line'> | undefined;

  // Fetch data from Rust backend
  const fetchSalesData = async (): Promise<OrderEntry[]> => {
    try {
      setLoading(true);
      setError(null);
      const salesData = await invoke<OrderEntry[]>('get_sales');
      console.log('fetching', salesData);
      setData(salesData);
      return salesData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sales data';
      setError(errorMessage);
      console.error('Error fetching sales data:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Destroy existing chart instances
  const destroyCharts = () => {
    if (weeklyChartInstance) {
      weeklyChartInstance.destroy();
      weeklyChartInstance = undefined;
    }
    if (monthlyChartInstance) {
      monthlyChartInstance.destroy();
      monthlyChartInstance = undefined;
    }
  };

  // Create chart instances
  const createCharts = () => {
    if (!weeklyChartRef || !monthlyChartRef) return;

    const chartOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y} TND`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            callback: function(value) {
              return value + ' ' + 'TND ';
            }
          }
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    };

    // Créer le graphique hebdomadaire
    weeklyChartInstance = new Chart(weeklyChartRef, {
      type: 'line',
      data: generateWeeklyData(),
      options: chartOptions
    });

    // Créer le graphique mensuel
    monthlyChartInstance = new Chart(monthlyChartRef, {
      type: 'line',
      data: generateMonthlyData(),
      options: chartOptions
    });
  };

  // Générer les données hebdomadaires
  const generateWeeklyData = (): ChartDataCustom => {
    const orderData = data();
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const revenueByDay: Record<string, number> = Object.fromEntries(days.map(day => [day, 0]));

    orderData.forEach((entry: OrderEntry) => {
      const entryDate = parseDate(entry.date);
      if (entryDate >= startOfWeek && entryDate <= endOfWeek) {
        const dayIndex = (entryDate.getDay() + 6) % 7;
        const dayName = days[dayIndex];
        
        let revenue = 0;
        if (entry.total_amount) {
          revenue = entry.total_amount;
        } else if (entry.price && entry.quantity) {
          revenue = entry.price * entry.quantity;
        } else if (entry.items) {
          revenue = entry.items.reduce((sum: number, item: OrderItem) =>
            sum + (item.quantity * parseFloat(item.current_price)), 0);
        }
        
        revenueByDay[dayName] += revenue;
      }
    });

    return {
      labels: days,
      datasets: [{
        label: 'Revenu',
        data: days.map(day => revenueByDay[day]),
        borderColor: '#FF69B4',
        backgroundColor: 'rgba(255, 105, 180, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  };

  // Générer les données mensuelles
  const generateMonthlyData = (): ChartDataCustom => {
    const orderData = data();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const revenueByDay: number[] = new Array(daysInMonth).fill(0);

    orderData.forEach((entry: OrderEntry) => {
      const entryDate = parseDate(entry.date);
      if (entryDate.getMonth() === month && entryDate.getFullYear() === year) {
        const day = entryDate.getDate() - 1;
        
        let revenue = 0;
        if (entry.total_amount) {
          revenue = entry.total_amount;
        } else if (entry.price && entry.quantity) {
          revenue = entry.price * entry.quantity;
        } else if (entry.items) {
          revenue = entry.items.reduce((sum: number, item: OrderItem) =>
            sum + (item.quantity * parseFloat(item.current_price)), 0);
        }
        
        revenueByDay[day] += revenue;
      }
    });

    return {
      labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      datasets: [{
        label: 'Revenu',
        data: revenueByDay,
        borderColor: '#FF69B4',
        backgroundColor: 'rgba(255, 105, 180, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  };

  // Étiquettes de date dynamiques
  const currentWeekNumber = Math.ceil((new Date().getDate() + new Date().getDay()) / 7);
  const currentMonth = new Date().toLocaleString('fr-FR', { month: 'long' });
  const currentYear = new Date().getFullYear();

  onMount(async () => {
    await fetchSalesData();
    
    // Wait for the next tick to ensure refs are set
    setTimeout(() => {
      createCharts();
    }, 0);
  });

  onCleanup(() => {
    destroyCharts();
  });

  // Refresh function to reload data
  const refreshData = async () => {
    try {
      await fetchSalesData();
      
      // Wait for the next tick to ensure data is updated
      setTimeout(() => {
        // Destroy existing charts and recreate them
        destroyCharts();
        createCharts();
      }, 0);
    } catch (err) {
      console.error('Error in refreshData:', err);
    }
  };

  return (
    <div class="customer-tables bg-white dark:bg-gray-900 w-full p-4 rounded-md h-[80vh] overflow-auto">
      <Show when={!loading() && !error()} fallback={
        <div class="flex items-center justify-center h-full">
          <Show when={loading()}>
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
              <p class="mt-4 text-gray-600 dark:text-gray-300">Chargement des données...</p>
            </div>
          </Show>
          
          <Show when={error()}>
            <div class="text-center">
              <p class="text-red-600 dark:text-red-400 mb-4">Erreur: {error()}</p>
              <button 
                onClick={refreshData}
                class="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
              >
                Réessayer
              </button>
            </div>
          </Show>
        </div>
      }>
        <div class="flex justify-between items-center mb-4">
          <h2 class="w-full p-2 jsh bg-gray-200 text-black dark:text-white dark:bg-gray-600">
            Aperçu des revenus
          </h2>
          <button 
            onClick={refreshData}
            class="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1 rounded text-sm"
            title="Actualiser les données"
          >
            Actualiser
          </button>
        </div>
        
        <div class="revenue-charts w-full p-2">
          {/* Graphique des revenus hebdomadaires */}
          <div class="chart-container mb-8">
            <h3 class="text-lg font-semibold mb-2">
              Revenus de cette semaine (Semaine {currentWeekNumber})
            </h3>
            <div style={{ height: '300px', position: 'relative' }}>
              <canvas ref={weeklyChartRef} />
            </div>
          </div>

          {/* Graphique des revenus mensuels */}
          <div class="chart-container">
            <h3 class="text-lg font-semibold mb-2">
              Revenus de ce mois ({currentMonth} {currentYear})
            </h3>
            <div style={{ height: '300px', position: 'relative' }}>
              <canvas ref={monthlyChartRef} />
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default OVChart;
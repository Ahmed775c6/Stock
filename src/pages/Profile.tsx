import { createSignal, For } from "solid-js";
import Navbar from "../components/Navbar";
import TableComponent from "../components/Table";
import MetricsDashboard from "../components/Cards";
import OVChart from "../components/LineChart";
const Profile = () => {
  // Données d'exemple pour les cartes de métriques


  // État du calendrier
  const [currentDate, setCurrentDate] = createSignal(new Date());
  const [selectedDate, setSelectedDate] = createSignal<Date | null>(null);

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Noms des mois en français
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  // Noms des jours en français (abréviations)
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate());
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate());
    const firstDay = firstDayOfMonth(currentDate());
    const today = new Date();

    // Cellules vides pour les jours avant le premier jour du mois
    for (let i = 0; i < firstDay; i++) {
      days.push(<div class="h-10"></div>);
    }

    // Cellules pour chaque jour du mois
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(
        currentDate().getFullYear(),
        currentDate().getMonth(),
        day
      );
      const isSelected = selectedDate() && isSameDay(date, selectedDate()!);
      const isToday = isSameDay(date, today);

      days.push(
        <div
          onClick={() => setSelectedDate(date)}
          class={`p-2 w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200
            ${isSelected ? "bg-blue-600 text-white scale-105" : ""}
            ${isToday && !isSelected ? "border-2 bg-blue-500" : ""}
            hover:bg-gray-200 dark:hover:bg-gray-700 transform transition-transform`}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <main class="w-full flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-card {
            animation: fadeInUp 0.6s ease-out forwards;
            opacity: 0;
          }
        `}
      </style>
      
      <section class="w-full flex flex-col min-h-screen">
        <Navbar />
        <div class="w-full h-full p-4 md:p-8 overflow-y-auto">
          <h1 class="text-2xl text-left md:text-3xl font-bold mb-6 capitalize">aperçu</h1>

  
      
          

<MetricsDashboard/>

        
    <TableComponent/>
          {/* Section Calendrier */}
          <div class="grid p-4  grid-cols-1 lg:grid-cols-2 gap-3">
                  
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-xl">
              <h2 class="text-xl font-semibold mb-4">Calendrier</h2>
              <div class="space-y-4">
                {/* En-tête du calendrier */}
                <div class="flex justify-between items-center">
                  <button
                    onClick={() => navigateMonth(-1)}
                    class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h3 class="text-lg font-medium">
                    {monthNames[currentDate().getMonth()]} {currentDate().getFullYear()}
                  </h3>
                  <button
                    onClick={() => navigateMonth(1)}
                    class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Noms des jours */}
                <div class="grid grid-cols-7 gap-1 text-center">
                  <For each={dayNames}>
                    {(day) => (
                      <div class="text-sm font-medium opacity-70 py-2">
                        {day}
                      </div>
                    )}
                  </For>
                </div>

                {/* Jours du calendrier */}
                <div class="grid grid-cols-7 gap-1 text-center">
                  {renderCalendarDays()}
                </div>
              </div>
            </div>
<div class="w-full bg-gray-100 h-full p-2 dark:bg-gray-800">
<OVChart />
</div>
            {/* Détails de la date sélectionnée 
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-xl">
              <h2 class="text-xl font-semibold mb-4">Planning</h2>
              {selectedDate() ? (
                <div>
                  <h3 class="text-lg font-medium mb-4">
                    {selectedDate()?.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <div class="space-y-3">
                    <div class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg transition-transform duration-200 hover:scale-[1.02]">
                      <p class="font-medium">Réunion d'équipe</p>
                      <p class="text-sm opacity-80">10:00 - 11:30</p>
                    </div>
                    <div class="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg transition-transform duration-200 hover:scale-[1.02]">
                      <p class="font-medium">Déjeuner avec client</p>
                      <p class="text-sm opacity-80">12:30 - 14:00</p>
                    </div>
                    <div class="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg transition-transform duration-200 hover:scale-[1.02]">
                      <p class="font-medium">Revue de projet</p>
                      <p class="text-sm opacity-80">15:00 - 16:30</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div class="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
                  Sélectionnez une date pour voir le planning
                </div>
              )}
            </div>
            
            
            */}
        
          </div>

        </div>
      </section>
    </main>
  );
};

export default Profile;
import { createResource, For, Show } from 'solid-js';
import { fetchMetrics } from '../services/metricsService';


export default function MetricsDashboard() {
  const [metricsResource] = createResource(fetchMetrics);

  return (
    <div>
      <Show when={metricsResource.loading}>
        <div class="flex justify-center w-full items-center h-32">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Show>

      <Show when={metricsResource.error}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {metricsResource.error.message}
        </div>
      </Show>

      <Show when={metricsResource()}>
        <div class="grid grid-cols-1 w-full sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <For each={metricsResource()}>
            {(metric, i) => (
              <div 
                class={`p-6 rounded-md w-full shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${metric.color} animate-card`}
                style={`animation-delay: ${i() * 0.15}s`}
              >
                <div class="flex justify-between items-start">
                  <div>
                    <p class="text-sm font-medium opacity-80">{metric.title}</p>
                    <p class="text-2xl font-bold mt-1">{metric.value}</p>
             
                  </div>
                  <div class="text-3xl transition-transform duration-300 hover:scale-110">
                    {metric.icon}
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
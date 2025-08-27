import { createSignal, createResource, For, Show } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from '@solidjs/router';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  costPrice: number;
  brand: string;
  material: string;
  image: string | null;
  created_at: string;
  updated_at: string;
}

const ProductsTable = () => {
  const navigate = useNavigate();
  const [search, setSearch] = createSignal('');
  const [selectedBrand, setSelectedBrand] = createSignal('all');
  const [selectedMaterial, setSelectedMaterial] = createSignal('all');
  const [currentPage, setCurrentPage] = createSignal(1);
  const [productToDelete, setProductToDelete] = createSignal<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = createSignal(false);
  const itemsPerPage = 10;

  const [products, { mutate }] = createResource(async () => {
    try {
      return await invoke('get_products') as Product[];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  });

  const filteredProducts = () => {
    const filtered = products()?.filter(product =>
      product.name.toLowerCase().includes(search().toLowerCase()) &&
      (selectedBrand() === 'all' || product.brand === selectedBrand()) &&
      (selectedMaterial() === 'all' || product.material === selectedMaterial())
    ) || [];
    return filtered;
  };

  const paginatedProducts = () => {
    const start = (currentPage() - 1) * itemsPerPage;
    return filteredProducts().slice(start, start + itemsPerPage);
  };

  const totalPages = () => Math.ceil(filteredProducts().length / itemsPerPage);

  const uniqueBrands = () => [...new Set(products()?.map(p => p.brand) || [])];
  const uniqueMaterials = () => [...new Set(products()?.map(p => p.material) || [])];

  const openDeleteDialog = (id: string) => {
    setProductToDelete(id);
    setShowConfirmDialog(true);
  };

  const closeDeleteDialog = () => {
    setShowConfirmDialog(false);
    setProductToDelete(null);
  };

  const confirmDelete = async () => {
    const id = productToDelete();
    if (!id) return;

    try {
      await invoke('delete_product', { id });
      // Refresh products after deletion
      mutate((currentProducts) => currentProducts?.filter(product => product.id !== id) || []);
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting product:', error);
      closeDeleteDialog();
    }
  };

  // Get the product name for the confirmation dialog
  const getProductName = () => {
    const id = productToDelete();
    if (!id) return '';
    const product = products()?.find(p => p.id === id);
    return product?.name || '';
  };

  return (
    <div class="container mx-auto px-4 bg-white dark:bg-gray-800">
      <div class="rounded-lg shadow-md bg-fray-100 p-2 dark:bg-gray-800">
        <h1 class="text-2xl font-semibold text-left dark:text-gray-200 mb-6">Gestion des Produits</h1>
        
        {/* Filters and Search */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Rechercher par nom..."
            class="px-4 py-2 border rounded-sm text-gray-900 bg-white dark:text-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
          
          <select
            class="px-4 py-2 rounded-sm outline-none shadow-md dark:text-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedBrand()}
            onChange={(e) => setSelectedBrand(e.currentTarget.value)}
          >
            <option value="all">Toutes les marques</option>
            <For each={uniqueBrands()}>
              {(brand) => <option value={brand}>{brand}</option>}
            </For>
          </select>

          <select
            class="px-4 py-2 rounded-sm dark:text-white shadow-md outline-none dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedMaterial()}
            onChange={(e) => setSelectedMaterial(e.currentTarget.value)}
          >
            <option value="all">Tous les matériaux</option>
            <For each={uniqueMaterials()}>
              {(material) => <option value={material}>{material}</option>}
            </For>
          </select>
        </div>

        {/* Products Table */}
        <div class="overflow-x-auto">
          <table class="w-full table-auto">
            <thead>
              <tr class="bg-gradient-to-r from-sky-700 to-sky-500 text-white uppercase text-sm leading-normal">
                <th class="py-3 px-6 text-left">Image</th>
                <th class="py-3 px-6 text-left">Nom</th>
                <th class="py-3 px-6 text-center">Prix</th>
                <th class="py-3 px-6 text-center">Quantité</th>
                <th class="py-3 px-6 text-center">Marque</th>
                <th class="py-3 px-6 text-center">Matériau</th>
                <th class="py-3 px-6 text-center">Date création</th>
                <th class="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="text-gray-600 text-sm">
              <Show when={!products.loading} fallback={<tr><td colSpan={8} class="text-center text-gray-900 dark:text-white py-4">Chargement...</td></tr>}>
                <For each={paginatedProducts()}>
                  {(product) => (
                    <tr class="border-b text-gray-900 dark:border-gray-200 dark:text-gray-100 dark:hover:bg-gray-500">
                      <td class="py-3 px-6">
                        <Show when={product.image}>
                          <img src={product.image!} class="w-12 h-12 object-cover rounded" />
                        </Show>
                      </td>
                      <td class="py-3 px-6">{product.name}</td>
                      <td class="py-3 px-6 text-center">{product.price} TND</td>
                      <td class="py-3 px-6 text-center">{product.quantity}</td>
                      <td class="py-3 px-6 text-center">{product.brand}</td>
                      <td class="py-3 px-6 text-center">{product.material}</td>
                      <td class="py-3 px-6 text-center">
                        {new Date(product.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td class="py-3 px-6 text-center">
                        <div class="flex item-center justify-center space-x-2">
                          <button
                            onClick={() => navigate(`/produit/modify/${product.id}`)}
                            class=" bg-gray-200 text-blue-500 hover:text-blue-700 dark:bg-gray-700 p-2"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => openDeleteDialog(product.id)}
                            class="text-red-500 bgt-gray-200 hover:text-red-700 p-2 dark:bg-gray-900"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </Show>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div class="flex justify-center mt-6 p-4">
          <div class="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage() === 1}
              class="px-3 py-1 rounded border disabled:opacity-50 text-white"
            >
              Précédent
            </button>
            
            <For each={Array.from({ length: totalPages() }, (_, i) => i + 1)}>
              {(page) => (
                <button
                  onClick={() => setCurrentPage(page)}
                  class={`px-3 py-1 rounded border ${
                    currentPage() === page ? 'bg-blue-500 text-white' : 'text-white'
                  }`}
                >
                  {page}
                </button>
              )}
            </For>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages(), p + 1))}
              disabled={currentPage() === totalPages()}
              class=" px-3 py-1 rounded border disabled:opacity-50 text-white"
            >
              Suivant
            </button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Show when={showConfirmDialog()}>
          <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="text-gray-900 bg-white shadow-sm dark:bg-gray-800 p-6 rounded-lg  max-w-md w-full mx-4">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Confirmation de suppression
              </h3>
              <p class=" text-gray-800 dark:text-gray-200 mb-6">
                Êtes-vous sûr de vouloir supprimer le produit "{getProductName()}" ? 
                Cette action est irréversible.
              </p>
              <div class="flex justify-end space-x-4">
                <button
                  onClick={closeDeleteDialog}
                  class="px-4 py-2 bg-gray-200 text-gray-900  dark:bg-gray-600 dark:text-white rounded dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default ProductsTable;
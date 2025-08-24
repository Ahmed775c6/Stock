import Navbar from "../components/Navbar"
import  {A} from "@solidjs/router"
import ProductsTable from "../components/ProductsTable"

const Products = () => {
  return (
       <main class="w-full flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">

      <section class="w-full flex flex-col min-h-screen">
        <Navbar />
        <div class="w-full h-full p-4 md:p-8 overflow-y-auto">
<div class="w-full p-2  bg-gray-200 dark:bg-gray-600 flex justify-between">
    <h1 class="text-left font-semibold text-lg p-2 dark:text-white text-gray-900">Produits </h1>
<div class="flex gap-3">
      <A href="/produits/new" class="p-2 bg-sky-700  text-white rounded-sm  text-center flex justify-center items-center hover:text-white">Ajouter Nouveau</A>

</div>
</div>

   <ProductsTable/>
        </div>
      </section>
    </main>
  )
}

export default Products
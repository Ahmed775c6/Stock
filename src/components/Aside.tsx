import { createSignal, Show } from "solid-js";

import { A, useLocation } from "@solidjs/router";

const Aside = () => {
 const [isOpen, setIsOpen] = createSignal(false);
  const location = useLocation();


  // Convert pathname to match your link names
  const getActiveLink = () => {
    const path = location.pathname.split('/')[1] || 'dashboard';
    return path.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const [activeLink, setActiveLink] = createSignal(getActiveLink());
  const links = [
    { name: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { name: "Storage", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
    { name: "Account Setting", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
   
  ];

  const toggleMenu = () => setIsOpen(!isOpen());

  return (
    <>
      {/* Desktop Sidebar */}
      <aside class="hidden lg:flex flex-col w-[20%] h-screen px-4 py-8 bg-white border-r rtl:border-r-0 rtl:border-l dark:bg-gray-900 dark:border-gray-700  transition-all duration-300 ease-in-out">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-white">Dashboard</h2>
        </div>

        <div class="flex flex-col justify-between flex-1 mt-6">
          <nav>
            {links.map((link) => (
              <A
                href={`/${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                class={`flex items-center px-4 py-3 mt-2 text-gray-600 transition-colors duration-300 
                  transform rounded-lg dark:text-gray-400 hover:bg-gray-100
                   dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700
                   ${
                  activeLink() === link.name
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    : ""
                }`}
                onClick={() => setActiveLink(link.name)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d={link.icon}
                  />
                </svg>

                <span class="mx-4 font-medium">{link.name}</span>
              </A>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div class="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-700 z-50">
        <div class="flex justify-around">
          {links.map((link) => (
            <A
              href={`/${link.name.toLowerCase().replace(/\s+/g, '-')}`}
              class={`flex flex-col items-center justify-center p-3 text-xs ${
                activeLink() === link.name
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
              onClick={() => setActiveLink(link.name)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d={link.icon}
                />
              </svg>
              <span class="mt-1">{link.name.split(' ')[0]}</span>
            </A>
          ))}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <Show when={isOpen()}>
        <div
          class="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={toggleMenu}
        ></div>
      </Show>

      {/* Mobile Sidebar */}
      <aside
        class={`fixed inset-y-0 z-50 flex-shrink-0 w-64 overflow-y-auto bg-white dark:bg-gray-900 md:hidden transition-transform duration-300 ease-in-out ${
          isOpen() ? "transform translate-x-0" : "transform -translate-x-full"
        }`}
      >
        <div class="py-4 text-gray-500 dark:text-gray-400">
          <div class="ml-6">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white">
              Dashboard
            </h2>
            
          </div>
    
          <nav class="mt-6">
            {links.map((link) => (
              <A
                href={`/${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                class={`flex items-center px-6 py-3 mt-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 ${
                  activeLink() === link.name
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    : ""
                }`}
                onClick={() => {
                  setActiveLink(link.name);
                  toggleMenu();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d={link.icon}
                  />
                </svg>

                <span class="mx-4 font-medium">{link.name}</span>
              </A>
            ))}

          </nav>
        </div>
      </aside>
 
    </>
  );
};

export default Aside;
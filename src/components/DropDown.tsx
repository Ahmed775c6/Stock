import {  Show  } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { useNavigate } from "@solidjs/router";
import { invoke } from "@tauri-apps/api/core";
const DropDown = (props: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await invoke("logout");
      navigate("/");  // Redirect to login page
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }
  const getActiveLink = () => {
    const path = location.pathname.split('/')[1] || 'profile';
    return path.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const links = [
    { name: "Profile", link: 'profile', icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Produits", link: 'produits', icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { name: "factures", link: 'factures', icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
    { name: "Compte Securité", link: 'compte', icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
  ];

  return (
    <Show when={props.isOpen}>
      <div class="w-max absolute h-min top-16 right-0 bg-gray-100 shadow-md dark:bg-gray-700 rounded-sm z-10 flex flex-col gap-0 p-6 
                  transition-all duration-300 ease-out
                  opacity-0 translate-y-[-10px] 
                  animate-fade-in animate-duration-300"
           classList={{
             "opacity-100 translate-y-0": props.isOpen
           }}>
        <h1 class=" text-gray-800 dark:text-gray-300 text-left font-semibold">Menu</h1>
        {links.map((link) => {
          const isActive = getActiveLink().toLocaleLowerCase() === link.link;
          return (
            <A
              href={`/${link.link.toLowerCase()}`}
              class={`flex items-center px-6 py-3 mt-2 transition-colors 
                      duration-300 transform rounded-sm hover:bg-gray-100
                      dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700
                      ${isActive 
                        ? ' bg-sky-500 text-white dark:bg-gray-800 dark:text-white' 
                        : 'dark:bg-gray-600 dark:text-gray-400 text-gray-300'}`}
              onClick={props.onClose}
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
          );
        })}
        <button
          onClick={handleLogout}
          class="bg-rose-500 hover:bg-rose-700 mt-2 text-white font-medium py-2 px-4 rounded-sm transition-colors"
        >
          Déconnecter
        </button>
      </div>
    </Show>
  );
};

export default DropDown;
import { createSignal } from "solid-js";
import DropDown from "./DropDown";
import { ThemeProvider } from "../context/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = createSignal(false);
  
  const toggleDropdown = () => setIsOpen(!isOpen());
  const closeDropdown = () => setIsOpen(false);

  return (
<ThemeProvider>

      <nav class="w-full p-2 bg-gray-200 shadow-sm dark:bg-gray-800 flex justify-between">
      <p class="p-2"></p>
      <div class="relative flex gap-3">
 <ThemeToggle/>
        <img 
          src="/avatar.png" 
          alt="avatar" 
          class="bg-gray-200 rounded-full  w-10 h-10 cursor-pointer"
          style={{
            "border-color" : "blue"
          }} 
          loading="lazy" 
          onClick={toggleDropdown}
        />
        <DropDown isOpen={isOpen()} onClose={closeDropdown} />
      </div>
    </nav>
</ThemeProvider>
  );
};

export default Navbar;
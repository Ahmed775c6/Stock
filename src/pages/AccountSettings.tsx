import { createSignal, Show } from "solid-js";
import Navbar from "../components/Navbar";
import { invoke } from "@tauri-apps/api/core";

type FormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const AccountSettings = () => {

  const [formData, setFormData] = createSignal<FormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = createSignal("");
  const [passwordSuccess, setPasswordSuccess] = createSignal("");



  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setFormData({
      ...formData(),
      [target.name]: target.value,
    });
  };

const handlePasswordSubmit = async (e: Event) => {
  e.preventDefault();
  setPasswordError("");
  setPasswordSuccess("");

  if (formData().newPassword !== formData().confirmPassword) {
    setPasswordError("New passwords do not match");
    return;
  }

  if (formData().newPassword.length < 8) {
    setPasswordError("Password must be at least 8 characters");
    return;
  }

  try {
    await invoke("change_password", {
      currentPassword: formData().currentPassword,
      newPassword: formData().newPassword,
    });
    
    setPasswordSuccess("Password changed successfully!");
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  } catch (error: any) {
    setPasswordError(error.toString() || "Failed to change password");
  }
};

  return (
    <main class="w-full flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">

      <section class="w-full flex flex-col min-h-screen">
        <Navbar />
        <div class="w-full h-full p-4 md:p-8 overflow-y-auto">


          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      

            <div class="bg-white dark:bg-gray-800 rounded-md shadow-md p-6 mb-4 ">
                  <Show when={passwordError()}>
                  <div class="text-red-600 text-lg dark:text-red-400">
                    {passwordError()}
                  </div>
                </Show>

                <Show when={passwordSuccess()}>
                  <div class="text-green-600 dark:text-green-400 text-lg">
                    {passwordSuccess()}
                  </div>
                </Show>
              <h2 class="text-xl font-semibold mb-4">Changer le mot de passe</h2>
              <form onSubmit={handlePasswordSubmit} class="space-y-4">
                <div>
                  <label
                    for="currentPassword"
                    class="block text-sm font-medium mb-1"
                  >
               
Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData().currentPassword}
                    onInput={handleInputChange}
                    required
class="w-full bg-gray-100 text-gray-900  px-3 py-2 border border-none dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label
                    for="newPassword"
                    class="block text-sm font-medium mb-1"
                  >
                  
Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData().newPassword}
                    onInput={handleInputChange}
                    required
                    class="w-full bg-gray-100 text-gray-900  px-3 py-2 border border-none dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label
                    for="confirmPassword"
                    class="block text-sm font-medium mb-1"
                  >
              
Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData().confirmPassword}
                    onInput={handleInputChange}
                    required
                 class="w-full bg-gray-100 text-gray-900  px-3 py-2 border border-none dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                </div>

            

                <button
                  type="submit"
                  class="w-full bg-sky-700 hover:bg-sky-800 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                
Changer le mot de passe
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AccountSettings;
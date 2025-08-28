import { createSignal ,Show,onMount  } from "solid-js";
import logo from "./assets/logo.png";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "@solidjs/router";

import "./App.css";

function App() {
  const navigate = useNavigate(); 
  const [name, setName] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal("");
  const [checkingSession, setCheckingSession] = createSignal(true);

  // Check session on component mount
  onMount(async () => {
    try {
      const isValid = await invoke<boolean>("check_session");
      console.log('check !:',isValid)
      if (isValid) {
        navigate('/profile');
      }
    } catch (err) {
      console.error("Session check error:", err);
    } finally {
      setCheckingSession(false);
    }
  });

  async function authenticate(e: Event) {
    e.preventDefault();
    setError("");

    
    if (!name() || !password()) {
      setError("Please enter both username and password");
      return;
    }

    try {
      setLoading(true);
      const response = await invoke("authenticate", { 
        username: name(), 
        password: password() 
      });
    
 if(response){
     navigate('/profile'); 
 }else{
  setError('something went wrong ! , try again ...')
 }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      console.log('error !:', err)
    } finally {
      setLoading(false);
    }
  }


  return (

            <main class="w-full flex min-h-screen flex-col gap-3 justify-center items-center">
     <Show when={!checkingSession()} fallback={
        <div class="text-lg">Checking session...</div>
      }>
      <h1 class="text-5xl font-semibold text-violet-500">Welcome Back</h1>

      <div class="row">
 
      
          <img src={logo} class="logo solid" alt="Solid logo" />
     
      </div>
      <p>Login to your account </p>
       <Show when={error()}>
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error()}
          </div>
        </Show>
      <form
        class=" w-full justify-center p-4 flex flex-col gap-3 max-w-md"
        onSubmit={authenticate}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="user name ..."
        />
           <input
          id="password"
          type="password"
          onChange={(e) => setPassword(e.currentTarget.value)}
          
        />
   <button
              
              type="submit"
              disabled={loading()}
            >
              <Show when={!loading()} fallback={"Authenticating..."}>
                Sign In
              </Show>
            </button>

      </form></Show>
      <footer class="w-full p-2 bg-violet-700 text-white absolute bottom-0 left-0 text-center">Devolopped by Chouikh_Ahmed & Sassi_Koussai @2025</footer>
   
    </main>
     

  );
}

export default App;

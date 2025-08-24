// src/context/ThemeContext.tsx
import { createContext, useContext, createSignal, onMount, onCleanup, Accessor } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Accessor<Theme>;
  resolvedTheme: Accessor<ResolvedTheme>;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>();

export function ThemeProvider(props: { children: any }) {
  const [theme, setThemeSignal] = createSignal<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = createSignal<ResolvedTheme>('light');

  // Get system theme preference
  function getSystemTheme(): ResolvedTheme {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  }

  function updateResolvedTheme() {
    const currentTheme = theme();
    if (currentTheme === 'system') {
      setResolvedTheme(getSystemTheme());
    } else {
      setResolvedTheme(currentTheme);
    }
  }

  // Update document theme classes
  function updateDocumentTheme() {
    const themeClass = resolvedTheme();
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(themeClass);
  }

  // Initialize theme from backend
  onMount(async () => {
    try {
      const savedTheme = await invoke<string>('get_system_theme');
      if (['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeSignal(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Failed to load theme from backend:', error);
    }
    
    updateResolvedTheme();
    updateDocumentTheme();
  });

  // Set up media query listener for system theme changes
  onMount(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme() === 'system') {
        updateResolvedTheme();
        updateDocumentTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    onCleanup(() => {
      mediaQuery.removeEventListener('change', handleChange);
    });
  });

  const setTheme = async (newTheme: Theme) => {
    setThemeSignal(newTheme);
    try {
      await invoke('set_theme_preference', { theme: newTheme });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
    updateResolvedTheme();
    updateDocumentTheme();
  };

  const toggleTheme = () => {
    const current = theme();
    if (current === 'system') {
      setTheme(getSystemTheme() === 'dark' ? 'light' : 'dark');
    } else if (current === 'dark') {
      setTheme('light');
    } else {
      setTheme('system');
    }
  };

  const store: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={store}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
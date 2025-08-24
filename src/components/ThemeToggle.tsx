// src/components/ThemeToggle.tsx
import { useTheme } from "../context/ThemeContext";

export function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    const currentTheme = theme();
    if (currentTheme === 'system') {
      return resolvedTheme() === 'dark' ? '🌙' : '☀️';
    }
    return currentTheme === 'dark' ? '🌙' : '☀️';
  };

  const getTitle = () => {
    const currentTheme = theme();
    if (currentTheme === 'system') {
      return `System (${resolvedTheme()})`;
    }
    return currentTheme === 'dark' ? 'Dark' : 'Light';
  };

  const getAriaLabel = () => {
    const currentTheme = theme();
    if (currentTheme === 'system') {
      return `Switch theme from system (${resolvedTheme()})`;
    }
    return `Switch from ${currentTheme} mode`;
  };

  return (
    <button
      onClick={toggleTheme}
      class="w-10 h-10 flex justify-center items-center rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
      title={`Toggle theme (Current: ${getTitle()})`}
      aria-label={getAriaLabel()}
    >
      <span class="text-xl" aria-hidden="true">
        {getIcon()}
      </span>
    </button>
  );
}
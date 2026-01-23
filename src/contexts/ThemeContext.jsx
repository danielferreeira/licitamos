import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext"; // Importamos o Auth para saber quem está logado
import { api } from "../services/api";   // Importamos a API para salvar no banco

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const { user } = useAuth(); 

  // 1. Inicializa com o localStorage (para a tela de login não piscar)
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("licitamos-theme") || "system";
  });

  // 2. Efeito visual: Aplica a classe CSS no HTML sempre que o tema mudar
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let finalTheme = theme;
    if (theme === "system") {
      finalTheme = window.matchMedia("(prefers-color-scheme: dark)").matches 
        ? "dark" 
        : "light";
    }

    root.classList.add(finalTheme);
    localStorage.setItem("licitamos-theme", theme); // Mantém backup local
  }, [theme]);

  // 3. Efeito de Sincronia: Quando o usuário LOGAR, busca o tema dele no banco
  useEffect(() => {
    async function fetchUserTheme() {
      if (user) {
        try {
          const profile = await api.getProfile();
          // Se o usuário tem um tema salvo no banco, usamos ele
          if (profile?.theme) {
            setThemeState(profile.theme);
          }
        } catch (error) {
          console.error("Erro ao sincronizar tema do usuário", error);
        }
      }
    }
    fetchUserTheme();
  }, [user]); // Roda sempre que o usuário mudar (login/logout)

  // 4. Função Wrapper: Atualiza o estado E salva no banco
  const setTheme = async (newTheme) => {
    setThemeState(newTheme); // Atualiza na hora para ser rápido
    
    // Se estiver logado, salva a preferência no banco
    if (user) {
      try {
        await api.updateTheme(newTheme);
      } catch (error) {
        console.error("Erro ao salvar preferência de tema", error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
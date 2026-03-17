import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../core/context/AuthContext";
import { useTheme } from "../../../core/context/ThemeContext";
import { api } from "../../../core/api/api";
import { Lock, Mail, Sun, Moon } from "lucide-react";
import logoImg from "../../../assets/images/logo.png";
import axios from "axios";

export const LoginPage = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/users/login", { email, password });
      login(response.data.token, response.data.user);

      // ¡Acá está la magia! En vez de la alerta, lo mandamos al panel de control
      navigate("/");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Credenciales incorrectas.");
      } else {
        setError("Ocurrió un error crítico de conexión con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-dark-bg flex items-center justify-center p-4 transition-colors duration-300">
      {/* Botón Mágico del Modo Oscuro */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-white dark:bg-slate-800 shadow-md text-gray-800 dark:text-brand hover:scale-110 transition-transform duration-200"
      >
        {theme === "light" ? <Moon size={24} /> : <Sun size={24} />}
      </button>

      {/* Tarjeta de Login */}
      <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-dark-border transition-colors duration-300">
        <div className="bg-black p-6 flex flex-col items-center justify-center">
          <img
            src={logoImg}
            alt="El Club de la Pintura"
            className="h-32 object-contain"
          />
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-6">
            Ingreso al Sistema
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                  placeholder="admin@elclub.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

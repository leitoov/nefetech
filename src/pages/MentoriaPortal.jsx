import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../components/common/Icon';

const COUNTRIES = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 
  'Cuba', 'Ecuador', 'El Salvador', 'España', 'Estados Unidos', 'Guatemala', 
  'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 
  'Puerto Rico', 'República Dominicana', 'Uruguay', 'Venezuela', 
  'Canadá', 'Italia', 'Alemania', 'Francia', 'Reino Unido', 'Portugal', 'Otro'
];

export function MentoriaPortal() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nefe_mentoria_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Modos de vista: 'login', 'register', 'forgot', 'reset', 'verified', 'dashboard'
  const [viewMode, setViewMode] = useState('login');
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Token para verificación o reseteo
  const [actionToken, setActionToken] = useState('');

  // Estados de formularios
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    birth_date: '',
    country: ''
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPasswordForm, setNewPasswordForm] = useState({ password: '', confirm: '' });
  const [changePasswordForm, setChangePasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [showChangeModal, setShowChangeModal] = useState(false);

  // Selector interactivo de países con autocompletado
  const [countryQuery, setCountryQuery] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // Datos del Dashboard
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Detección de parámetros URL: ?action=verify&token=... o ?action=reset&token=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const token = params.get('token');

    if (action === 'verify' && token) {
      setActionToken(token);
      handleAutoVerify(token);
    } else if (action === 'reset' && token) {
      setActionToken(token);
      setViewMode('reset');
    } else if (currentUser) {
      setViewMode('dashboard');
    }
  }, []);

  // Cargar cursos al entrar en dashboard
  useEffect(() => {
    if (viewMode === 'dashboard' && currentUser?.id) {
      loadDashboardCourses(currentUser.id);
    }
  }, [viewMode, currentUser]);

  const loadDashboardCourses = async (userId) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/mentorias/dashboard.php?action=list&user_id=${userId}`);
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoVerify = async (token) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/mentorias/auth.php?action=verify&token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.success) {
        setViewMode('verified');
        setNotification({ type: 'success', message: 'Cuenta validada exitosamente.' });
      } else {
        setViewMode('login');
        setNotification({ type: 'error', message: data.error || 'El enlace de validación es inválido o ha expirado.' });
      }
    } catch (e) {
      setViewMode('login');
      setNotification({ type: 'error', message: 'Error de conexión al validar la cuenta.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Cálculo estricto de edad mínima: 16 años
  const calculateAge = (birthDateString) => {
    if (!birthDateString) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Filtrado de países para el autocompletado
  const filteredCountries = useMemo(() => {
    if (!countryQuery.trim()) return COUNTRIES;
    return COUNTRIES.filter(c => c.toLowerCase().includes(countryQuery.toLowerCase()));
  }, [countryQuery]);

  // Manejo de Registro
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setNotification({ type: '', message: '' });

    const age = calculateAge(registerForm.birth_date);
    if (age < 16) {
      setNotification({ 
        type: 'error', 
        message: 'Debes tener al menos 16 años para registrarte en la plataforma de mentorías (Edad detectada: ' + age + ' años).' 
      });
      return;
    }

    if (!registerForm.country) {
      setNotification({ type: 'error', message: 'Por favor selecciona tu país de residencia.' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/mentorias/auth.php?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();

      if (data.success) {
        setNotification({
          type: 'success',
          message: data.message
        });
        setViewMode('login');
        setLoginForm({ email: registerForm.email, password: '' });
      } else {
        setNotification({ type: 'error', message: data.error || 'Ocurrió un error al registrarse.' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Error de conexión con el servidor.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejo de Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setNotification({ type: '', message: '' });
    setIsLoading(true);

    try {
      const res = await fetch('/api/mentorias/auth.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('nefe_mentoria_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setViewMode('dashboard');
      } else {
        setNotification({ type: 'error', message: data.error || 'Error al iniciar sesión.' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Error al conectar con el servidor.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejo de "Olvidé mi contraseña"
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setNotification({ type: '', message: '' });
    setIsLoading(true);

    try {
      const res = await fetch('/api/mentorias/auth.php?action=forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      setNotification({ type: 'success', message: data.message });
      setViewMode('login');
    } catch (e) {
      setNotification({ type: 'error', message: 'Error al procesar la solicitud.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejo de Nueva Contraseña (Restablecer vía token)
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setNotification({ type: '', message: '' });

    if (newPasswordForm.password !== newPasswordForm.confirm) {
      setNotification({ type: 'error', message: 'Las contraseñas no coinciden.' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/mentorias/auth.php?action=reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: actionToken,
          new_password: newPasswordForm.password
        })
      });
      const data = await res.json();

      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setViewMode('login');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setNotification({ type: 'error', message: data.error || 'No se pudo restablecer la contraseña.' });
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'Error de comunicación.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejo de Cambio de Contraseña (desde el dashboard)
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (changePasswordForm.next !== changePasswordForm.confirm) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    try {
      const res = await fetch('/api/mentorias/auth.php?action=change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          current_password: changePasswordForm.current,
          new_password: changePasswordForm.next
        })
      });
      const data = await res.json();

      if (data.success) {
        alert('Contraseña actualizada correctamente.');
        setShowChangeModal(false);
        setChangePasswordForm({ current: '', next: '', confirm: '' });
      } else {
        alert(data.error || 'Error al cambiar contraseña.');
      }
    } catch (e) {
      alert('Error al comunicarse con el servidor.');
    }
  };

  // Avanzar un módulo de práctica en el curso
  const handleAdvanceModule = async (courseId, currentModules, totalModules) => {
    const nextVal = currentModules >= totalModules ? 0 : currentModules + 1;
    try {
      const res = await fetch('/api/mentorias/dashboard.php?action=update-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          course_id: courseId,
          completed_modules: nextVal
        })
      });
      const data = await res.json();
      if (data.success) {
        loadDashboardCourses(currentUser.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nefe_mentoria_user');
    setCurrentUser(null);
    setViewMode('login');
    setNotification({ type: 'info', message: 'Sesión finalizada.' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Icon name="school" size={24} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">
                Nefetech <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Mentorías</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                mentoria@nefetech.online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentUser && viewMode === 'dashboard' ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-semibold text-slate-200">
                    {currentUser.first_name} {currentUser.last_name}
                  </div>
                  <div className="text-xs text-cyan-400 font-mono">
                    {currentUser.country}
                  </div>
                </div>

                <button
                  onClick={() => setShowChangeModal(true)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60 flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon name="key" size={14} />
                  <span className="hidden md:inline">Cambiar Contraseña</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <Icon name="logout" size={20} />
                </button>
              </div>
            ) : (
              <a
                href="https://nefetech.online"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                Volver a Nefetech <Icon name="open_in_new" size={14} />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex flex-col justify-center">

        {/* Global Notifications */}
        {notification.message && (
          <div className={`mb-8 max-w-xl mx-auto w-full p-4 rounded-xl border flex items-start gap-3 transition-all ${
            notification.type === 'error' 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
              : notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
          }`}>
            <Icon 
              name={notification.type === 'error' ? 'error' : 'check_circle'} 
              size={20} 
              className={notification.type === 'error' ? 'text-rose-400' : 'text-emerald-400'} 
            />
            <div className="text-sm font-medium leading-relaxed">
              {notification.message}
            </div>
          </div>
        )}

        {/* 1. VISTA: CUENTA VALIDADA (Ventana específica solicitada) */}
        {viewMode === 'verified' && (
          <div className="max-w-md mx-auto w-full bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-500/40">
              <Icon name="check_circle" size={40} className="text-emerald-400" />
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
              Cuenta validada
            </h1>
            <p className="text-sm text-slate-300 mb-8 leading-relaxed">
              Tu dirección de correo electrónico ha sido confirmada con éxito. Ya puedes iniciar sesión y acceder a todas las mentorías de Nefetech.
            </p>
            <button
              onClick={() => {
                setViewMode('login');
                window.history.replaceState({}, document.title, window.location.pathname);
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Iniciar Sesión Ahora <Icon name="arrow_forward" size={18} />
            </button>
          </div>
        )}

        {/* 2. VISTA: LOGIN */}
        {viewMode === 'login' && (
          <div className="max-w-md mx-auto w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white tracking-tight">Acceso a Mentorías</h2>
              <p className="text-xs text-slate-400 mt-1">
                Ingresa tus credenciales para acceder a tu plan de estudio
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-slate-500">
                    <Icon name="mail" size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="tu@email.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginForm.email);
                      setViewMode('forgot');
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    Olvidé mi contraseña
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-slate-500">
                    <Icon name="lock" size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <Icon name="refresh" size={18} className="animate-spin" /> : 'Ingresar'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                ¿No tienes cuenta todavía?{' '}
                <button
                  onClick={() => {
                    setViewMode('register');
                    setNotification({ type: '', message: '' });
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </div>
        )}

        {/* 3. VISTA: REGISTRO (Campos exactos pedidos) */}
        {viewMode === 'register' && (
          <div className="max-w-xl mx-auto w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white tracking-tight">Registro de Alumno</h2>
              <p className="text-xs text-slate-400 mt-1">
                Completa tus datos para iniciar tu proceso formativo en Nefetech
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nombre
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-3 text-slate-500">
                      <Icon name="person" size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={registerForm.first_name}
                      onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
                      placeholder="Ej. Juan"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Apellido
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-3 text-slate-500">
                      <Icon name="person" size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={registerForm.last_name}
                      onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
                      placeholder="Ej. Pérez"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-slate-500">
                    <Icon name="mail" size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="tu@email.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Contraseña (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-slate-500">
                    <Icon name="lock" size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Fecha de Nacimiento
                    </label>
                    <span className="text-[10px] text-amber-400 font-medium">Mínimo 16 años</span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-3 text-slate-500">
                      <Icon name="calendar_today" size={18} />
                    </div>
                    <input
                      type="date"
                      required
                      value={registerForm.birth_date}
                      onChange={(e) => setRegisterForm({ ...registerForm, birth_date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Selector interactivo con autocompletado y escritura */}
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    País de Residencia
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-3 text-slate-500">
                      <Icon name="public" size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={countryQuery || registerForm.country}
                      onFocus={() => setIsCountryDropdownOpen(true)}
                      onChange={(e) => {
                        setCountryQuery(e.target.value);
                        setRegisterForm({ ...registerForm, country: e.target.value });
                        setIsCountryDropdownOpen(true);
                      }}
                      placeholder="Escribe para buscar tu país..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Dropdown de opciones autocompletables */}
                  {isCountryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setRegisterForm({ ...registerForm, country: c });
                              setCountryQuery(c);
                              setIsCountryDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors cursor-pointer"
                          >
                            {c}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-xs text-slate-500">
                          Presiona Enter para usar "{countryQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                <span className="text-cyan-400 font-semibold">Nota:</span> Al enviar el registro, recibirás un correo desde <span className="text-white font-mono">mentoria@nefetech.online</span> con un enlace para validar tu cuenta.
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <Icon name="refresh" size={18} className="animate-spin" /> : 'Completar Registro'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                ¿Ya tienes una cuenta?{' '}
                <button
                  onClick={() => {
                    setViewMode('login');
                    setNotification({ type: '', message: '' });
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>
        )}

        {/* 4. VISTA: OLVIDÉ MI CONTRASEÑA */}
        {viewMode === 'forgot' && (
          <div className="max-w-md mx-auto w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white tracking-tight">Recuperar Contraseña</h2>
              <p className="text-xs text-slate-400 mt-1">
                Te enviaremos las instrucciones de restablecimiento a tu correo
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Correo Electrónico registrado
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-slate-500">
                    <Icon name="mail" size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <Icon name="refresh" size={18} className="animate-spin" /> : 'Enviar Enlace de Recuperación'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <button
                onClick={() => setViewMode('login')}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Regresar al inicio de sesión
              </button>
            </div>
          </div>
        )}

        {/* 5. VISTA: RESTABLECER CONTRASEÑA (Por enlace del correo) */}
        {viewMode === 'reset' && (
          <div className="max-w-md mx-auto w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white tracking-tight">Nueva Contraseña</h2>
              <p className="text-xs text-slate-400 mt-1">
                Ingresa tu nueva contraseña para acceder a la plataforma
              </p>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nueva Contraseña (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-slate-500">
                    <Icon name="lock" size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPasswordForm.password}
                    onChange={(e) => setNewPasswordForm({ ...newPasswordForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-slate-500">
                    <Icon name="lock" size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPasswordForm.confirm}
                    onChange={(e) => setNewPasswordForm({ ...newPasswordForm, confirm: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <Icon name="refresh" size={18} className="animate-spin" /> : 'Actualizar Contraseña'}
              </button>
            </form>
          </div>
        )}

        {/* 6. VISTA: DASHBOARD DEL ALUMNO (Mentorías disponibles y progreso) */}
        {viewMode === 'dashboard' && currentUser && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header del Alumno */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
                  <Icon name="auto_awesome" size={14} className="text-cyan-400" /> Alumno Nefetech
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Bienvenido, {currentUser.first_name} {currentUser.last_name}
                </h1>
                <p className="text-sm text-slate-400 mt-1 max-w-xl">
                  Explora las mentorías disponibles, sigue tus módulos prácticos y marca tu progreso formativo paso a paso.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800/80 px-4 py-3 rounded-xl">
                <div className="text-center px-2">
                  <div className="text-xs text-slate-400">Total Cursos</div>
                  <div className="text-xl font-bold text-white">{courses.length}</div>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div className="text-center px-2">
                  <div className="text-xs text-slate-400">Completados</div>
                  <div className="text-xl font-bold text-emerald-400">
                    {courses.filter(c => Number(c.progress_percent) >= 100).length}
                  </div>
                </div>
              </div>
            </div>

            {/* Catálogo de Mentorías Disponibles */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Mentorías Disponibles</h2>
                  <p className="text-xs text-slate-400">Tu plan de estudios activo en tecnología</p>
                </div>
                <button
                  onClick={() => loadDashboardCourses(currentUser.id)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Recargar cursos"
                >
                  <Icon name="refresh" size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => {
                  const percent = Number(course.progress_percent) || 0;
                  const completedMods = Number(course.completed_modules) || 0;
                  const totalMods = Number(course.total_modules) || 5;

                  return (
                    <div
                      key={course.course_id}
                      className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-all hover:shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/10 text-cyan-400 border border-blue-500/20">
                            {course.category}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Icon name="schedule" size={14} className="text-slate-500" />
                            {course.duration_hours}h estimadas
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-6">
                          {course.description}
                        </p>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="pt-4 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-xs font-semibold mb-2">
                          <span className="text-slate-300">Progreso en la mentoría</span>
                          <span className={percent >= 100 ? 'text-emerald-400' : 'text-cyan-400'}>
                            {percent}% ({completedMods}/{totalMods} módulos)
                          </span>
                        </div>

                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              percent >= 100
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            percent >= 100 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : percent > 0 
                              ? 'bg-amber-500/10 text-amber-400' 
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {percent >= 100 ? 'Completado' : percent > 0 ? 'En Progreso' : 'Disponible'}
                          </span>

                          <button
                            onClick={() => handleAdvanceModule(course.course_id, completedMods, totalMods)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            {percent >= 100 ? 'Reiniciar Progreso' : 'Avanzar Módulo'}
                            <Icon name="chevron_right" size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Cambio de Contraseña (desde el dashboard) */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Cambiar mi Contraseña</h3>
            <p className="text-xs text-slate-400 mb-6">
              Ingresa tu contraseña actual y la nueva que deseas utilizar.
            </p>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  required
                  value={changePasswordForm.current}
                  onChange={(e) => setChangePasswordForm({ ...changePasswordForm, current: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nueva Contraseña (mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={changePasswordForm.next}
                  onChange={(e) => setChangePasswordForm({ ...changePasswordForm, next: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={changePasswordForm.confirm}
                  onChange={(e) => setChangePasswordForm({ ...changePasswordForm, confirm: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangeModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-colors shadow-lg shadow-cyan-600/20 cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          Nefetech Mentorías &copy; {new Date().getFullYear()} &mdash; Contacto: <a href="mailto:mentoria@nefetech.online" className="text-cyan-400 hover:underline">mentoria@nefetech.online</a>
        </div>
      </footer>
    </div>
  );
}
export default MentoriaPortal;

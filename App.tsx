import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, UserProfile, AccountType } from './types';
import { DEFAULT_USER, ACCOUNTS } from './constants';
import { storageService } from './services/storageService';
import { apiService } from './services/apiService';
import { exportToExcel } from './services/exportService';
import { notifyDeveloperOfNewUser } from './services/notificationService';
import { googleDriveService } from './services/googleDriveService';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Insights from './components/Insights';
import AccountIcon from './components/AccountIcon';
import { 
  LayoutDashboard, PlusCircle, History, Download, Moon, Sun, 
  Menu, Code, Settings, LogOut, Trash2, Key, Phone, User as UserIcon, Lock,
  Cloud, CheckCircle2, Globe, Save, LogIn, ShieldCheck, Server, Loader2, RefreshCw
} from 'lucide-react';

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingAccounts, setEditingAccounts] = useState<Partial<Record<AccountType, string>>>({});
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isServerChecking, setIsServerChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [serverStatus, setServerStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [regLoginId, setRegLoginId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');

  const [loginInputId, setLoginInputId] = useState('');
  const [loginInputPassword, setLoginInputPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [googleToken, setGoogleToken] = useState<string | null>(localStorage.getItem('ct_google_token'));
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);

  // Sync state to Drive whenever transactions or profile change
  const triggerCloudSync = useCallback(async (txs: Transaction[], prof: UserProfile, token: string) => {
    setIsSyncing(true);
    await googleDriveService.syncUserData(token, prof.id, {
      transactions: txs,
      profile: {
        name: prof.name,
        theme: prof.theme,
        dashboardTheme: prof.dashboardTheme,
        accountNumbers: prof.accountNumbers
      }
    });
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    const allProfiles = storageService.loadProfiles();
    setProfiles(allProfiles);
    if (allProfiles.length === 0) setAuthMode('register');
    const currentId = storageService.getCurrentUserId();
    if (currentId) {
      const found = allProfiles.find(p => p.id === currentId);
      if (found) handleLoginSuccess(found);
    }
  }, []);

  // Background Auto-Sync Effect
  useEffect(() => {
    if (currentProfile && googleToken) {
      const timeout = setTimeout(() => {
        triggerCloudSync(transactions, currentProfile, googleToken);
      }, 2000); // Debounce sync
      return () => clearTimeout(timeout);
    }
  }, [transactions, currentProfile, googleToken, triggerCloudSync]);

  useEffect(() => {
    if (currentProfile) {
      const updatedProfiles = profiles.map(p => p.id === currentProfile.id ? currentProfile : p);
      setProfiles(updatedProfiles);
      storageService.saveProfiles(updatedProfiles);
      storageService.saveTransactions(currentProfile.id, transactions);
    }
  }, [currentProfile, transactions]);

  const handleUpdateDashboardTheme = (themeId: string) => {
    setCurrentProfile(prev => prev ? ({ ...prev, dashboardTheme: themeId }) : null);
  };

  const performFullInitialSync = async (profile: UserProfile, token: string) => {
    setIsSyncing(true);
    const cloudData = await googleDriveService.fetchUserData(token, profile.id);
    if (cloudData) {
      // Merge Strategy: Prefer cloud data if it exists for multi-device sync
      setTransactions(cloudData.transactions);
      if (cloudData.profile) {
        setCurrentProfile(prev => prev ? ({ ...prev, ...cloudData.profile }) : null);
      }
    }
    setIsSyncing(false);
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsServerChecking(true);
    try {
      const check = await apiService.checkUniqueness(regLoginId, regMobile, googleToken);
      if (!check.available) {
        alert(check.reason);
        setIsServerChecking(false);
        return;
      }

      const newProfile: UserProfile = {
        ...DEFAULT_USER,
        id: Math.random().toString(36).substring(2, 11),
        loginId: regLoginId.trim(),
        password: regPassword.trim(),
        name: regName.trim(),
        mobile: regMobile.trim(),
        createdAt: Date.now(),
      };

      const registered = await apiService.registerOnServer(newProfile, googleToken);
      if (registered) {
        const updatedProfiles = [...profiles, newProfile];
        setProfiles(updatedProfiles);
        storageService.saveProfiles(updatedProfiles);
        await notifyDeveloperOfNewUser(newProfile);
        setServerStatus('success');
        setTimeout(() => {
          handleLoginSuccess(newProfile);
          setIsServerChecking(false);
          resetRegForm();
        }, 800);
      }
    } catch (err) {
      setIsServerChecking(false);
    }
  };

  const resetRegForm = () => {
    setRegLoginId(''); setRegPassword(''); setRegName(''); setRegMobile('');
  };

  const handleLoginSuccess = async (profile: UserProfile) => {
    setCurrentProfile(profile);
    storageService.setCurrentUserId(profile.id);
    setTransactions(storageService.loadTransactions(profile.id));
    setEditingAccounts(profile.accountNumbers || {});
    
    if (profile.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    if (googleToken) {
      await performFullInitialSync(profile, googleToken);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = profiles.find(p => p.loginId.toLowerCase() === loginInputId.toLowerCase());
    if (!found) { setLoginError("Account not found locally."); return; }
    if (found.password === loginInputPassword) {
      handleLoginSuccess(found);
    } else {
      setLoginError("Invalid password.");
    }
  };

  const handleLogout = () => {
    setCurrentProfile(null);
    storageService.setCurrentUserId(null);
    document.documentElement.classList.remove('dark');
    setActiveTab('dashboard');
    setAuthMode(profiles.length > 0 ? 'login' : 'register');
  };

  const handleConnectDrive = () => {
    if (isConnectingDrive) return;
    setIsConnectingDrive(true);
    const client = googleDriveService.initTokenClient(async (token) => {
      setGoogleToken(token);
      localStorage.setItem('ct_google_token', token);
      if (currentProfile) {
        await performFullInitialSync(currentProfile, token);
      }
      setIsConnectingDrive(false);
    });
    if (client) client.requestAccessToken();
    else setIsConnectingDrive(false);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm("Delete record?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    setIsFormOpen(true);
  };

  const handleSaveTransaction = (t: Transaction) => {
    if (editingTransaction) setTransactions(prev => prev.map(tx => tx.id === t.id ? t : tx));
    else setTransactions(prev => [t, ...prev]);
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  const toggleTheme = () => {
    if (!currentProfile) return;
    const newTheme = currentProfile.theme === 'light' ? 'dark' : 'light';
    setCurrentProfile(prev => prev ? ({ ...prev, theme: newTheme }) : null);
    document.documentElement.classList.toggle('dark');
  };

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-8 space-y-6 relative">
          {(isServerChecking || isConnectingDrive) && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
              <Loader2 size={48} className="text-indigo-600 animate-spin" />
              <p className="font-bold text-slate-800">Establishing Cloud Link...</p>
            </div>
          )}

          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl mx-auto mb-4">
              <LayoutDashboard size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Cash Tracker</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Multi-Device Cloud Sync</p>
          </div>

          <div className="space-y-4">
            {authMode === 'login' ? (
              <form onSubmit={handleManualLogin} className="space-y-4">
                <input type="text" required placeholder="User ID" value={loginInputId} onChange={(e) => setLoginInputId(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-indigo-500 outline-none" />
                <input type="password" required placeholder="Password" value={loginInputPassword} onChange={(e) => setLoginInputPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-indigo-500 outline-none" />
                {loginError && <p className="text-xs text-red-500">{loginError}</p>}
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all">Access Dashboard</button>
                <button type="button" onClick={() => setAuthMode('register')} className="w-full text-xs font-bold text-slate-400">New? Register Device</button>
              </form>
            ) : (
              <form onSubmit={handleCreateProfile} className="space-y-3">
                <input type="text" required placeholder="User ID" value={regLoginId} onChange={(e) => setRegLoginId(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm" />
                <input type="password" required placeholder="Password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm" />
                <input type="text" required placeholder="Name" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm" />
                <input type="tel" required placeholder="Mobile" value={regMobile} onChange={(e) => setRegMobile(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm" />
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl">Create Account</button>
                <button type="button" onClick={() => setAuthMode('login')} className="w-full text-xs font-bold text-slate-400">Back to Login</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <aside className={`fixed lg:sticky top-0 h-screen w-72 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 z-50 transition-transform lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10"><div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><LayoutDashboard /></div><span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Cash Tracker</span></div>
          <nav className="flex-1 space-y-2">
            <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutDashboard size={20} /> Dashboard</button>
            <button onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === 'history' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}><History size={20} /> History</button>
            <button onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${activeTab === 'settings' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}><Settings size={20} /> Cloud Sync</button>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-bold mt-10"><LogOut size={20} /> Logout</button>
          </nav>

          {/* New Sync Status in Sidebar */}
          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${googleToken ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {googleToken ? 'Cloud Active' : 'Offline Mode'}
                  </span>
               </div>
               {isSyncing && <RefreshCw size={12} className="text-indigo-500 animate-spin" />}
            </div>
            <div className="flex gap-2">
              <button onClick={toggleTheme} className="flex-1 flex items-center justify-center p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">{currentProfile.theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-yellow-400" />}</button>
              <button onClick={() => exportToExcel(transactions)} className="flex-1 flex items-center justify-center p-3 bg-slate-50 dark:bg-slate-700 rounded-xl"><Download size={20} /></button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        <header className="flex lg:hidden items-center justify-between mb-8">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><Menu /></button>
          <span className="text-xl font-bold">Cash Tracker</span>
          <div className="flex items-center gap-2">
            {isSyncing && <RefreshCw size={16} className="text-indigo-500 animate-spin" />}
            <button onClick={handleLogout} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl"><LogOut size={20} /></button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <Dashboard 
              transactions={transactions} 
              profile={currentProfile} 
              onUpdateName={(n) => setCurrentProfile(p => p ? ({ ...p, name: n }) : null)} 
              onUpdateDashboardTheme={handleUpdateDashboardTheme}
            />
            <Insights transactions={transactions} userName={currentProfile.name} />
            <div className="flex justify-between items-center"><h2 className="text-xl font-bold dark:text-white">Recent Records</h2></div>
            <TransactionList transactions={transactions.slice(0, 5)} onDelete={handleDeleteTransaction} onEdit={handleEditTransaction} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold dark:text-white">Ledger History</h1>
            <TransactionList transactions={transactions} onDelete={handleDeleteTransaction} onEdit={handleEditTransaction} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 space-y-6 border border-slate-100 dark:border-slate-700 shadow-sm">
              <h2 className="text-xl font-bold dark:text-white flex items-center gap-2"><Globe className="text-indigo-500" /> Multi-Device Synchronization</h2>
              <p className="text-sm text-slate-500">Enable cloud sync to share your transactions across your phone, tablet, and computer automatically.</p>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                {googleToken ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="font-bold dark:text-white">Sync Enabled</p>
                        <p className="text-xs text-slate-400">Data is being mirrored to your Google Drive</p>
                      </div>
                    </div>
                    <button onClick={() => { setGoogleToken(null); localStorage.removeItem('ct_google_token'); }} className="text-xs font-bold text-red-500 hover:underline">Disconnect</button>
                  </div>
                ) : (
                  <button onClick={handleConnectDrive} className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                    <Globe size={20} /> Link Google Drive
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 space-y-6 border border-slate-100 dark:border-slate-700 shadow-sm">
              <h2 className="text-xl font-bold dark:text-white">Account Ledger Setup</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ACCOUNTS.map(acc => (
                  <div key={acc.name} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <AccountIcon name={acc.name} size={14} /> {acc.name} ID
                    </label>
                    <input type="text" placeholder={`Account ID...`} value={editingAccounts[acc.name as AccountType] || ''} onChange={(e) => setEditingAccounts(prev => ({ ...prev, [acc.name as AccountType]: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-xs dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                ))}
              </div>
              <button onClick={() => { setCurrentProfile(p => p ? ({ ...p, accountNumbers: editingAccounts }) : null); setActiveTab('dashboard'); }} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700">Update Account Ledger</button>
            </div>
          </div>
        )}
      </main>

      <button onClick={() => setIsFormOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-all"><PlusCircle size={32} /></button>
      {isFormOpen && currentProfile && (
        <TransactionForm 
          onSave={handleSaveTransaction} 
          onClose={() => setIsFormOpen(false)} 
          userId={currentProfile.id} 
          initialData={editingTransaction || undefined}
        />
      )}
    </div>
  );
};

export default App;
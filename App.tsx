
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AbstractScene } from './components/QuantumScene';
import { ProjectGrid, ExperienceTimeline, EditableItemWrapper } from './components/Diagrams';
import { Editor, initialConfig, PortfolioConfig, TemplateType, CustomThemeConfig, SaveStatus } from './components/Editor';
import { MetadataHandler } from './components/MetadataHandler';
import { 
  ArrowDown, Menu, X, Github, Linkedin, Mail, PenTool, Database, BookOpen, ExternalLink, 
  FileText, LogIn, LogOut, User, ShieldCheck, Globe, GraduationCap, DollarSign, Award, 
  FileCode, Copy, Check, Search, Share2, Code, Sparkles, Download, Fingerprint, ChevronDown, ChevronUp, Plus
} from 'lucide-react';
import { formatCitation } from './utils/bibtex';
import { auth, db, googleProvider, FirebaseUser } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

import { ErrorBoundary } from './components/ErrorBoundary';

// --- ERROR HANDLING ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- THEME ENGINE ---
interface ThemeStyles {
    bg: string;
    navBg: string;
    text: string;
    textMuted: string;
    heading: string;
    subheading: string;
    accent: string;
    button: string;
    sectionPrimary: string;
    sectionSecondary: string;
    border: string;
    logo: string;
}

const getTheme = (template: TemplateType, customTheme?: CustomThemeConfig): ThemeStyles => {
    if (template === 'custom' && customTheme) {
        return {
            bg: customTheme.bg || 'bg-[#F9F8F4]',
            navBg: customTheme.navBg || 'bg-[#F9F8F4]/90',
            text: customTheme.text || 'text-stone-800',
            textMuted: customTheme.textMuted || 'text-stone-500',
            heading: customTheme.heading || 'font-serif text-stone-900',
            subheading: customTheme.subheading || 'text-stone-400 font-bold tracking-widest uppercase text-xs',
            accent: customTheme.accent || 'text-stone-900',
            button: customTheme.button || 'bg-stone-900 text-white hover:bg-stone-700 rounded-full shadow-sm',
            sectionPrimary: customTheme.sectionPrimary || 'bg-white',
            sectionSecondary: customTheme.sectionSecondary || 'bg-[#F5F5F2]',
            border: customTheme.border || 'border-stone-200',
            logo: customTheme.logo || 'bg-stone-900 text-white rounded-full font-serif'
        };
    }

    switch(template) {
        case 'cyber':
            return {
                bg: 'bg-[#0f172a]',
                navBg: 'bg-[#0f172a]/90',
                text: 'text-slate-300',
                textMuted: 'text-slate-500',
                heading: 'font-mono text-white',
                subheading: 'text-cyan-500 font-mono tracking-widest uppercase text-xs',
                accent: 'text-cyan-400',
                button: 'bg-cyan-600 text-white hover:bg-cyan-500 rounded-md shadow-[0_0_15px_rgba(8,145,178,0.5)]',
                sectionPrimary: 'bg-[#0f172a]',
                sectionSecondary: 'bg-[#1e293b]',
                border: 'border-slate-800',
                logo: 'bg-slate-800 text-cyan-400 border border-cyan-500 rounded-md font-mono'
            };
        case 'brutal':
            return {
                bg: 'bg-white',
                navBg: 'bg-white/95',
                text: 'text-black',
                textMuted: 'text-stone-600',
                heading: 'font-sans font-black uppercase text-black tracking-tight',
                subheading: 'bg-black text-white px-2 py-1 font-bold inline-block uppercase text-xs',
                accent: 'text-black',
                button: 'bg-white text-black border-2 border-black hover:bg-black hover:text-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
                sectionPrimary: 'bg-white',
                sectionSecondary: 'bg-[#f4f4f5]', // Zinc 100
                border: 'border-black',
                logo: 'bg-black text-white border-2 border-black rounded-none font-black shadow-[2px_2px_0px_0px_rgba(100,100,100,1)]'
            };
        case 'minimal':
            return {
                bg: 'bg-[#FAFAFA]',
                navBg: 'bg-[#FAFAFA]/90',
                text: 'text-zinc-800',
                textMuted: 'text-zinc-500',
                heading: 'font-sans font-semibold tracking-tight text-zinc-900',
                subheading: 'text-zinc-400 font-medium tracking-widest uppercase text-xs',
                accent: 'text-zinc-900',
                button: 'bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg shadow-sm',
                sectionPrimary: 'bg-white',
                sectionSecondary: 'bg-[#F4F4F5]',
                border: 'border-zinc-200',
                logo: 'bg-zinc-900 text-white rounded-lg font-sans font-bold'
            };
        case 'emerald':
            return {
                bg: 'bg-[#F4F7F5]',
                navBg: 'bg-[#F4F7F5]/90',
                text: 'text-emerald-950',
                textMuted: 'text-emerald-700/80',
                heading: 'font-serif text-emerald-950',
                subheading: 'text-emerald-800 font-bold tracking-widest uppercase text-xs',
                accent: 'text-emerald-800',
                button: 'bg-emerald-900 text-emerald-50 hover:bg-emerald-800 rounded-lg shadow-sm',
                sectionPrimary: 'bg-white',
                sectionSecondary: 'bg-[#EAF0EB]',
                border: 'border-emerald-200/80',
                logo: 'bg-emerald-900 text-emerald-100 rounded-full font-serif'
            };
        case 'sunset':
            return {
                bg: 'bg-[#FAF7F2]',
                navBg: 'bg-[#FAF7F2]/90',
                text: 'text-stone-800',
                textMuted: 'text-stone-500',
                heading: 'font-serif text-stone-900',
                subheading: 'text-amber-800 font-bold tracking-widest uppercase text-xs',
                accent: 'text-amber-900',
                button: 'bg-amber-900 text-amber-50 hover:bg-amber-800 rounded-full shadow-sm',
                sectionPrimary: 'bg-white',
                sectionSecondary: 'bg-[#F3ECE1]',
                border: 'border-amber-200/60',
                logo: 'bg-amber-900 text-amber-100 rounded-full font-serif'
            };
        case 'slate':
            return {
                bg: 'bg-[#18181B]',
                navBg: 'bg-[#18181B]/90',
                text: 'text-zinc-300',
                textMuted: 'text-zinc-500',
                heading: 'font-sans font-bold text-white',
                subheading: 'text-indigo-400 font-mono tracking-widest uppercase text-xs',
                accent: 'text-indigo-400',
                button: 'bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg shadow-sm',
                sectionPrimary: 'bg-[#18181B]',
                sectionSecondary: 'bg-[#27272A]',
                border: 'border-zinc-800',
                logo: 'bg-zinc-800 text-indigo-400 border border-indigo-500/30 rounded-lg'
            };
        case 'classic':
        default:
            return {
                bg: 'bg-[#F9F8F4]',
                navBg: 'bg-[#F9F8F4]/90',
                text: 'text-stone-800',
                textMuted: 'text-stone-500',
                heading: 'font-serif text-stone-900',
                subheading: 'text-stone-400 font-bold tracking-widest uppercase text-xs',
                accent: 'text-stone-900',
                button: 'bg-stone-900 text-white hover:bg-stone-700 rounded-full shadow-sm',
                sectionPrimary: 'bg-white',
                sectionSecondary: 'bg-[#F5F5F2]',
                border: 'border-stone-200',
                logo: 'bg-stone-900 text-white rounded-full font-serif'
            };
    }
}


// --- INLINE EDITING COMPONENTS ---
interface InlineTextProps {
    value: string;
    onChange: (val: string) => void;
    isEditing: boolean;
    className?: string;
    placeholder?: string;
}

const InlineText: React.FC<InlineTextProps> = ({ value, onChange, isEditing, className = '', placeholder = '' }) => {
    if (!isEditing) {
        return <span className={className}>{value || placeholder}</span>;
    }
    return (
        <input 
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`bg-transparent border-b border-dashed border-stone-400 focus:border-stone-950 focus:bg-stone-50/20 focus:outline-none px-1 py-0.5 rounded transition-all w-full text-inherit font-inherit ${className}`}
        />
    );
};

interface InlineTextAreaProps {
    value: string;
    onChange: (val: string) => void;
    isEditing: boolean;
    className?: string;
    placeholder?: string;
}

const InlineTextArea: React.FC<InlineTextAreaProps> = ({ value, onChange, isEditing, className = '', placeholder = '' }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-adjust height
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value, isEditing]);

    if (!isEditing) {
        return <span className={className}>{value || placeholder}</span>;
    }

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={1}
            className={`bg-transparent border border-dashed border-stone-400 focus:border-stone-950 focus:bg-stone-50/20 focus:outline-none p-2 rounded transition-all w-full text-inherit font-inherit resize-none overflow-hidden leading-relaxed ${className}`}
        />
    );
};


const App: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [config, setConfig] = useState<PortfolioConfig>(initialConfig);
  const [editorOpen, setEditorOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const pendingSavesRef = useRef(0);

  // --- ACADEMIC PUBLICATION INTERACTION STATES ---
  const [pubSearchQuery, setPubSearchQuery] = useState('');
  const [selectedPubType, setSelectedPubType] = useState<string>('all');
  const [expandedBibtex, setExpandedBibtex] = useState<Record<string, boolean>>({});
  const [expandedAbstract, setExpandedAbstract] = useState<Record<string, boolean>>({});
  const [copiedCitationId, setCopiedCitationId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const toggleBibtex = (id: string) => {
    setExpandedBibtex(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAbstract = (id: string) => {
    setExpandedAbstract(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCitationId(id);
    setTimeout(() => setCopiedCitationId(null), 2000);
  };

  const theme = getTheme(config.template, config.customTheme);

  // --- AUTH & DATA SYNC ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const portfolioDocRef = doc(db, 'portfolios', user.uid);

    const unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.data());
      } else {
        // Create user profile if it doesn't exist
        setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isPro: false,
          createdAt: serverTimestamp()
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    const unsubscribePortfolio = onSnapshot(portfolioDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.config) {
          setConfig(data.config);
          setSaveStatus('saved');
        }
      }
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, `portfolios/${user.uid}`));

    return () => {
      unsubscribeUser();
      unsubscribePortfolio();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setConfig(initialConfig);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleConfigChange = useCallback((newConfig: PortfolioConfig) => {
    setConfig(newConfig);
    if (user) {
      setSaveStatus('saving');
      pendingSavesRef.current += 1;
      setDoc(doc(db, 'portfolios', user.uid), {
        uid: user.uid,
        config: newConfig,
        updatedAt: serverTimestamp()
      }, { merge: true })
        .then(() => {
          pendingSavesRef.current -= 1;
          if (pendingSavesRef.current <= 0) {
            pendingSavesRef.current = 0;
            setSaveStatus('saved');
          }
        })
        .catch(err => {
          pendingSavesRef.current -= 1;
          if (pendingSavesRef.current <= 0) {
            pendingSavesRef.current = 0;
          }
          setSaveStatus('error');
          if (err.message?.includes("exceeds the maximum allowed size")) {
            alert("Your portfolio is too large to save (exceeds 1MB). Please use the 'Optimize Portfolio' button in the editor to compress your images.");
          }
          handleFirestoreError(err, OperationType.WRITE, `portfolios/${user.uid}`);
        });
    } else {
      setSaveStatus('saved');
    }
  }, [user]);

  // --- LIST INLINE EDITING HELPERS ---
  const handleEduChange = (index: number, field: string, value: any) => {
    const list = [...(config.education || [])];
    list[index] = { ...list[index], [field]: value };
    handleConfigChange({ ...config, education: list });
  };

  const handlePubChange = (index: number, field: string, value: any) => {
    const list = [...(config.publications || [])];
    list[index] = { ...list[index], [field]: value };
    handleConfigChange({ ...config, publications: list });
  };

  const handleGrantChange = (index: number, field: string, value: any) => {
    const list = [...(config.grants || [])];
    list[index] = { ...list[index], [field]: value };
    handleConfigChange({ ...config, grants: list });
  };

  const handleTeachingChange = (index: number, field: string, value: any) => {
    const list = [...(config.teaching || [])];
    list[index] = { ...list[index], [field]: value };
    handleConfigChange({ ...config, teaching: list });
  };

  const handleAwardChange = (index: number, field: string, value: any) => {
    const list = [...(config.awards || [])];
    list[index] = { ...list[index], [field]: value };
    handleConfigChange({ ...config, awards: list });
  };

  // Add Item Handlers
  const addEdu = () => {
    const newEdu = {
      id: Date.now().toString(),
      year: "2025",
      degree: "New Degree",
      school: "New School/Institution",
      description: "Describe your studies..."
    };
    handleConfigChange({ ...config, education: [...(config.education || []), newEdu] });
    setEditingItemId(newEdu.id);
  };

  const addPub = () => {
    const newPub = {
      id: Date.now().toString(),
      year: new Date().getFullYear().toString(),
      title: "New Publication Title",
      authors: config.name,
      journal: "Journal / Conference Venue",
      type: "journal" as const,
      doi: "",
      url: ""
    };
    handleConfigChange({ ...config, publications: [...(config.publications || []), newPub] });
    setEditingItemId(newPub.id);
  };

  const addGrant = () => {
    const newGrant = {
      id: Date.now().toString(),
      title: "New Research Grant",
      funder: "Funding Agency",
      amount: "$100,000",
      role: "PI",
      period: "2025 - 2027",
      description: "Summary of research grant objective..."
    };
    handleConfigChange({ ...config, grants: [...(config.grants || []), newGrant] });
    setEditingItemId(newGrant.id);
  };

  const addTeaching = () => {
    const newTeaching = {
      id: Date.now().toString(),
      code: "CS 101",
      title: "Introduction to Computer Science",
      institution: "Institution Name",
      role: "Instructor",
      term: "Fall 2025"
    };
    handleConfigChange({ ...config, teaching: [...(config.teaching || []), newTeaching] });
    setEditingItemId(newTeaching.id);
  };

  const addAward = () => {
    const newAward = {
      id: Date.now().toString(),
      title: "New Honor or Award",
      issuer: "Issuing Organization",
      year: new Date().getFullYear().toString(),
      description: "Brief details of award..."
    };
    handleConfigChange({ ...config, awards: [...(config.awards || []), newAward] });
    setEditingItemId(newAward.id);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const downloadResearcherJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "researcher.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} selection:bg-stone-200 selection:text-black transition-colors duration-500`}>
      
      {/* Dynamic SEO Injection */}
      <MetadataHandler config={config} />

      {/* Editor Controls */}
      <button 
        onClick={() => setEditorOpen(true)}
        className="fixed bottom-8 right-8 z-50 p-4 bg-stone-900 text-white rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer flex items-center gap-2 group"
        title="Customize Portfolio"
      >
        <PenTool size={20} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Customize</span>
      </button>

      <Editor 
        isOpen={editorOpen} 
        onClose={() => setEditorOpen(false)} 
        config={config} 
        onChange={handleConfigChange}
        user={user}
        userData={userData}
        saveStatus={saveStatus}
      />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? `${theme.navBg} backdrop-blur-md shadow-sm py-4` : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className={`w-10 h-10 flex items-center justify-center font-bold text-xl shadow-sm pb-1 transition-all ${theme.logo}`}>
              {config.name.charAt(0)}
            </div>
            <div className={`flex flex-col transition-opacity ${scrolled ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
              <span className={`font-bold text-lg leading-none tracking-wide ${config.template === 'cyber' ? 'font-mono' : (config.template === 'brutal' ? 'font-sans uppercase' : 'font-serif')}`}>
                {config.name.toUpperCase()}
              </span>
              <span className={`text-[10px] ${config.template === 'cyber' ? 'text-cyan-600' : 'text-stone-400 font-bold uppercase tracking-widest'}`}>{config.title}</span>
            </div>
          </div>
          
          <div className={`hidden md:flex items-center gap-6 text-xs font-semibold tracking-wider ${theme.textMuted}`}>
            <a href="#about" onClick={scrollToSection('about')} className={`hover:${theme.accent} transition-colors cursor-pointer uppercase`}>About</a>
            <a href="#work" onClick={scrollToSection('work')} className={`hover:${theme.accent} transition-colors cursor-pointer uppercase`}>Work</a>
            <a href="#publications" onClick={scrollToSection('publications')} className={`hover:${theme.accent} transition-colors cursor-pointer uppercase`}>Publications</a>
            {config.grants && config.grants.length > 0 && <a href="#funding" onClick={scrollToSection('funding')} className={`hover:${theme.accent} transition-colors cursor-pointer uppercase`}>Funding</a>}
            {config.teaching && config.teaching.length > 0 && <a href="#teaching" onClick={scrollToSection('teaching')} className={`hover:${theme.accent} transition-colors cursor-pointer uppercase`}>Teaching</a>}
            <a href="#journey" onClick={scrollToSection('journey')} className={`hover:${theme.accent} transition-colors cursor-pointer uppercase`}>Experience</a>
            
            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setEditorOpen(true)}
                  className={`flex items-center gap-2 px-4 py-2 transition-all cursor-pointer ${theme.button}`}
                >
                  <PenTool size={16} />
                  <span>Editor</span>
                </button>
                <div className="group relative">
                  <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-stone-200 cursor-pointer" />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl rounded-lg border border-stone-100 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all transform translate-y-2 group-hover:translate-y-0 p-2">
                    <div className="px-3 py-2 border-b border-stone-50 mb-1">
                      <div className="text-xs font-bold text-stone-900 truncate">{user.displayName}</div>
                      <div className="text-[10px] text-stone-400 truncate">{user.email}</div>
                    </div>
                    {userData?.isPro && (
                      <div className="px-3 py-2 text-[10px] font-bold text-amber-600 flex items-center gap-1">
                        <ShieldCheck size={12} /> PRO MEMBER
                      </div>
                    )}
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-2">
                      <LogOut size={12} /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className={`flex items-center gap-2 px-6 py-2 transition-all cursor-pointer ${theme.button}`}
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </button>
            )}
          </div>

          <button className={`md:hidden p-2 ${theme.text}`} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={`fixed inset-0 z-40 ${theme.bg} flex flex-col items-center justify-center gap-8 text-2xl animate-fade-in`}>
            <a href="#about" onClick={scrollToSection('about')} className={`${theme.heading} hover:opacity-50 transition-colors cursor-pointer`}>About</a>
            <a href="#skills" onClick={scrollToSection('skills')} className={`${theme.heading} hover:opacity-50 transition-colors cursor-pointer`}>Skills</a>
            <a href="#work" onClick={scrollToSection('work')} className={`${theme.heading} hover:opacity-50 transition-colors cursor-pointer`}>Work</a>
            <a href="#journey" onClick={scrollToSection('journey')} className={`${theme.heading} hover:opacity-50 transition-colors cursor-pointer`}>Experience</a>
            <a 
              href={`mailto:${config.email}`}
              onClick={() => setMenuOpen(false)} 
              className={`px-8 py-3 text-lg font-sans ${theme.button}`}
            >
              Contact
            </a>
        </div>
      )}

      {/* Hero Section */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden">
        {config.show3DBackground && <AbstractScene variant={config.template} />}
        
        {/* Gradient Overlay for Readability */}
        {config.template === 'cyber' 
            ? <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(15,23,42,0)_0%,rgba(15,23,42,0.8)_80%,rgba(15,23,42,1)_100%)]" />
            : <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(249,248,244,0.7)_0%,rgba(249,248,244,0.5)_60%,rgba(249,248,244,0.1)_100%)]" />
        }

        <div className="relative z-10 container mx-auto px-6 text-center pt-20">
          <div className={`inline-block mb-6 px-4 py-1.5 border text-xs tracking-[0.2em] uppercase font-bold rounded-full backdrop-blur-sm ${config.template === 'cyber' ? 'border-cyan-900 text-cyan-400 bg-slate-900/50' : (config.template === 'brutal' ? 'border-black text-black bg-white' : 'border-stone-300 text-stone-500 bg-white/40')}`}>
            Portfolio 2025
          </div>
          <h1 className={`text-5xl md:text-7xl lg:text-8xl leading-tight mb-4 drop-shadow-sm ${theme.heading}`}>
            <InlineText
              value={config.name}
              onChange={(val) => handleConfigChange({ ...config, name: val })}
              isEditing={editorOpen}
              className="text-center"
              placeholder="Your Name"
            />
          </h1>
          <h2 className={`text-xl md:text-2xl font-bold tracking-[0.1em] uppercase mb-8 ${config.template === 'cyber' ? 'font-mono text-cyan-400' : 'text-stone-500'}`}>
            <InlineText
              value={config.title}
              onChange={(val) => handleConfigChange({ ...config, title: val })}
              isEditing={editorOpen}
              className="text-center"
              placeholder="Your Professional Title"
            />
          </h2>
          <div className={`w-24 h-1 mx-auto mb-8 ${config.template === 'cyber' ? 'bg-cyan-500' : (config.template === 'brutal' ? 'bg-black h-2' : 'bg-stone-900')}`}></div>
          <p className={`max-w-2xl mx-auto text-xl md:text-2xl leading-relaxed mb-12 ${config.template === 'brutal' ? 'font-medium' : 'font-light'} ${theme.text}`}>
            <InlineTextArea
              value={config.bio}
              onChange={(val) => handleConfigChange({ ...config, bio: val })}
              isEditing={editorOpen}
              className="text-center"
              placeholder="A short bio describing your research interests"
            />
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {[
                { label: 'GitHub', icon: Github, link: config.github }, 
                { label: 'LinkedIn', icon: Linkedin, link: config.linkedin }, 
                { label: 'ORCID', icon: Fingerprint, link: config.orcid ? `https://orcid.org/${config.orcid}` : null },
                { label: 'Google Scholar', icon: BookOpen, link: config.googleScholar },
                { label: 'ResearchGate', icon: Globe, link: config.researchGate },
                { label: 'Semantic Scholar', icon: Sparkles, link: config.semanticScholar },
                { label: 'Twitter / X', icon: Share2, link: config.twitter },
                { label: 'Bluesky', icon: Globe, link: config.bsky },
                { label: 'Email', icon: Mail, link: config.email ? `mailto:${config.email}` : null }
              ].filter(item => Boolean(item.link)).map((social, i) => (
                <a 
                    key={i} 
                    href={social.link!} 
                    target="_blank" 
                    rel="noreferrer" 
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-all hover:scale-105 ${
                      config.template === 'cyber' 
                        ? 'bg-slate-800/90 text-cyan-400 hover:bg-cyan-900 border border-cyan-800/60 rounded-md' 
                        : (config.template === 'brutal' 
                          ? 'bg-white text-black border-2 border-black hover:bg-black hover:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' 
                          : 'bg-white/90 text-stone-800 hover:text-stone-900 hover:bg-white border border-stone-200 rounded-full shadow-sm backdrop-blur-sm')
                    }`}
                >
                    <social.icon size={14} />
                    <span>{social.label}</span>
                </a>
              ))}
          </div>

          <div className="absolute bottom-12 left-0 right-0 flex justify-center animate-bounce-slow">
             <a href="#about" onClick={scrollToSection('about')} className={`${theme.textMuted} hover:${theme.text} transition-colors cursor-pointer`}>
                <ArrowDown size={24} />
             </a>
          </div>
        </div>
      </header>

      <main>
        {/* About Section */}
        <section id="about" className={`py-32 ${theme.sectionPrimary}`}>
          <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
            <div className="md:col-span-4 sticky top-32">
              <div className={`inline-block mb-3 text-xs ${theme.subheading}`}>01 • About</div>
              <h2 className={`text-4xl md:text-5xl mb-6 leading-tight ${theme.heading}`}>
                <InlineText
                  value={config.aboutTitle}
                  onChange={(val) => handleConfigChange({ ...config, aboutTitle: val })}
                  isEditing={editorOpen}
                  placeholder="About Title"
                />
              </h2>
              <div className={`w-12 h-1 ${config.template === 'cyber' ? 'bg-cyan-900' : (config.template === 'brutal' ? 'bg-black h-2' : 'bg-stone-200')}`}></div>
            </div>
            <div className={`md:col-span-8 text-lg md:text-xl leading-relaxed space-y-8 whitespace-pre-line ${config.template === 'cyber' ? 'font-light text-slate-400' : (config.template === 'brutal' ? 'font-medium text-black' : 'font-light text-stone-600')}`}>
              {editorOpen ? (
                <InlineTextArea
                  value={config.about}
                  onChange={(val) => handleConfigChange({ ...config, about: val })}
                  isEditing={true}
                  className={`w-full ${config.template === 'cyber' ? 'text-slate-400' : 'text-stone-600'}`}
                  placeholder="Write a description of your research vision..."
                />
              ) : (
                config.about.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className={idx === 0 ? `first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:mt-[-6px] ${theme.heading}` : ""}>
                    {paragraph}
                  </p>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Skills Section */}
        {((config.skills && config.skills.length > 0) || editorOpen) && (
            <section id="skills" className={`py-24 border-t ${theme.sectionSecondary} ${theme.border}`}>
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="max-w-xs">
                            <div className={`inline-block mb-3 text-xs ${theme.subheading}`}>02 • Expertise</div>
                            <h2 className={`text-3xl md:text-4xl ${theme.heading}`}>Core Skills</h2>
                        </div>
                        <div className="flex-1 flex flex-wrap gap-3 justify-end items-center">
                            {config.skills.map((skill, i) => {
                                const removeSkill = () => {
                                    const newSkills = config.skills.filter((_, idx) => idx !== i);
                                    handleConfigChange({ ...config, skills: newSkills });
                                };
                                return (
                                    <span key={i} className={`px-6 py-3 text-sm font-bold tracking-wide transition-all hover:scale-105 inline-flex items-center gap-2 ${
                                        config.template === 'cyber' ? 'bg-slate-900 border border-cyan-900 text-cyan-400 rounded-md' : 
                                        (config.template === 'brutal' ? 'bg-white border-2 border-black text-black shadow-[4px_4px_0px_rgba(0,0,0,1)]' : 'bg-white border border-stone-200 text-stone-700 rounded-full shadow-sm')
                                    }`}>
                                        <span>{skill}</span>
                                        {editorOpen && (
                                            <button 
                                                onClick={removeSkill}
                                                className="text-red-500 hover:text-red-700 font-bold ml-1 cursor-pointer hover:scale-110 transition-transform"
                                                title="Remove Skill"
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </span>
                                );
                            })}
                            {editorOpen && (
                                <input
                                    type="text"
                                    placeholder="+ Add Skill (Press Enter)"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value.trim();
                                            if (val && !config.skills.includes(val)) {
                                                handleConfigChange({ ...config, skills: [...config.skills, val] });
                                                e.currentTarget.value = '';
                                            }
                                        }
                                    }}
                                    className={`px-4 py-2 border border-dashed rounded-full text-xs font-semibold focus:outline-none focus:border-stone-500 w-44 bg-transparent ${
                                        config.template === 'cyber' ? 'border-cyan-800 text-cyan-400' :
                                        (config.template === 'brutal' ? 'border-black text-black' : 'border-stone-300 text-stone-600')
                                    }`}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </section>
        )}

        {/* Work / Projects Section */}
        <section id="work" className={`py-32 border-t ${theme.sectionPrimary} ${theme.border}`}>
            <div className="container mx-auto px-6">
                 <div className="flex flex-col items-center text-center mb-20">
                    <div className={`inline-block mb-3 text-xs ${theme.subheading}`}>03 • Selected Work</div>
                    <h2 className={`text-4xl md:text-6xl mb-6 ${theme.heading}`}>Recent Projects</h2>
                    <p className={`max-w-xl ${theme.textMuted}`}>A curation of projects that define my approach to problem-solving and visual aesthetics.</p>
                 </div>
                 
                 <ProjectGrid 
                    projects={config.projects} 
                    template={config.template} 
                    isEditing={editorOpen}
                    onChange={(projects) => handleConfigChange({ ...config, projects })}
                  />
            </div>
        </section>

        {/* Journey / Timeline Section */}
        <section id="journey" className={`py-32 border-t ${theme.sectionSecondary} ${theme.border}`}>
            <div className="container mx-auto px-6">
                <div className="mb-12">
                   <div className={`inline-block mb-3 text-xs ${theme.subheading}`}>04 • Experience</div>
                </div>
                <ExperienceTimeline 
                  experience={config.experience} 
                  template={config.template} 
                  isEditing={editorOpen}
                  onChange={(experience) => handleConfigChange({ ...config, experience })}
                />
            </div>
        </section>

        {/* Education Section */}
        {((config.education && config.education.length > 0) || editorOpen) && (
            <section id="education" className={`py-32 border-t ${theme.sectionPrimary} ${theme.border}`}>
                <div className="container mx-auto px-6">
                    <div className="flex flex-col items-center text-center mb-16">
                        <div className={`inline-block mb-3 text-xs ${theme.subheading}`}>05 • Education</div>
                        <h2 className={`text-4xl md:text-5xl mb-6 ${theme.heading}`}>Academic Background</h2>
                    </div>
                    
                    <div className="max-w-4xl mx-auto space-y-8">
                        {(config.education || []).map((edu, idx) => {
                            const isCyber = config.template === 'cyber';
                            const isBrutal = config.template === 'brutal';
                            const isEditingThis = editingItemId === edu.id;
                            
                            let cardClass = "p-8 transition-all duration-300 ";
                            if (isCyber) {
                                cardClass += "bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-lg";
                            } else if (isBrutal) {
                                cardClass += "bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]";
                            } else {
                                cardClass += "bg-white border border-stone-200 rounded-xl hover:shadow-lg";
                            }

                            const editFormJSX = (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Year</label>
                                            <input 
                                                type="text" 
                                                value={edu.year} 
                                                onChange={(e) => handleEduChange(idx, 'year', e.target.value)} 
                                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Degree</label>
                                            <input 
                                                type="text" 
                                                value={edu.degree} 
                                                onChange={(e) => handleEduChange(idx, 'degree', e.target.value)} 
                                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">School</label>
                                            <input 
                                                type="text" 
                                                value={edu.school} 
                                                onChange={(e) => handleEduChange(idx, 'school', e.target.value)} 
                                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Description</label>
                                            <textarea 
                                                value={edu.description || ''} 
                                                onChange={(e) => handleEduChange(idx, 'description', e.target.value)} 
                                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded h-20 resize-none text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => setEditingItemId(null)}
                                            className="px-4 py-1.5 bg-stone-900 text-white rounded text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            );

                            const cardContentJSX = (
                                <div className="flex flex-col md:flex-row gap-6 justify-between">
                                    <div className="space-y-2">
                                        <div className={`text-xs font-bold uppercase tracking-widest ${isCyber ? 'text-cyan-500' : (isBrutal ? 'bg-black text-white px-2 py-1 inline-block' : 'text-stone-400')}`}>
                                            {edu.year}
                                        </div>
                                        <h3 className={`text-2xl ${theme.heading}`}>{edu.degree}</h3>
                                        <div className={`text-lg font-medium ${isCyber ? 'text-slate-300' : 'text-stone-600'}`}>{edu.school}</div>
                                    </div>
                                    <div className={`md:max-w-md text-sm leading-relaxed ${theme.textMuted}`}>
                                        {edu.description}
                                    </div>
                                </div>
                            );

                            return (
                                <EditableItemWrapper
                                    key={edu.id}
                                    isEditing={editorOpen}
                                    onMoveUp={() => {
                                        if (idx > 0) {
                                            const list = [...config.education];
                                            const temp = list[idx];
                                            list[idx] = list[idx - 1];
                                            list[idx - 1] = temp;
                                            handleConfigChange({ ...config, education: list });
                                        }
                                    }}
                                    onMoveDown={() => {
                                        if (idx < config.education.length - 1) {
                                            const list = [...config.education];
                                            const temp = list[idx];
                                            list[idx] = list[idx + 1];
                                            list[idx + 1] = temp;
                                            handleConfigChange({ ...config, education: list });
                                        }
                                    }}
                                    onDelete={() => {
                                        const list = config.education.filter((_, i) => i !== idx);
                                        handleConfigChange({ ...config, education: list });
                                    }}
                                    onEdit={() => setEditingItemId(edu.id)}
                                    canMoveUp={idx > 0}
                                    canMoveDown={idx < config.education.length - 1}
                                >
                                    <div className={cardClass}>
                                        {isEditingThis ? editFormJSX : cardContentJSX}
                                    </div>
                                </EditableItemWrapper>
                            );
                        })}
                    </div>

                    {editorOpen && (
                        <div className="flex justify-center mt-8">
                            <button 
                                onClick={addEdu}
                                className={`px-5 py-2 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                                    config.template === 'cyber' ? 'border border-cyan-800 text-cyan-400 bg-slate-900 hover:bg-cyan-900/30' :
                                    (config.template === 'brutal' ? 'border-2 border-black bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-stone-200 text-stone-600 hover:border-stone-800 hover:text-stone-900 rounded-full bg-white')
                                }`}
                            >
                                <Plus size={14} /> Add Education
                            </button>
                        </div>
                    )}
                </div>
            </section>
        )}

        {/* Publications Section */}
        {((config.publications && config.publications.length > 0) || editorOpen) && (
            <section id="publications" className={`py-32 border-t ${theme.sectionSecondary} ${theme.border}`}>
                <div className="container mx-auto px-6">
                    <div className="flex flex-col items-center text-center mb-12">
                        <div className={`inline-block mb-3 text-xs ${theme.subheading}`}>04 • Publications</div>
                        <h2 className={`text-4xl md:text-5xl mb-4 ${theme.heading}`}>Scholarly Publications</h2>
                        <p className={`max-w-xl text-sm ${theme.textMuted}`}>Peer-reviewed papers, preprints, and technical reports.</p>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="max-w-4xl mx-auto mb-10 space-y-4">
                        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                            {/* Search input */}
                            <div className="relative w-full md:w-80">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input
                                    type="text"
                                    value={pubSearchQuery}
                                    onChange={(e) => setPubSearchQuery(e.target.value)}
                                    placeholder="Search by title, author, venue..."
                                    className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 shadow-sm text-black"
                                />
                                {pubSearchQuery && (
                                    <button onClick={() => setPubSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Type Pills */}
                            <div className="flex flex-wrap gap-1.5 justify-center md:justify-end">
                                {['all', 'journal', 'conference', 'preprint', 'workshop', 'book', 'patent'].map((typeKey) => (
                                    <button
                                        key={typeKey}
                                        onClick={() => setSelectedPubType(typeKey)}
                                        className={`px-3 py-1 text-[11px] font-bold uppercase rounded-full transition-all cursor-pointer ${
                                            selectedPubType === typeKey
                                                ? 'bg-stone-900 text-white shadow-sm'
                                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                        }`}
                                    >
                                        {typeKey}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="max-w-4xl mx-auto space-y-6">
                        {(config.publications || [])
                            .filter(pub => {
                                const matchesType = selectedPubType === 'all' || pub.type === selectedPubType;
                                const q = pubSearchQuery.toLowerCase();
                                const matchesQuery = !q || 
                                    pub.title.toLowerCase().includes(q) || 
                                    pub.authors.toLowerCase().includes(q) || 
                                    pub.journal.toLowerCase().includes(q) ||
                                    pub.year.toString().includes(q);
                                return matchesType && matchesQuery;
                            })
                            .map((pub, idx) => {
                                const isCyber = config.template === 'cyber';
                                const isBrutal = config.template === 'brutal';
                                const isEditingThis = editingItemId === pub.id;
                                
                                let cardClass = "p-6 md:p-8 transition-all duration-300 ";
                                if (isCyber) {
                                    cardClass += "bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded-lg";
                                } else if (isBrutal) {
                                    cardClass += "bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]";
                                } else {
                                    cardClass += "bg-white border border-stone-200 rounded-xl hover:shadow-lg hover:border-stone-300";
                                }

                                const bibtexStr = pub.bibtex || `@article{${pub.authors.split(',')[0].toLowerCase().replace(/[^a-z]/g, '')}${pub.year},\n  title = {${pub.title}},\n  author = {${pub.authors}},\n  journal = {${pub.journal}},\n  year = {${pub.year}}\n}`;

                                const editFormJSX = (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Title</label>
                                                <input 
                                                    type="text" 
                                                    value={pub.title} 
                                                    onChange={(e) => handlePubChange(idx, 'title', e.target.value)} 
                                                    className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Authors</label>
                                                <input 
                                                    type="text" 
                                                    value={pub.authors} 
                                                    onChange={(e) => handlePubChange(idx, 'authors', e.target.value)} 
                                                    className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Journal / Venue</label>
                                                <input 
                                                    type="text" 
                                                    value={pub.journal} 
                                                    onChange={(e) => handlePubChange(idx, 'journal', e.target.value)} 
                                                    className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Year</label>
                                                <input 
                                                    type="text" 
                                                    value={pub.year} 
                                                    onChange={(e) => handlePubChange(idx, 'year', e.target.value)} 
                                                    className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Type</label>
                                                <select 
                                                    value={pub.type || 'journal'} 
                                                    onChange={(e) => handlePubChange(idx, 'type', e.target.value)} 
                                                    className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                                >
                                                    <option value="journal">Journal</option>
                                                    <option value="conference">Conference</option>
                                                    <option value="preprint">Preprint</option>
                                                    <option value="workshop">Workshop</option>
                                                    <option value="book">Book</option>
                                                    <option value="patent">Patent</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">DOI</label>
                                                <input 
                                                    type="text" 
                                                    value={pub.doi || ''} 
                                                    onChange={(e) => handlePubChange(idx, 'doi', e.target.value)} 
                                                    className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">URL</label>
                                                <input 
                                                    type="text" 
                                                    value={pub.url || ''} 
                                                    onChange={(e) => handlePubChange(idx, 'url', e.target.value)} 
                                                    className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">PDF URL</label>
                                                <input 
                                                    type="text" 
                                                    value={pub.pdfUrl || ''} 
                                                    onChange={(e) => handlePubChange(idx, 'pdfUrl', e.target.value)} 
                                                    className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Code URL</label>
                                                <input 
                                                    type="text" 
                                                    value={pub.codeUrl || ''} 
                                                    onChange={(e) => handlePubChange(idx, 'codeUrl', e.target.value)} 
                                                    className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Abstract</label>
                                                <textarea 
                                                    value={pub.abstract || ''} 
                                                    onChange={(e) => handlePubChange(idx, 'abstract', e.target.value)} 
                                                    className="w-full p-2 text-xs bg-white border border-stone-200 rounded h-16 resize-none text-black font-sans focus:outline-none focus:border-stone-400" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">BibTeX Citation</label>
                                                <textarea 
                                                    value={pub.bibtex || ''} 
                                                    onChange={(e) => handlePubChange(idx, 'bibtex', e.target.value)} 
                                                    className="w-full p-2 text-xs bg-white border border-stone-200 rounded h-16 resize-none text-black font-mono focus:outline-none focus:border-stone-400" 
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button 
                                                onClick={() => setEditingItemId(null)}
                                                className="px-4 py-1.5 bg-stone-900 text-white rounded text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                );

                                const cardContentJSX = (
                                    <div className="space-y-4">
                                        {/* Metadata header line */}
                                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400">
                                            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-[10px] font-black">{pub.type || 'journal'}</span>
                                            <span>{pub.year}</span>
                                            <span>•</span>
                                            <span className="text-stone-600 font-semibold">{pub.journal}</span>
                                        </div>

                                        {/* Title & Authors */}
                                        <div>
                                            <h3 className={`text-xl md:text-2xl font-serif leading-snug mb-2 ${theme.heading}`}>
                                                {pub.title}
                                            </h3>
                                            <p className="text-sm text-stone-600 font-medium">{pub.authors}</p>
                                        </div>

                                        {/* Action Buttons Row */}
                                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                                            {pub.pdfUrl && (
                                                <a 
                                                    href={pub.pdfUrl} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-md transition-colors"
                                                >
                                                    <FileText size={12} />
                                                    <span>PDF</span>
                                                </a>
                                            )}
                                            {pub.codeUrl && (
                                                <a 
                                                    href={pub.codeUrl} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 rounded-md transition-colors"
                                                >
                                                    <Code size={12} />
                                                    <span>Code</span>
                                                </a>
                                            )}
                                            {pub.doi && (
                                                <a 
                                                    href={`https://doi.org/${pub.doi}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-md transition-colors"
                                                >
                                                    <span>DOI</span>
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                            {pub.url && (
                                                <a 
                                                    href={pub.url} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 rounded-md transition-colors"
                                                >
                                                    <span>Link</span>
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}

                                            <button
                                                onClick={() => toggleBibtex(pub.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                                            >
                                                <FileCode size={12} />
                                                <span>BibTeX</span>
                                            </button>

                                            {pub.abstract && (
                                                <button
                                                    onClick={() => toggleAbstract(pub.id)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 px-2 py-1 cursor-pointer"
                                                >
                                                    <span>Abstract</span>
                                                    {expandedAbstract[pub.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                </button>
                                            )}

                                            <button
                                                onClick={() => copyToClipboard(formatCitation(pub, 'apa'), `apa-${pub.id}`)}
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400 hover:text-stone-700 px-2 py-1 ml-auto cursor-pointer"
                                                title="Copy APA Citation"
                                            >
                                                {copiedCitationId === `apa-${pub.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                                <span>Copy APA</span>
                                            </button>
                                        </div>

                                        {/* Expandable Abstract */}
                                        {pub.abstract && expandedAbstract[pub.id] && (
                                            <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 leading-relaxed font-sans animate-in fade-in">
                                                <div className="font-bold text-[10px] text-stone-400 uppercase mb-1">Abstract</div>
                                                {pub.abstract}
                                            </div>
                                        )}

                                        {/* Expandable BibTeX Card */}
                                        {expandedBibtex[pub.id] && (
                                            <div className="p-4 bg-stone-900 text-emerald-400 font-mono text-xs rounded-lg space-y-3 relative overflow-x-auto shadow-inner animate-in fade-in">
                                                <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                                                    <span className="text-[10px] text-stone-400 uppercase font-bold">BibTeX Citation</span>
                                                    <button
                                                        onClick={() => copyToClipboard(bibtexStr, `bib-${pub.id}`)}
                                                        className="flex items-center gap-1 px-2 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded text-[10px] transition-colors cursor-pointer"
                                                    >
                                                        {copiedCitationId === `bib-${pub.id}` ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                                        <span>{copiedCitationId === `bib-${pub.id}` ? 'Copied' : 'Copy'}</span>
                                                    </button>
                                                </div>
                                                <pre className="whitespace-pre-wrap leading-relaxed">{bibtexStr}</pre>
                                            </div>
                                        )}
                                    </div>
                                );

                                return (
                                    <EditableItemWrapper
                                        key={pub.id}
                                        isEditing={editorOpen}
                                        onMoveUp={() => {
                                            if (idx > 0) {
                                                const list = [...config.publications];
                                                const temp = list[idx];
                                                list[idx] = list[idx - 1];
                                                list[idx - 1] = temp;
                                                handleConfigChange({ ...config, publications: list });
                                            }
                                        }}
                                        onMoveDown={() => {
                                            if (idx < config.publications.length - 1) {
                                                const list = [...config.publications];
                                                const temp = list[idx];
                                                list[idx] = list[idx + 1];
                                                list[idx + 1] = temp;
                                                handleConfigChange({ ...config, publications: list });
                                            }
                                        }}
                                        onDelete={() => {
                                            const list = config.publications.filter((_, i) => i !== idx);
                                            handleConfigChange({ ...config, publications: list });
                                        }}
                                        onEdit={() => setEditingItemId(pub.id)}
                                        canMoveUp={idx > 0}
                                        canMoveDown={idx < config.publications.length - 1}
                                    >
                                        <div className={cardClass}>
                                            {isEditingThis ? editFormJSX : cardContentJSX}
                                        </div>
                                    </EditableItemWrapper>
                                );
                            })}
                    </div>

                    {editorOpen && (
                        <div className="flex justify-center mt-8 gap-3">
                            <button 
                                onClick={addPub}
                                className={`px-5 py-2 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                                    config.template === 'cyber' ? 'border border-cyan-800 text-cyan-400 bg-slate-900 hover:bg-cyan-900/30' :
                                    (config.template === 'brutal' ? 'border-2 border-black bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-stone-200 text-stone-600 hover:border-stone-800 hover:text-stone-900 rounded-full bg-white')
                                }`}
                            >
                                <Plus size={14} /> Add Publication
                            </button>
                        </div>
                    )}
                </div>
            </section>
        )}

        {/* Grants & Research Funding Section */}
        {((config.grants && config.grants.length > 0) || editorOpen) && (
            <section id="funding" className={`py-24 border-t ${theme.sectionPrimary} ${theme.border}`}>
                <div className="container mx-auto px-6">
                    <div className="flex flex-col items-center text-center mb-12">
                        <div className={`inline-block mb-3 text-xs ${theme.subheading}`}>05 • Grants</div>
                        <h2 className={`text-3xl md:text-4xl mb-4 ${theme.heading}`}>Research Funding & Grants</h2>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(config.grants || []).map((grant, idx) => {
                            const isEditingThis = editingItemId === grant.id;

                            const editFormJSX = (
                                <div className="space-y-3 text-left w-full">
                                    <div className="grid grid-cols-1 gap-2">
                                        <div>
                                            <label className="block text-[9px] font-bold text-stone-400 uppercase mb-0.5">Grant Title</label>
                                            <input 
                                                type="text" 
                                                value={grant.title} 
                                                onChange={(e) => handleGrantChange(idx, 'title', e.target.value)} 
                                                className="w-full p-1.5 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[9px] font-bold text-stone-400 uppercase mb-0.5">Funder</label>
                                            <input 
                                                type="text" 
                                                value={grant.funder} 
                                                onChange={(e) => handleGrantChange(idx, 'funder', e.target.value)} 
                                                className="w-full p-1.5 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-stone-400 uppercase mb-0.5">Period</label>
                                            <input 
                                                type="text" 
                                                value={grant.period} 
                                                onChange={(e) => handleGrantChange(idx, 'period', e.target.value)} 
                                                className="w-full p-1.5 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[9px] font-bold text-stone-400 uppercase mb-0.5">Role</label>
                                            <input 
                                                type="text" 
                                                value={grant.role || ''} 
                                                onChange={(e) => handleGrantChange(idx, 'role', e.target.value)} 
                                                className="w-full p-1.5 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-stone-400 uppercase mb-0.5">Amount</label>
                                            <input 
                                                type="text" 
                                                value={grant.amount || ''} 
                                                onChange={(e) => handleGrantChange(idx, 'amount', e.target.value)} 
                                                className="w-full p-1.5 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-stone-400 uppercase mb-0.5">Description (Optional)</label>
                                        <textarea 
                                            value={grant.description || ''} 
                                            onChange={(e) => handleGrantChange(idx, 'description', e.target.value)} 
                                            className="w-full p-1.5 text-xs bg-white border border-stone-200 rounded h-12 resize-none text-black font-sans focus:outline-none focus:border-stone-400" 
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => setEditingItemId(null)}
                                            className="px-3 py-1 bg-stone-900 text-white rounded text-[11px] font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            );

                            const cardContentJSX = (
                                <>
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                            {grant.funder}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-stone-500">{grant.period}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-stone-900 leading-snug">{grant.title}</h3>
                                    <div className="flex items-center justify-between text-xs text-stone-600 pt-2 border-t border-stone-200/60">
                                        <span>{grant.role || 'Principal Investigator'}</span>
                                        {grant.amount && <span className="font-mono font-bold text-stone-900">{grant.amount}</span>}
                                    </div>
                                </>
                            );

                            return (
                                <EditableItemWrapper
                                    key={grant.id}
                                    isEditing={editorOpen}
                                    onMoveUp={() => {
                                        if (idx > 0) {
                                            const list = [...config.grants!];
                                            const temp = list[idx];
                                            list[idx] = list[idx - 1];
                                            list[idx - 1] = temp;
                                            handleConfigChange({ ...config, grants: list });
                                        }
                                    }}
                                    onMoveDown={() => {
                                        if (idx < config.grants!.length - 1) {
                                            const list = [...config.grants!];
                                            const temp = list[idx];
                                            list[idx] = list[idx + 1];
                                            list[idx + 1] = temp;
                                            handleConfigChange({ ...config, grants: list });
                                        }
                                    }}
                                    onDelete={() => {
                                        const list = config.grants!.filter((_, i) => i !== idx);
                                        handleConfigChange({ ...config, grants: list });
                                    }}
                                    onEdit={() => setEditingItemId(grant.id)}
                                    canMoveUp={idx > 0}
                                    canMoveDown={idx < config.grants!.length - 1}
                                >
                                    <div className="p-6 bg-stone-50 border border-stone-200 rounded-xl space-y-3 hover:border-stone-300 transition-all w-full">
                                        {isEditingThis ? editFormJSX : cardContentJSX}
                                    </div>
                                </EditableItemWrapper>
                            );
                        })}
                    </div>

                    {editorOpen && (
                        <div className="flex justify-center mt-8">
                            <button 
                                onClick={addGrant}
                                className={`px-5 py-2 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                                    config.template === 'cyber' ? 'border border-cyan-800 text-cyan-400 bg-slate-900 hover:bg-cyan-900/30' :
                                    (config.template === 'brutal' ? 'border-2 border-black bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-stone-200 text-stone-600 hover:border-stone-800 hover:text-stone-900 rounded-full bg-white')
                                }`}
                            >
                                <Plus size={14} /> Add Grant
                            </button>
                        </div>
                    )}
                </div>
            </section>
        )}

        {/* Teaching Section */}
        {((config.teaching && config.teaching.length > 0) || editorOpen) && (
            <section id="teaching" className={`py-24 border-t ${theme.sectionSecondary} ${theme.border}`}>
                <div className="container mx-auto px-6">
                    <div className="flex flex-col items-center text-center mb-12">
                        <div className={`inline-block mb-3 text-xs ${theme.subheading}`}>06 • Teaching</div>
                        <h2 className={`text-3xl md:text-4xl mb-4 ${theme.heading}`}>Teaching & Mentorship</h2>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-4">
                        {(config.teaching || []).map((course, idx) => {
                            const isEditingThis = editingItemId === course.id;

                            const editFormJSX = (
                                <div className="space-y-3 text-left w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Code</label>
                                            <input 
                                                type="text" 
                                                value={course.code} 
                                                onChange={(e) => handleTeachingChange(idx, 'code', e.target.value)} 
                                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Course Title</label>
                                            <input 
                                                type="text" 
                                                value={course.title} 
                                                onChange={(e) => handleTeachingChange(idx, 'title', e.target.value)} 
                                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Institution</label>
                                            <input 
                                                type="text" 
                                                value={course.institution} 
                                                onChange={(e) => handleTeachingChange(idx, 'institution', e.target.value)} 
                                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Role</label>
                                            <input 
                                                type="text" 
                                                value={course.role} 
                                                onChange={(e) => handleTeachingChange(idx, 'role', e.target.value)} 
                                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Term</label>
                                            <input 
                                                type="text" 
                                                value={course.term} 
                                                onChange={(e) => handleTeachingChange(idx, 'term', e.target.value)} 
                                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => setEditingItemId(null)}
                                            className="px-4 py-1.5 bg-stone-900 text-white rounded text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            );

                            const cardContentJSX = (
                                <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-stone-900 text-white text-[10px] font-mono font-bold rounded">{course.code}</span>
                                            <h3 className="text-base font-bold text-stone-900">{course.title}</h3>
                                        </div>
                                        <p className="text-xs text-stone-500">{course.institution} • <span className="font-medium text-stone-700">{course.role}</span></p>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">{course.term}</span>
                                </div>
                            );

                            return (
                                <EditableItemWrapper
                                    key={course.id}
                                    isEditing={editorOpen}
                                    onMoveUp={() => {
                                        if (idx > 0) {
                                            const list = [...config.teaching!];
                                            const temp = list[idx];
                                            list[idx] = list[idx - 1];
                                            list[idx - 1] = temp;
                                            handleConfigChange({ ...config, teaching: list });
                                        }
                                    }}
                                    onMoveDown={() => {
                                        if (idx < config.teaching!.length - 1) {
                                            const list = [...config.teaching!];
                                            const temp = list[idx];
                                            list[idx] = list[idx + 1];
                                            list[idx + 1] = temp;
                                            handleConfigChange({ ...config, teaching: list });
                                        }
                                    }}
                                    onDelete={() => {
                                        const list = config.teaching!.filter((_, i) => i !== idx);
                                        handleConfigChange({ ...config, teaching: list });
                                    }}
                                    onEdit={() => setEditingItemId(course.id)}
                                    canMoveUp={idx > 0}
                                    canMoveDown={idx < config.teaching!.length - 1}
                                >
                                    <div className="p-5 bg-white border border-stone-200 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
                                        {isEditingThis ? editFormJSX : cardContentJSX}
                                    </div>
                                </EditableItemWrapper>
                            );
                        })}
                    </div>

                    {editorOpen && (
                        <div className="flex justify-center mt-8">
                            <button 
                                onClick={addTeaching}
                                className={`px-5 py-2 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                                    config.template === 'cyber' ? 'border border-cyan-800 text-cyan-400 bg-slate-900 hover:bg-cyan-900/30' :
                                    (config.template === 'brutal' ? 'border-2 border-black bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-stone-200 text-stone-600 hover:border-stone-800 hover:text-stone-900 rounded-full bg-white')
                                }`}
                            >
                                <Plus size={14} /> Add Course
                            </button>
                        </div>
                    )}
                </div>
            </section>
        )}

        {/* Awards Section */}
        {((config.awards && config.awards.length > 0) || editorOpen) && (
            <section id="awards" className={`py-24 border-t ${theme.sectionPrimary} ${theme.border}`}>
                <div className="container mx-auto px-6">
                    <div className="flex flex-col items-center text-center mb-12">
                        <div className={`inline-block mb-3 text-xs ${theme.subheading}`}>07 • Honors</div>
                        <h2 className={`text-3xl md:text-4xl mb-4 ${theme.heading}`}>Awards & Recognition</h2>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-3">
                        {(config.awards || []).map((award, idx) => {
                            const isEditingThis = editingItemId === award.id;

                            const editFormJSX = (
                                <div className="space-y-3 text-left w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Award Title</label>
                                            <input 
                                                type="text" 
                                                value={award.title} 
                                                onChange={(e) => handleAwardChange(idx, 'title', e.target.value)} 
                                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Year</label>
                                            <input 
                                                type="text" 
                                                value={award.year} 
                                                onChange={(e) => handleAwardChange(idx, 'year', e.target.value)} 
                                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Issuer</label>
                                            <input 
                                                type="text" 
                                                value={award.issuer} 
                                                onChange={(e) => handleAwardChange(idx, 'issuer', e.target.value)} 
                                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Description (Optional)</label>
                                            <textarea 
                                                value={award.description || ''} 
                                                onChange={(e) => handleAwardChange(idx, 'description', e.target.value)} 
                                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded h-12 resize-none text-black font-sans focus:outline-none focus:border-stone-400" 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => setEditingItemId(null)}
                                            className="px-4 py-1.5 bg-stone-900 text-white rounded text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            );

                            const cardContentJSX = (
                                <div className="w-full flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Award size={18} className="text-amber-500 shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-bold text-stone-900">{award.title}</h4>
                                            <p className="text-xs text-stone-500">{award.issuer}</p>
                                            {award.description && <p className="text-[11px] text-stone-400 mt-1 italic">{award.description}</p>}
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-stone-500 shrink-0">{award.year}</span>
                                </div>
                            );

                            return (
                                <EditableItemWrapper
                                    key={award.id}
                                    isEditing={editorOpen}
                                    onMoveUp={() => {
                                        if (idx > 0) {
                                            const list = [...config.awards!];
                                            const temp = list[idx];
                                            list[idx] = list[idx - 1];
                                            list[idx - 1] = temp;
                                            handleConfigChange({ ...config, awards: list });
                                        }
                                    }}
                                    onMoveDown={() => {
                                        if (idx < config.awards!.length - 1) {
                                            const list = [...config.awards!];
                                            const temp = list[idx];
                                            list[idx] = list[idx + 1];
                                            list[idx + 1] = temp;
                                            handleConfigChange({ ...config, awards: list });
                                        }
                                    }}
                                    onDelete={() => {
                                        const list = config.awards!.filter((_, i) => i !== idx);
                                        handleConfigChange({ ...config, awards: list });
                                    }}
                                    onEdit={() => setEditingItemId(award.id)}
                                    canMoveUp={idx > 0}
                                    canMoveDown={idx < config.awards!.length - 1}
                                >
                                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between gap-4 hover:bg-white transition-all w-full">
                                        {isEditingThis ? editFormJSX : cardContentJSX}
                                    </div>
                                </EditableItemWrapper>
                            );
                        })}
                    </div>

                    {editorOpen && (
                        <div className="flex justify-center mt-8">
                            <button 
                                onClick={addAward}
                                className={`px-5 py-2 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                                    config.template === 'cyber' ? 'border border-cyan-800 text-cyan-400 bg-slate-900 hover:bg-cyan-900/30' :
                                    (config.template === 'brutal' ? 'border-2 border-black bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-stone-200 text-stone-600 hover:border-stone-800 hover:text-stone-900 rounded-full bg-white')
                                }`}
                            >
                                <Plus size={14} /> Add Award
                            </button>
                        </div>
                    )}
                </div>
            </section>
        )}

        {/* Contact / Footer */}
        <section className={`${config.template === 'cyber' ? 'bg-slate-950' : 'bg-stone-900'} ${config.template === 'brutal' ? 'bg-black text-white' : 'text-stone-400'} py-32 relative overflow-hidden`}>
            {/* Abstract bg element */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2 ${config.template === 'cyber' ? 'bg-cyan-900 opacity-20' : 'bg-stone-800 opacity-20'}`}></div>
            
            <div className="container mx-auto px-6 relative z-10 text-center">
                <h2 className={`text-5xl md:text-7xl text-white mb-8 ${config.template === 'brutal' ? 'font-black uppercase' : (config.template === 'cyber' ? 'font-mono' : 'font-serif')}`}>Let's work together.</h2>
                <p className={`text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light ${config.template === 'cyber' ? 'text-slate-500' : 'text-stone-500'}`}>
                    I'm currently available for freelance projects and open to full-time opportunities.
                </p>
                
                <a 
                    href={`mailto:${config.email}`}
                    className={`inline-block px-10 py-4 rounded-full font-bold tracking-wide hover:scale-105 transition-all shadow-lg text-lg ${config.template === 'cyber' ? 'bg-cyan-600 text-white hover:bg-cyan-500' : (config.template === 'brutal' ? 'bg-white text-black rounded-none border-2 border-white hover:bg-black hover:text-white' : 'bg-white text-stone-900 hover:bg-stone-200')}`}
                >
                    Get in Touch
                </a>

                <div className={`mt-24 pt-12 border-t flex flex-col md:flex-row justify-between items-center gap-6 text-xs tracking-widest uppercase ${config.template === 'cyber' ? 'border-slate-800 text-slate-600' : 'border-stone-800'}`}>
                    <div>&copy; {new Date().getFullYear()} {config.name}</div>
                    <div className="flex gap-8 items-center">
                        <button onClick={downloadResearcherJson} className="hover:text-white transition-colors flex items-center gap-2 group" title="Download Portfolio Data">
                            <Database size={14} className="group-hover:scale-110 transition-transform"/>
                            <span>Export Data</span>
                        </button>
                        <a href={config.linkedin} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
                        <a href={config.github} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
                    </div>
                </div>
            </div>
        </section>

      </main>
    </div>
  );
};

export default App;

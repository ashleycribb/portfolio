
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { X, Save, Layout, Type, Briefcase, Layers, Plus, Trash2, Link as LinkIcon, Github, Linkedin, Mail, Image as ImageIcon, Monitor, Box, Zap, Tag, Fingerprint, BookOpen, FileText, AlertCircle, Sparkles, Loader2, ExternalLink, Database, ShieldCheck, Globe, CreditCard, Settings, CheckCircle2, AlertTriangle, Award, GraduationCap, DollarSign, FileCode, Copy, Check } from 'lucide-react';
import { FirebaseUser } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { parseBibTeX, generateBibTeX } from '../utils/bibtex';

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl?: string;
  projectUrl: string;
  embedUrl?: string;
}

export interface ExperienceItem {
  id: string;
  year: string;
  role: string;
  company: string;
  description: string;
}

export interface Publication {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  doi: string;
  url?: string;
  pdfUrl?: string;
  codeUrl?: string;
  datasetUrl?: string;
  slidesUrl?: string;
  abstract?: string;
  bibtex?: string;
  type?: 'journal' | 'conference' | 'preprint' | 'workshop' | 'book' | 'patent';
}

export interface GrantItem {
  id: string;
  title: string;
  funder: string;
  amount?: string;
  role?: string;
  period: string;
  grantNumber?: string;
  description?: string;
}

export interface TeachingItem {
  id: string;
  code: string;
  title: string;
  institution: string;
  role: string;
  term: string;
  url?: string;
}

export interface AwardItem {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description?: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  school: string;
  year: string;
  description?: string;
}

export type TemplateType = 'classic' | 'cyber' | 'brutal' | 'minimal' | 'emerald' | 'sunset' | 'slate' | 'custom';

export interface CustomThemeConfig {
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
  name?: string;
  description?: string;
}

export interface PortfolioConfig {
  template: TemplateType;
  customTheme?: CustomThemeConfig;
  name: string;
  title: string;
  bio: string;
  aboutTitle: string;
  about: string;
  projects: Project[];
  experience: ExperienceItem[];
  education: EducationItem[];
  publications: Publication[];
  grants?: GrantItem[];
  teaching?: TeachingItem[];
  awards?: AwardItem[];
  skills: string[];
  email: string;
  github: string;
  linkedin: string;
  googleScholar?: string;
  researchGate?: string;
  semanticScholar?: string;
  twitter?: string;
  bsky?: string;
  show3DBackground: boolean;
  // Academic SEO Fields
  orcid: string;
  keywords: string[];
}

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 600, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str); // Fallback to original if error
  });
};

export const initialConfig: PortfolioConfig = {
  template: 'classic',
  name: "Dr. Alex Morgan",
  title: "Assistant Professor of Human-Computer Interaction",
  bio: "Researching adaptive human-AI interfaces, neural interactions, and reproducible computational science.",
  aboutTitle: "Research Vision",
  about: "My laboratory investigates how intelligent adaptive interfaces enhance human cognitive capabilities without introducing friction or cognitive overload.\n\nWe build computational tools and human-centered systems that bridge raw algorithmic power with natural human intuition. Our goal is to make advanced scientific and creative workflows fluid, accessible, and zero-maintenance.",
  projects: [
    { 
      id: "1", 
      title: "Lumina Interface", 
      category: "UI/UX Design", 
      description: "A comprehensive design system for a fintech dashboard focusing on data clarity and dark mode accessibility.",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
      projectUrl: "https://example.com/lumina"
    },
    { 
      id: "2", 
      title: "Echo Audio", 
      category: "Mobile App", 
      description: "Social audio recording app allowing musicians to collaborate asynchronously on multi-track loops.",
      imageUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2670&auto=format&fit=crop",
      projectUrl: ""
    }
  ],
  experience: [
    {
      id: "1",
      year: "2024 - Present",
      role: "Assistant Professor",
      company: "Stanford University HCI Group",
      description: "Directing the Interactive Intelligence Lab and advising Ph.D. researchers in intelligent design interfaces."
    },
    {
      id: "2",
      year: "2021 - 2024",
      role: "Postdoctoral Research Fellow",
      company: "MIT CSAIL",
      description: "Researched zero-shot interface adaptation algorithms and published 4 peer-reviewed papers at CHI/UIST."
    }
  ],
  education: [
      {
          id: "1",
          year: "2017 - 2021",
          degree: "Ph.D. in Computer Science (HCI)",
          school: "Stanford University",
          description: "Dissertation: Adaptive Mixed-Initiative Interfaces for Complex Data Exploration. Advisor: Prof. Terry Winograd."
      }
  ],
  publications: [
    {
      id: "1",
      year: "2024",
      title: "Neural Interface Design: A Human-Centric Framework for Non-Invasive BCI Systems",
      authors: "Alex Morgan, Lin Chen, Marcus Vance",
      journal: "ACM Conference on Human Factors in Computing Systems (CHI '24)",
      doi: "10.1145/3544548.3581234",
      url: "https://example.com/paper1",
      pdfUrl: "https://arxiv.org/pdf/2401.00001.pdf",
      codeUrl: "https://github.com/example/neural-interface",
      datasetUrl: "https://zenodo.org/record/123456",
      abstract: "Non-invasive brain-computer interfaces (BCIs) suffer from low signal-to-noise ratios and latency. We present a predictive target-selection model that anticipates intent 240ms prior to motor activation, reducing typing error rates by 41.2% in user evaluations (N=32).",
      type: "conference",
      bibtex: `@inproceedings{morgan2024neural,\n  title={Neural Interface Design: A Human-Centric Framework for Non-Invasive BCI Systems},\n  author={Morgan, Alex and Chen, Lin and Vance, Marcus},\n  booktitle={ACM CHI Conference on Human Factors in Computing Systems},\n  year={2024},\n  doi={10.1145/3544548.3581234}\n}`
    },
    {
      id: "2",
      year: "2023",
      title: "Zero-Maintenance Academic Publishing: Reducing Overhead in Research Communication",
      authors: "Alex Morgan, Sarah Jenkins",
      journal: "Journal of Human-Computer Interaction (JHCI)",
      doi: "10.1234/jhci.2023.456",
      url: "https://example.com/paper2",
      pdfUrl: "https://arxiv.org/pdf/2305.00002.pdf",
      codeUrl: "https://github.com",
      abstract: "Researchers spend up to 45 hours annually managing static personal websites and citation lists. We evaluate automated BibTeX synchronization and schema-driven web design, demonstrating a 89% reduction in site maintenance friction.",
      type: "journal",
      bibtex: `@article{morgan2023maintenance,\n  title={Zero-Maintenance Academic Publishing: Reducing Overhead in Research Communication},\n  author={Morgan, Alex and Jenkins, Sarah},\n  journal={Journal of Human-Computer Interaction},\n  volume={14},\n  number={2},\n  pages={102--118},\n  year={2023},\n  doi={10.1234/jhci.2023.456}\n}`
    }
  ],
  grants: [
    {
      id: "1",
      title: "NSF CAREER: Adaptive Human-AI Interaction Models",
      funder: "National Science Foundation (NSF)",
      amount: "$550,000",
      role: "Principal Investigator (PI)",
      period: "2024 - 2029",
      grantNumber: "IIS-2345678",
      description: "Developing generative interface architectures that adapt in real-time to cognitive load indicators."
    }
  ],
  teaching: [
    {
      id: "1",
      code: "CS 247G",
      title: "Design for Interactive Intelligence",
      institution: "Stanford University",
      role: "Instructor",
      term: "Fall 2024",
      url: "https://stanford.edu"
    }
  ],
  awards: [
    {
      id: "1",
      title: "ACM CHI Honorable Mention Paper Award",
      issuer: "ACM SIGCHI",
      year: "2024",
      description: "Awarded to top 5% of accepted papers at CHI 2024."
    }
  ],
  skills: ["Human-Computer Interaction", "User Research", "TypeScript", "React", "Python/PyTorch", "Cognitive Science", "Signal Processing"],
  email: "alex.morgan@stanford.edu",
  github: "https://github.com",
  linkedin: "https://linkedin.com",
  googleScholar: "https://scholar.google.com",
  researchGate: "https://researchgate.net",
  semanticScholar: "https://semanticscholar.org",
  orcid: "0000-0002-1825-0097",
  twitter: "https://x.com",
  bsky: "https://bsky.app",
  show3DBackground: true,
  keywords: ["Human-Computer Interaction", "Brain-Computer Interfaces", "Adaptive UI", "Reproducible Science"]
};

export type SaveStatus = 'saving' | 'saved' | 'error';

interface EditorProps {
  isOpen: boolean;
  onClose: () => void;
  config: PortfolioConfig;
  onChange: (config: PortfolioConfig) => void;
  user: FirebaseUser | null;
  userData: any;
  saveStatus?: SaveStatus;
}

export const Editor: React.FC<EditorProps> = ({ isOpen, onClose, config, onChange, user, userData, saveStatus = 'saved' }) => {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [isFixing, setIsFixing] = useState<Record<string, boolean>>({});
  const [isOptimizing, setIsOptimizing] = useState(false);

  const configSize = new Blob([JSON.stringify(config)]).size;
  const isTooLarge = configSize > 800000; // Warn at 800KB, Firestore limit is 1MB

  const optimizePortfolio = async () => {
    setIsOptimizing(true);
    try {
      const newProjects = await Promise.all(config.projects.map(async (project) => {
        if (project.imageUrl?.startsWith('data:image/')) {
          // Only compress if it's a base64 string
          const compressed = await compressImage(project.imageUrl);
          return { ...project, imageUrl: compressed };
        }
        return project;
      }));
      onChange({ ...config, projects: newProjects });
      alert("Portfolio optimized! Images have been compressed to save space.");
    } catch (error) {
      console.error("Optimization failed:", error);
      alert("Failed to optimize portfolio.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'basics' | 'projects' | 'experience' | 'education' | 'publications' | 'settings'>('basics');
  const [customDomain, setCustomDomain] = useState(userData?.customDomain || '');

  useEffect(() => {
    if (userData?.customDomain) {
      setCustomDomain(userData.customDomain);
    }
  }, [userData]);

  const handleDomainUpdate = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        customDomain: customDomain
      });
      alert("Domain updated successfully!");
    } catch (err) {
      console.error("Failed to update domain:", err);
    }
  };

  const handleUpgrade = () => {
    // In a real app, this would redirect to Stripe Checkout
    alert("Redirecting to Stripe Checkout... (Demo: This would enable Pro features)");
    if (user) {
      updateDoc(doc(db, 'users', user.uid), {
        isPro: true
      });
    }
  };

  const handleChange = (key: keyof PortfolioConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  // --- Image Validation Logic ---
  useEffect(() => {
    config.projects.forEach(project => {
      if (!project.imageUrl) {
         setBrokenImages(prev => ({ ...prev, [project.id]: false }));
         return;
      }
      // Check if URL is a data URI (assume valid) or runs check
      if (project.imageUrl.startsWith('data:')) {
          setBrokenImages(prev => ({ ...prev, [project.id]: false }));
          return;
      }

      const img = new Image();
      img.onload = () => setBrokenImages(prev => ({ ...prev, [project.id]: false }));
      img.onerror = () => setBrokenImages(prev => ({ ...prev, [project.id]: true }));
      img.src = project.imageUrl;
    });
  }, [config.projects]);

  // --- AI Repair Logic ---
  const handleAutoFix = async (index: number) => {
      const project = config.projects[index];
      setIsFixing(prev => ({ ...prev, [project.id]: true }));

      try {
          const response = await fetch("/api/ai/generate-thumbnail", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: project.title, description: project.description })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Failed to generate thumbnail");

          if (data.imageUrl) {
              const compressedUrl = await compressImage(data.imageUrl);
              handleProjectChange(index, 'imageUrl', compressedUrl);
              setBrokenImages(prev => ({ ...prev, [project.id]: false }));
          }
      } catch (error: any) {
          console.error("Image generation failed:", error);
          alert(`Image generation note: ${error.message || 'Please ensure GEMINI_API_KEY is configured in your secrets.'}`);
      } finally {
          setIsFixing(prev => ({ ...prev, [project.id]: false }));
      }
  };

  // --- AI Bio Improvement Handlers ---
  const [showBioModal, setShowBioModal] = useState(false);
  const [bioGoal, setBioGoal] = useState('Concise & Direct');
  const [bioCustomNotes, setBioCustomNotes] = useState('');
  const [bioSuggestions, setBioSuggestions] = useState<string[]>([]);
  const [isBioLoading, setIsBioLoading] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);

  const handleGenerateBioSuggestions = async () => {
    setIsBioLoading(true);
    setBioError(null);
    try {
      const response = await fetch('/api/ai/improve-about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentBio: config.bio,
          name: config.name,
          title: config.title,
          researchKeywords: config.keywords || [],
          goal: `${bioGoal}${bioCustomNotes ? `. Additional Context: ${bioCustomNotes}` : ''}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate bio suggestions');
      }

      setBioSuggestions(data.suggestions || []);
    } catch (err: any) {
      console.error('Error generating bio suggestions:', err);
      setBioError(err.message || 'Error communicating with Gemini AI service');
    } finally {
      setIsBioLoading(false);
    }
  };

  const applyBioSuggestion = (suggestion: string) => {
    handleChange('bio', suggestion);
    setShowBioModal(false);
  };

  // --- AI Project Description Handlers ---
  const [activeProjectAiIdx, setActiveProjectAiIdx] = useState<number | null>(null);
  const [projectAiKeywords, setProjectAiKeywords] = useState('');
  const [projectAiRole, setProjectAiRole] = useState('');
  const [projectAiVenue, setProjectAiVenue] = useState('');
  const [projectAiNotes, setProjectAiNotes] = useState('');
  const [projectGeneratedDesc, setProjectGeneratedDesc] = useState('');
  const [projectGeneratedHighlights, setProjectGeneratedHighlights] = useState<string[]>([]);
  const [isProjectAiLoading, setIsProjectAiLoading] = useState(false);
  const [projectAiError, setProjectAiError] = useState<string | null>(null);

  const openProjectAiModal = (idx: number) => {
    const proj = config.projects[idx];
    setActiveProjectAiIdx(idx);
    setProjectAiKeywords(proj.category || (config.keywords ? config.keywords.join(', ') : ''));
    setProjectAiRole(config.title || 'Lead Researcher');
    setProjectAiVenue('Academic / Open Source');
    setProjectAiNotes('');
    setProjectGeneratedDesc('');
    setProjectGeneratedHighlights([]);
    setProjectAiError(null);
  };

  const handleGenerateProjectDesc = async () => {
    if (activeProjectAiIdx === null) return;
    const proj = config.projects[activeProjectAiIdx];

    setIsProjectAiLoading(true);
    setProjectAiError(null);
    try {
      const response = await fetch('/api/ai/generate-project-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: proj.title,
          keywords: projectAiKeywords,
          role: projectAiRole,
          targetVenue: projectAiVenue,
          briefNotes: projectAiNotes,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate project description');
      }

      setProjectGeneratedDesc(data.description || '');
      setProjectGeneratedHighlights(data.highlights || []);
    } catch (err: any) {
      console.error('Error generating project description:', err);
      setProjectAiError(err.message || 'Error communicating with Gemini AI service');
    } finally {
      setIsProjectAiLoading(false);
    }
  };

  const applyProjectDesc = () => {
    if (activeProjectAiIdx === null) return;
    let fullText = projectGeneratedDesc;
    if (projectGeneratedHighlights && projectGeneratedHighlights.length > 0) {
      fullText += '\n\nKey Highlights:\n' + projectGeneratedHighlights.map(h => `• ${h}`).join('\n');
    }
    handleProjectChange(activeProjectAiIdx, 'description', fullText);
    setActiveProjectAiIdx(null);
  };

  // --- AI Theme Customization Handlers ---
  const [themePrompt, setThemePrompt] = useState('');
  const [isThemeLoading, setIsThemeLoading] = useState(false);
  const [themeError, setThemeError] = useState<string | null>(null);

  const handleGenerateCustomTheme = async (promptOverride?: string) => {
    const p = promptOverride || themePrompt;
    if (!p.trim()) return;
    setIsThemeLoading(true);
    setThemeError(null);
    try {
      const response = await fetch('/api/ai/customize-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: p,
          userTitle: config.title,
          userKeywords: config.keywords ? config.keywords.join(', ') : '',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate theme customizer');
      }

      onChange({
        ...config,
        template: 'custom',
        customTheme: data,
      });
    } catch (err: any) {
      console.error('Error customizing theme:', err);
      setThemeError(err.message || 'Error communicating with Gemini AI theme generator');
    } finally {
      setIsThemeLoading(false);
    }
  };

  // --- Project Handlers ---
  const handleProjectChange = (index: number, field: keyof Project, value: string) => {
    const newProjects = [...config.projects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    handleChange('projects', newProjects);
  };

  const addProject = () => {
    handleChange('projects', [...config.projects, { 
      id: Date.now().toString(), 
      title: "New Project", 
      category: "Design", 
      description: "Project description goes here.",
      imageUrl: "",
      projectUrl: ""
    }]);
  };

  const removeProject = (index: number) => {
    handleChange('projects', config.projects.filter((_, i) => i !== index));
  };

  // --- Experience Handlers ---
  const handleExpChange = (index: number, field: keyof ExperienceItem, value: string) => {
    const newExp = [...config.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    handleChange('experience', newExp);
  };

  const addExp = () => {
    handleChange('experience', [...config.experience, {
      id: Date.now().toString(),
      year: "2025",
      role: "Role",
      company: "Company",
      description: "Description of responsibilities."
    }]);
  };

  const removeExp = (index: number) => {
    handleChange('experience', config.experience.filter((_, i) => i !== index));
  };

  // --- Education Handlers ---
  const handleEduChange = (index: number, field: keyof EducationItem, value: string) => {
    const newEdu = [...(config.education || [])];
    newEdu[index] = { ...newEdu[index], [field]: value };
    handleChange('education', newEdu);
  };

  const addEdu = () => {
    handleChange('education', [...(config.education || []), {
      id: Date.now().toString(),
      year: "2020 - 2024",
      degree: "Degree Name",
      school: "University Name",
      description: "Brief description of studies."
    }]);
  };

  const removeEdu = (index: number) => {
    handleChange('education', (config.education || []).filter((_, i) => i !== index));
  };

  // --- Skill Handlers ---
  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const arr = val.split(',').map(k => k.trim()).filter(k => k !== "");
      handleChange('keywords', arr);
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const arr = val.split(',').map(k => k.trim()).filter(k => k !== "");
      handleChange('skills', arr);
  };

  const [showBibtexModal, setShowBibtexModal] = useState(false);
  const [rawBibtexInput, setRawBibtexInput] = useState('');

  // --- Grant Handlers ---
  const handleGrantChange = (index: number, field: keyof GrantItem, value: string) => {
    const newGrants = [...(config.grants || [])];
    newGrants[index] = { ...newGrants[index], [field]: value };
    handleChange('grants', newGrants);
  };

  const addGrant = () => {
    handleChange('grants', [...(config.grants || []), {
      id: Date.now().toString(),
      title: "New Research Grant",
      funder: "NSF / NIH / Foundation",
      amount: "$100,000",
      role: "PI",
      period: "2025 - 2027",
      description: "Grant objective summary..."
    }]);
  };

  const removeGrant = (index: number) => {
    handleChange('grants', (config.grants || []).filter((_, i) => i !== index));
  };

  // --- Teaching Handlers ---
  const handleTeachingChange = (index: number, field: keyof TeachingItem, value: string) => {
    const newTeaching = [...(config.teaching || [])];
    newTeaching[index] = { ...newTeaching[index], [field]: value };
    handleChange('teaching', newTeaching);
  };

  const addTeaching = () => {
    handleChange('teaching', [...(config.teaching || []), {
      id: Date.now().toString(),
      code: "CS 101",
      title: "Introduction to Computer Science",
      institution: "University Name",
      role: "Instructor",
      term: "Fall 2025"
    }]);
  };

  const removeTeaching = (index: number) => {
    handleChange('teaching', (config.teaching || []).filter((_, i) => i !== index));
  };

  // --- Award Handlers ---
  const handleAwardChange = (index: number, field: keyof AwardItem, value: string) => {
    const newAwards = [...(config.awards || [])];
    newAwards[index] = { ...newAwards[index], [field]: value };
    handleChange('awards', newAwards);
  };

  const addAward = () => {
    handleChange('awards', [...(config.awards || []), {
      id: Date.now().toString(),
      title: "Best Paper Award / Fellowship",
      issuer: "IEEE / ACM / Foundation",
      year: "2025",
      description: "Recognized for outstanding contributions."
    }]);
  };

  const removeAward = (index: number) => {
    handleChange('awards', (config.awards || []).filter((_, i) => i !== index));
  };

  // --- Publication Handlers ---
  const handlePubChange = (index: number, field: keyof Publication, value: string) => {
    const newPubs = [...config.publications];
    newPubs[index] = { ...newPubs[index], [field]: value };
    handleChange('publications', newPubs);
  };

  const addPub = () => {
    handleChange('publications', [...config.publications, {
      id: Date.now().toString(),
      year: "2025",
      title: "New Publication",
      authors: "Your Name, et al.",
      journal: "Journal / Conference Name",
      doi: "",
      url: "",
      type: "journal"
    }]);
  };

  const removePub = (index: number) => {
    handleChange('publications', config.publications.filter((_, i) => i !== index));
  };

  const handleImportBibTeX = () => {
    if (!rawBibtexInput.trim()) return;
    const parsed = parseBibTeX(rawBibtexInput);
    if (parsed.length === 0) {
      alert("No valid BibTeX entries found. Please paste raw @article{...} or @inproceedings{...} text.");
      return;
    }

    const newPubs: Publication[] = parsed.map((p, i) => ({
      id: (Date.now() + i).toString(),
      title: p.title || "Untitled Paper",
      authors: p.authors || "Author",
      journal: p.journal || "Conference/Journal",
      year: p.year || "2025",
      doi: p.doi || "",
      url: p.url || "",
      pdfUrl: p.pdfUrl || "",
      codeUrl: p.codeUrl || "",
      abstract: p.abstract || "",
      bibtex: p.bibtex || "",
      type: p.type || "journal"
    }));

    handleChange('publications', [...config.publications, ...newPubs]);
    setRawBibtexInput('');
    setShowBibtexModal(false);
    alert(`Successfully imported ${newPubs.length} publication(s) from BibTeX!`);
  };

  const downloadBibTeX = () => {
    const bibStr = generateBibTeX(config.publications || []);
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(bibStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "publications.bib");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // --- Import Logic ---
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedConfig = JSON.parse(event.target?.result as string);
        // Basic validation
        if (importedConfig.name && importedConfig.template) {
           // Ensure all projects have a projectUrl
           if (importedConfig.projects) {
               importedConfig.projects = importedConfig.projects.map((p: any) => ({
                   ...p,
                   projectUrl: p.projectUrl || ""
               }));
           }
           if (importedConfig.publications) {
               importedConfig.publications = importedConfig.publications.map((p: any) => ({
                   ...p,
                   doi: p.doi || "",
                   url: p.url || ""
               }));
           }
           onChange({ ...initialConfig, ...importedConfig });
        } else {
           alert("Invalid portfolio file format.");
        }
      } catch (err) {
        alert("Failed to parse portfolio file.");
      }
    };
    reader.readAsText(file);
  };

  // Export JSON-LD / Manifest for Platform
  const downloadManifest = () => {
    const manifest = {
        ...config,
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "dateCreated": new Date().toISOString(),
        "mainEntity": {
            "@type": "Person",
            "name": config.name,
            "description": config.bio,
            "identifier": config.orcid ? {
                "@type": "PropertyValue",
                "propertyID": "ORCID",
                "value": config.orcid
            } : undefined,
            "jobTitle": config.title,
            "knowsAbout": [...(config.skills || []), ...(config.keywords || [])],
            "url": window.location.href,
            "sameAs": [config.linkedin, config.github],
            "email": config.email
        }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manifest, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "portfolio.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-[60] overflow-y-auto border-l border-stone-200 animate-slide-in-right">
      <div className="sticky top-0 bg-white/95 backdrop-blur z-10 p-4 sm:p-5 border-b border-stone-200 flex justify-between items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="font-serif text-xl sm:text-2xl text-stone-900 flex items-center gap-2 truncate">
             <Layout size={22} className="text-stone-500 shrink-0" />
             <span className="truncate">Portfolio Builder</span>
          </h2>
          
          {/* Status Indicator */}
          <div className="shrink-0 flex items-center">
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-sm animate-pulse">
                <Loader2 size={12} className="animate-spin text-amber-600 shrink-0" />
                <span>Saving...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-sm">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span>Saved</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/80 shadow-sm" title="Firestore write operation failed">
                <AlertTriangle size={12} className="text-red-600 shrink-0" />
                <span>Sync Error</span>
              </span>
            )}
          </div>
        </div>

        <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500 shrink-0">
          <X size={22} />
        </button>
      </div>

      <div className="p-6 space-y-10">

        {/* Template Selector */}
        <section className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 leading-relaxed">
                <p className="font-bold mb-1 flex items-center gap-1"><Database size={12}/> Persistence Note</p>
                Your changes are saved locally in this browser. To keep your portfolio safe for after graduation, use the <strong>Export JSON</strong> button at the bottom to save your data to your computer. You can re-import it anytime.
            </div>

            {isTooLarge && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
                    <p className="font-bold mb-1 flex items-center gap-1 text-amber-600"><AlertCircle size={14}/> Storage Warning</p>
                    Your portfolio is getting large ({(configSize / 1024).toFixed(0)}KB). Firestore has a 1MB limit. 
                    <button 
                      onClick={optimizePortfolio}
                      disabled={isOptimizing}
                      className="mt-2 w-full py-2 bg-amber-600 text-white rounded font-bold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {isOptimizing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                      Optimize Portfolio (Compress Images)
                    </button>
                </div>
            )}
             <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <Monitor size={14} /> Curated Design Presets
                </div>
                <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">7 Presets + AI Custom</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button 
                    onClick={() => handleChange('template', 'classic')}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${config.template === 'classic' ? 'border-stone-900 bg-stone-50 ring-2 ring-stone-900/10' : 'border-stone-100 hover:border-stone-300'}`}
                >
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-4 h-4 rounded-full bg-[#F9F8F4] border border-stone-400"></div>
                        <div className="w-3 h-3 rounded-full bg-stone-900"></div>
                    </div>
                    <div className="font-serif font-bold text-stone-900 text-sm">Classic</div>
                    <div className="text-[10px] text-stone-500">Academic Ivory & Serif</div>
                    {config.template === 'classic' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-stone-900"></div>}
                </button>

                <button 
                    onClick={() => handleChange('template', 'cyber')}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${config.template === 'cyber' ? 'border-cyan-500 bg-slate-900' : 'border-stone-100 hover:border-slate-700 hover:bg-slate-900 group'}`}
                >
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-4 h-4 rounded bg-slate-800 border border-cyan-500"></div>
                        <div className="w-3 h-3 rounded bg-cyan-400"></div>
                    </div>
                    <div className={`font-mono font-bold text-sm ${config.template === 'cyber' || 'group-hover:text-white' ? 'text-white' : 'text-stone-900'}`}>Cyber</div>
                    <div className="text-[10px] text-stone-500">Dark & Terminal Cyan</div>
                    {config.template === 'cyber' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-500"></div>}
                </button>

                <button 
                    onClick={() => handleChange('template', 'brutal')}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${config.template === 'brutal' ? 'border-black bg-yellow-50' : 'border-stone-100 hover:border-black'}`}
                >
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-4 h-4 border-2 border-black bg-white shadow-[1px_1px_0px_rgba(0,0,0,1)]"></div>
                        <div className="w-3 h-3 bg-black"></div>
                    </div>
                    <div className="font-sans font-black text-black uppercase tracking-tight text-sm">Brutal</div>
                    <div className="text-[10px] text-stone-500">Neo-Brutalist & Raw</div>
                    {config.template === 'brutal' && <div className="absolute top-2 right-2 w-2 h-2 bg-black"></div>}
                </button>

                <button 
                    onClick={() => handleChange('template', 'minimal')}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${config.template === 'minimal' ? 'border-zinc-800 bg-zinc-50' : 'border-stone-100 hover:border-zinc-300'}`}
                >
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-4 h-4 rounded-lg bg-[#FAFAFA] border border-zinc-300"></div>
                        <div className="w-3 h-3 rounded-lg bg-zinc-800"></div>
                    </div>
                    <div className="font-sans font-bold text-zinc-900 text-sm">Minimal</div>
                    <div className="text-[10px] text-stone-500">Nordic Slate & Geometry</div>
                    {config.template === 'minimal' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-zinc-800"></div>}
                </button>

                <button 
                    onClick={() => handleChange('template', 'emerald')}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${config.template === 'emerald' ? 'border-emerald-800 bg-emerald-50' : 'border-stone-100 hover:border-emerald-300'}`}
                >
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-4 h-4 rounded-full bg-[#F4F7F5] border border-emerald-400"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-900"></div>
                    </div>
                    <div className="font-serif font-bold text-emerald-950 text-sm">Emerald</div>
                    <div className="text-[10px] text-emerald-700">Cambridge Botanical</div>
                    {config.template === 'emerald' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-800"></div>}
                </button>

                <button 
                    onClick={() => handleChange('template', 'sunset')}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${config.template === 'sunset' ? 'border-amber-800 bg-amber-50' : 'border-stone-100 hover:border-amber-300'}`}
                >
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-4 h-4 rounded-full bg-[#FAF7F2] border border-amber-300"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-900"></div>
                    </div>
                    <div className="font-serif font-bold text-stone-900 text-sm">Sunset</div>
                    <div className="text-[10px] text-amber-800">Stanford Terracotta</div>
                    {config.template === 'sunset' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-800"></div>}
                </button>

                <button 
                    onClick={() => handleChange('template', 'slate')}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${config.template === 'slate' ? 'border-indigo-500 bg-zinc-900' : 'border-stone-100 hover:border-zinc-700 hover:bg-zinc-900 group'}`}
                >
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-4 h-4 rounded bg-[#18181B] border border-zinc-700"></div>
                        <div className="w-3 h-3 rounded bg-indigo-500"></div>
                    </div>
                    <div className={`font-sans font-bold text-sm ${config.template === 'slate' || 'group-hover:text-white' ? 'text-white' : 'text-stone-900'}`}>Slate Dark</div>
                    <div className="text-[10px] text-stone-500">Modern Swiss Dark</div>
                    {config.template === 'slate' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500"></div>}
                </button>

                {config.customTheme && (
                    <button 
                        onClick={() => handleChange('template', 'custom')}
                        className={`relative p-3 rounded-xl border-2 text-left transition-all ${config.template === 'custom' ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600/20' : 'border-purple-200 hover:border-purple-400 bg-purple-50/50'}`}
                    >
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Sparkles size={16} className="text-purple-600" />
                        </div>
                        <div className="font-bold text-purple-900 text-sm truncate">{config.customTheme.name || 'AI Custom Theme'}</div>
                        <div className="text-[10px] text-purple-700 truncate">{config.customTheme.description || 'Custom generated aesthetic'}</div>
                        {config.template === 'custom' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-600"></div>}
                    </button>
                )}
            </div>

            {/* AI Custom Design Studio Box */}
            <div className="p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-2xl text-white space-y-4 shadow-xl border border-purple-800/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-500/20 rounded-lg border border-purple-400/30 text-purple-300">
                            <Sparkles size={18} className="animate-pulse" />
                        </div>
                        <div>
                            <h4 className="font-serif font-bold text-base text-white">AI Custom Design Studio</h4>
                            <p className="text-[11px] text-purple-200/80">Describe your ideal visual vibe & Gemini will architect a custom theme.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <textarea 
                        value={themePrompt}
                        onChange={(e) => setThemePrompt(e.target.value)}
                        placeholder="e.g. Oxford history professor dark academia with deep burgundy backgrounds, warm gold accents, and elegant serif typography..."
                        rows={2}
                        className="w-full px-3 py-2 bg-black/40 border border-purple-400/30 rounded-xl text-xs text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 resize-none"
                    />

                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300/80">Inspiration Presets:</span>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { label: "🎓 Oxford Dark Academia", prompt: "Dark Oxford academic library with deep burgundy background, gold serif accents, and warm ivory cards" },
                                { label: "🌲 Pacific Northwest Forest", prompt: "Pacific Northwest nature research theme with deep evergreen tones, moss green highlights, and crisp white cards" },
                                { label: "⚡ Quantum Cyberpunk", prompt: "High contrast quantum physics laboratory theme with electric cyan glowing borders and midnight slate canvas" },
                                { label: "📜 Stanford Terracotta", prompt: "Stanford humanities research style with warm terracotta accents, sand ivory background, and formal serif typography" },
                                { label: "🏛️ Minimalist Ivy", prompt: "Ultra clean Scandinavian minimalist layout with muted sage green highlights, high contrast body text, and compact publication cards" }
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                        setThemePrompt(preset.prompt);
                                        handleGenerateCustomTheme(preset.prompt);
                                    }}
                                    disabled={isThemeLoading}
                                    className="px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] text-purple-100 font-medium transition-all text-left"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => handleGenerateCustomTheme()}
                    disabled={isThemeLoading || !themePrompt.trim()}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isThemeLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Designing Custom Theme with Gemini...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            <span>Generate Custom Portfolio Theme</span>
                        </>
                    )}
                </button>

                {themeError && (
                    <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
                        <span>{themeError}</span>
                    </div>
                )}

                {config.template === 'custom' && config.customTheme && (
                    <div className="p-3 bg-white/10 border border-purple-400/30 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-purple-200 flex items-center gap-1">
                                <CheckCircle2 size={13} className="text-purple-400" />
                                Active Custom Theme: {config.customTheme.name || 'AI Bespoke'}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleChange('template', 'classic')}
                                className="text-[10px] text-purple-300 hover:text-white underline"
                            >
                                Reset to Classic
                            </button>
                        </div>
                        <p className="text-[11px] text-purple-100/80 leading-relaxed">{config.customTheme.description}</p>
                    </div>
                )}
            </div>
        </section>

        <hr className="border-stone-100" />
        
        {/* Profile Section */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest">
                <Type size={14} /> Profile & Hero
            </div>
            <div className="space-y-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-500">Full Name</label>
                    <input 
                        type="text" 
                        value={config.name} 
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-stone-400 focus:outline-none font-serif text-lg"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-500">Professional Title</label>
                    <input 
                        type="text" 
                        value={config.title} 
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-stone-500">Short Bio (Hero)</label>
                        <button 
                            type="button"
                            onClick={() => {
                                setBioGoal("Concise & Direct");
                                setBioCustomNotes("");
                                setBioSuggestions([]);
                                setBioError(null);
                                setShowBioModal(true);
                            }}
                            className="text-[11px] flex items-center gap-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded font-bold transition-all shadow-sm"
                        >
                            <Sparkles size={12} className="text-purple-600 animate-pulse" />
                            <span>AI Improve Bio</span>
                        </button>
                    </div>
                    <textarea 
                        value={config.bio} 
                        onChange={(e) => handleChange('bio', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-sm resize-none"
                    />
                </div>
            </div>
        </section>

        <hr className="border-stone-100" />

        {/* Academic / SEO Section */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest">
                <Fingerprint size={14} /> Academic Profiles & Discovery
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 mb-2">
                These profiles populate Schema.org JSON-LD tags and render direct link badges on your public portfolio, boosting academic indexing and searchability.
            </div>
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-500 flex items-center gap-1">
                          ORCID iD <Fingerprint size={10} />
                      </label>
                      <input 
                          type="text" 
                          value={config.orcid || ''} 
                          onChange={(e) => handleChange('orcid', e.target.value)}
                          placeholder="0000-0000-0000-0000"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs font-mono"
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-500 flex items-center gap-1">
                          Google Scholar
                      </label>
                      <input 
                          type="text" 
                          value={config.googleScholar || ''} 
                          onChange={(e) => handleChange('googleScholar', e.target.value)}
                          placeholder="Scholar Profile URL"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                      />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-500 flex items-center gap-1">
                          ResearchGate
                      </label>
                      <input 
                          type="text" 
                          value={config.researchGate || ''} 
                          onChange={(e) => handleChange('researchGate', e.target.value)}
                          placeholder="ResearchGate URL"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-500 flex items-center gap-1">
                          Semantic Scholar
                      </label>
                      <input 
                          type="text" 
                          value={config.semanticScholar || ''} 
                          onChange={(e) => handleChange('semanticScholar', e.target.value)}
                          placeholder="Semantic Scholar URL"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                      />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-500">Twitter / X</label>
                      <input 
                          type="text" 
                          value={config.twitter || ''} 
                          onChange={(e) => handleChange('twitter', e.target.value)}
                          placeholder="https://x.com/username"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-500">Bluesky</label>
                      <input 
                          type="text" 
                          value={config.bsky || ''} 
                          onChange={(e) => handleChange('bsky', e.target.value)}
                          placeholder="https://bsky.app/profile/..."
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                      />
                  </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-500 flex items-center gap-1">
                        Research Keywords <Tag size={10} />
                    </label>
                    <input 
                        type="text" 
                        value={config.keywords?.join(', ')} 
                        onChange={handleKeywordsChange}
                        placeholder="HCI, Neural Networks, Human-AI Collaboration..."
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-sm"
                    />
                    <p className="text-[10px] text-stone-400">Comma separated research keywords</p>
                </div>
            </div>
        </section>

        <hr className="border-stone-100" />

        {/* About Section */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest">
                <Layout size={14} /> About Me
            </div>
             <div className="space-y-1">
                <label className="text-xs font-medium text-stone-500">Section Title</label>
                <input 
                    type="text" 
                    value={config.aboutTitle} 
                    onChange={(e) => handleChange('aboutTitle', e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-stone-400 focus:outline-none font-serif"
                />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-medium text-stone-500">About Content</label>
                <textarea 
                    value={config.about} 
                    onChange={(e) => handleChange('about', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-sm"
                />
            </div>
        </section>

        <hr className="border-stone-100" />

        {/* Skills Section */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest">
                <Zap size={14} /> Skills & Expertise
            </div>
            <div className="space-y-1">
                <input 
                    type="text" 
                    value={config.skills?.join(', ')} 
                    onChange={handleSkillsChange}
                    placeholder="React, Design Systems, Python..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-sm"
                />
                <p className="text-[10px] text-stone-400">Comma separated list of your core skills</p>
            </div>
        </section>

        <hr className="border-stone-100" />

        {/* Education Section */}
        <section className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest">
                    <BookOpen size={14} /> Education
                </div>
                <button onClick={addEdu} className="text-xs flex items-center gap-1 text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded transition-colors">
                    <Plus size={12} /> Add Education
                </button>
            </div>
            <div className="space-y-3">
                {(config.education || []).map((edu, idx) => (
                    <div key={edu.id} className="p-4 bg-stone-50 border border-stone-200 rounded-lg group hover:border-stone-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                             <div className="text-xs font-bold text-stone-400 uppercase">Education {idx + 1}</div>
                             <button onClick={() => removeEdu(idx)} className="text-stone-400 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                             </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                             <input 
                                type="text" 
                                value={edu.year} 
                                onChange={(e) => handleEduChange(idx, 'year', e.target.value)}
                                placeholder="Year"
                                className="col-span-1 px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs font-mono"
                            />
                            <input 
                                type="text" 
                                value={edu.school} 
                                onChange={(e) => handleEduChange(idx, 'school', e.target.value)}
                                placeholder="School"
                                className="col-span-3 px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs font-bold"
                            />
                        </div>
                         <input 
                            type="text" 
                            value={edu.degree} 
                            onChange={(e) => handleEduChange(idx, 'degree', e.target.value)}
                            placeholder="Degree / Certificate"
                            className="w-full px-2 py-1 mb-2 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-sm"
                        />
                        <textarea 
                            value={edu.description} 
                            onChange={(e) => handleEduChange(idx, 'description', e.target.value)}
                            placeholder="Description..."
                            rows={2}
                            className="w-full px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs resize-none"
                        />
                    </div>
                ))}
            </div>
        </section>

        <hr className="border-stone-100" />

        {/* Projects Section */}
        <section className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest">
                    <Layers size={14} /> Projects
                </div>
                <button onClick={addProject} className="text-xs flex items-center gap-1 text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded transition-colors">
                    <Plus size={12} /> Add Project
                </button>
            </div>
            
            <div className="space-y-4">
                {config.projects.map((project, idx) => (
                    <div key={project.id} className="p-4 bg-stone-50 border border-stone-200 rounded-lg group hover:border-stone-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                             <div className="text-xs font-bold text-stone-400 uppercase">Project {idx + 1}</div>
                             <button onClick={() => removeProject(idx)} className="text-stone-400 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                             </button>
                        </div>
                        <div className="space-y-2">
                            <input 
                                type="text" 
                                value={project.title} 
                                onChange={(e) => handleProjectChange(idx, 'title', e.target.value)}
                                placeholder="Project Title"
                                className="w-full px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-sm font-medium"
                            />
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={project.category} 
                                    onChange={(e) => handleProjectChange(idx, 'category', e.target.value)}
                                    placeholder="Category"
                                    className="w-1/2 px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-medium text-stone-500">Description</label>
                                    <button 
                                        type="button"
                                        onClick={() => openProjectAiModal(idx)}
                                        className="text-[10px] flex items-center gap-1 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded font-bold transition-all"
                                    >
                                        <Sparkles size={11} className="text-purple-600" />
                                        <span>Auto-Generate with AI</span>
                                    </button>
                                </div>
                                <textarea 
                                    value={project.description} 
                                    onChange={(e) => handleProjectChange(idx, 'description', e.target.value)}
                                    placeholder="Short description..."
                                    rows={2}
                                    className="w-full px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs resize-none"
                                />
                            </div>
                            
                            <div className="flex flex-col gap-2 pt-1">
                                <div className="flex items-center gap-2">
                                    <ImageIcon size={14} className={brokenImages[project.id] ? "text-red-500" : "text-stone-400"} />
                                    <div className="flex-1 flex gap-1">
                                        <input 
                                            type="text" 
                                            value={project.imageUrl || ''} 
                                            onChange={(e) => handleProjectChange(idx, 'imageUrl', e.target.value)}
                                            placeholder="Image URL (optional)"
                                            className={`flex-1 px-2 py-1 bg-white border rounded focus:outline-none text-xs ${brokenImages[project.id] ? 'border-red-300 text-red-600' : 'border-stone-200 focus:border-stone-400'}`}
                                        />
                                        {(brokenImages[project.id] || !project.imageUrl) && (
                                            <button 
                                                onClick={() => handleAutoFix(idx)}
                                                disabled={isFixing[project.id]}
                                                title="AI Generate Image"
                                                className={`p-1.5 rounded transition-colors disabled:opacity-50 flex items-center justify-center ${brokenImages[project.id] ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
                                            >
                                                {isFixing[project.id] ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {project.imageUrl && brokenImages[project.id] && (
                                    <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold px-1">
                                        <AlertCircle size={10} />
                                        <span>Broken link detected. Click the AI button to regenerate.</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <LinkIcon size={14} className="text-stone-400" />
                                <input 
                                    type="text" 
                                    value={project.projectUrl || ''} 
                                    onChange={(e) => handleProjectChange(idx, 'projectUrl', e.target.value)}
                                    placeholder="Project URL (optional)"
                                    className="flex-1 px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <Monitor size={14} className="text-stone-400" />
                                <input 
                                    type="text" 
                                    value={project.embedUrl || ''} 
                                    onChange={(e) => handleProjectChange(idx, 'embedUrl', e.target.value)}
                                    placeholder="Observable / App Embed URL (optional)"
                                    className="flex-1 px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        <hr className="border-stone-100" />

        {/* Experience Section */}
        <section className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest">
                    <Briefcase size={14} /> Experience
                </div>
                <button onClick={addExp} className="text-xs flex items-center gap-1 text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded transition-colors">
                    <Plus size={12} /> Add Role
                </button>
            </div>
            <div className="space-y-3">
                {config.experience.map((exp, idx) => (
                    <div key={exp.id} className="p-4 bg-stone-50 border border-stone-200 rounded-lg group hover:border-stone-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                             <div className="text-xs font-bold text-stone-400 uppercase">Role {idx + 1}</div>
                             <button onClick={() => removeExp(idx)} className="text-stone-400 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                             </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                             <input 
                                type="text" 
                                value={exp.year} 
                                onChange={(e) => handleExpChange(idx, 'year', e.target.value)}
                                placeholder="Year"
                                className="col-span-1 px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs font-mono"
                            />
                            <input 
                                type="text" 
                                value={exp.company} 
                                onChange={(e) => handleExpChange(idx, 'company', e.target.value)}
                                placeholder="Company"
                                className="col-span-3 px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs font-bold"
                            />
                        </div>
                         <input 
                            type="text" 
                            value={exp.role} 
                            onChange={(e) => handleExpChange(idx, 'role', e.target.value)}
                            placeholder="Role Title"
                            className="w-full px-2 py-1 mb-2 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-sm"
                        />
                        <textarea 
                            value={exp.description} 
                            onChange={(e) => handleExpChange(idx, 'description', e.target.value)}
                            placeholder="Description..."
                            rows={2}
                            className="w-full px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs resize-none"
                        />
                    </div>
                ))}
            </div>
        </section>
        
        <hr className="border-stone-100" />

        {/* Publications Section */}
        <section className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest">
                    <BookOpen size={14} /> Publications
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowBibtexModal(true)} className="text-xs flex items-center gap-1 text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded transition-colors font-semibold">
                        <FileCode size={12} /> Import BibTeX
                    </button>
                    <button onClick={addPub} className="text-xs flex items-center gap-1 text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded transition-colors font-semibold">
                        <Plus size={12} /> Add Paper
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {(config.publications || []).map((pub, idx) => (
                    <div key={pub.id} className="p-4 bg-stone-50 border border-stone-200 rounded-lg group hover:border-stone-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-stone-400 uppercase">Paper {idx + 1}</span>
                                <select 
                                  value={pub.type || 'journal'} 
                                  onChange={(e) => handlePubChange(idx, 'type', e.target.value as any)}
                                  className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-white border border-stone-200 rounded text-stone-600"
                                >
                                  <option value="journal">Journal</option>
                                  <option value="conference">Conference</option>
                                  <option value="preprint">Preprint</option>
                                  <option value="workshop">Workshop</option>
                                  <option value="book">Book Chapter</option>
                                  <option value="patent">Patent</option>
                                </select>
                             </div>
                             <button onClick={() => removePub(idx)} className="text-stone-400 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                             </button>
                        </div>
                        <div className="space-y-2">
                             <input 
                                type="text" 
                                value={pub.title} 
                                onChange={(e) => handlePubChange(idx, 'title', e.target.value)}
                                placeholder="Publication Title"
                                className="w-full px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-sm font-medium"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input 
                                    type="text" 
                                    value={pub.year} 
                                    onChange={(e) => handlePubChange(idx, 'year', e.target.value)}
                                    placeholder="Year"
                                    className="px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs font-mono"
                                />
                                <input 
                                    type="text" 
                                    value={pub.journal} 
                                    onChange={(e) => handlePubChange(idx, 'journal', e.target.value)}
                                    placeholder="Journal / Conference Venue"
                                    className="px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                                <span className="text-xs font-bold text-stone-400 w-12">Authors</span>
                                <input 
                                    type="text" 
                                    value={pub.authors} 
                                    onChange={(e) => handlePubChange(idx, 'authors', e.target.value)}
                                    placeholder="Author1, Author2, Author3..."
                                    className="flex-1 px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <input 
                                    type="text" 
                                    value={pub.doi || ''} 
                                    onChange={(e) => handlePubChange(idx, 'doi', e.target.value)}
                                    placeholder="DOI (10.xxxx/xxxxx)"
                                    className="px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs font-mono"
                                />
                                <input 
                                    type="text" 
                                    value={pub.url || ''} 
                                    onChange={(e) => handlePubChange(idx, 'url', e.target.value)}
                                    placeholder="Web URL"
                                    className="px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <input 
                                    type="text" 
                                    value={pub.pdfUrl || ''} 
                                    onChange={(e) => handlePubChange(idx, 'pdfUrl', e.target.value)}
                                    placeholder="Open Access PDF URL"
                                    className="px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                                />
                                <input 
                                    type="text" 
                                    value={pub.codeUrl || ''} 
                                    onChange={(e) => handlePubChange(idx, 'codeUrl', e.target.value)}
                                    placeholder="Code Repository URL"
                                    className="px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                                />
                            </div>
                            <textarea
                                value={pub.abstract || ''}
                                onChange={(e) => handlePubChange(idx, 'abstract', e.target.value)}
                                placeholder="Abstract / Executive Summary..."
                                rows={2}
                                className="w-full px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs resize-none"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>

        <hr className="border-stone-100" />

        {/* Grants & Research Funding Section */}
        <section className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest">
                    <DollarSign size={14} /> Research Grants & Funding
                </div>
                <button onClick={addGrant} className="text-xs flex items-center gap-1 text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded transition-colors font-semibold">
                    <Plus size={12} /> Add Grant
                </button>
            </div>
            <div className="space-y-3">
                {(config.grants || []).map((grant, idx) => (
                    <div key={grant.id} className="p-4 bg-stone-50 border border-stone-200 rounded-lg group hover:border-stone-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                             <div className="text-xs font-bold text-stone-400 uppercase">Grant {idx + 1}</div>
                             <button onClick={() => removeGrant(idx)} className="text-stone-400 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                             </button>
                        </div>
                        <div className="space-y-2">
                             <input 
                                type="text" 
                                value={grant.title} 
                                onChange={(e) => handleGrantChange(idx, 'title', e.target.value)}
                                placeholder="Grant Title"
                                className="w-full px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-sm font-medium"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input 
                                    type="text" 
                                    value={grant.funder} 
                                    onChange={(e) => handleGrantChange(idx, 'funder', e.target.value)}
                                    placeholder="Funding Agency (NSF, NIH...)"
                                    className="px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                                />
                                <input 
                                    type="text" 
                                    value={grant.amount || ''} 
                                    onChange={(e) => handleGrantChange(idx, 'amount', e.target.value)}
                                    placeholder="Award Amount ($500,000)"
                                    className="px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs font-mono"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input 
                                    type="text" 
                                    value={grant.role || ''} 
                                    onChange={(e) => handleGrantChange(idx, 'role', e.target.value)}
                                    placeholder="Role (PI, Co-PI)"
                                    className="px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                                />
                                <input 
                                    type="text" 
                                    value={grant.period} 
                                    onChange={(e) => handleGrantChange(idx, 'period', e.target.value)}
                                    placeholder="Period (2024 - 2027)"
                                    className="px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs font-mono"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        <hr className="border-stone-100" />

        {/* Teaching Section */}
        <section className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest">
                    <GraduationCap size={14} /> Teaching & Mentorship
                </div>
                <button onClick={addTeaching} className="text-xs flex items-center gap-1 text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded transition-colors font-semibold">
                    <Plus size={12} /> Add Course
                </button>
            </div>
            <div className="space-y-3">
                {(config.teaching || []).map((course, idx) => (
                    <div key={course.id} className="p-4 bg-stone-50 border border-stone-200 rounded-lg group hover:border-stone-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                             <div className="text-xs font-bold text-stone-400 uppercase">Course {idx + 1}</div>
                             <button onClick={() => removeTeaching(idx)} className="text-stone-400 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                             </button>
                        </div>
                        <div className="space-y-2">
                            <div className="grid grid-cols-4 gap-2">
                                <input 
                                    type="text" 
                                    value={course.code} 
                                    onChange={(e) => handleTeachingChange(idx, 'code', e.target.value)}
                                    placeholder="CS 224N"
                                    className="col-span-1 px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs font-mono font-bold"
                                />
                                <input 
                                    type="text" 
                                    value={course.title} 
                                    onChange={(e) => handleTeachingChange(idx, 'title', e.target.value)}
                                    placeholder="Course Title"
                                    className="col-span-3 px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <input 
                                    type="text" 
                                    value={course.institution} 
                                    onChange={(e) => handleTeachingChange(idx, 'institution', e.target.value)}
                                    placeholder="Institution"
                                    className="col-span-1 px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                                />
                                <input 
                                    type="text" 
                                    value={course.role} 
                                    onChange={(e) => handleTeachingChange(idx, 'role', e.target.value)}
                                    placeholder="Role (Instructor / TA)"
                                    className="col-span-1 px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                                />
                                <input 
                                    type="text" 
                                    value={course.term} 
                                    onChange={(e) => handleTeachingChange(idx, 'term', e.target.value)}
                                    placeholder="Term (Fall 2024)"
                                    className="col-span-1 px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs font-mono"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        <hr className="border-stone-100" />

        {/* Awards Section */}
        <section className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest">
                    <Award size={14} /> Honors & Awards
                </div>
                <button onClick={addAward} className="text-xs flex items-center gap-1 text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded transition-colors font-semibold">
                    <Plus size={12} /> Add Award
                </button>
            </div>
            <div className="space-y-3">
                {(config.awards || []).map((award, idx) => (
                    <div key={award.id} className="p-4 bg-stone-50 border border-stone-200 rounded-lg group hover:border-stone-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                             <div className="text-xs font-bold text-stone-400 uppercase">Award {idx + 1}</div>
                             <button onClick={() => removeAward(idx)} className="text-stone-400 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                             </button>
                        </div>
                        <div className="space-y-2">
                            <input 
                                type="text" 
                                value={award.title} 
                                onChange={(e) => handleAwardChange(idx, 'title', e.target.value)}
                                placeholder="Award Title"
                                className="w-full px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs font-medium"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input 
                                    type="text" 
                                    value={award.issuer} 
                                    onChange={(e) => handleAwardChange(idx, 'issuer', e.target.value)}
                                    placeholder="Awarding Body (ACM, IEEE...)"
                                    className="px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs"
                                />
                                <input 
                                    type="text" 
                                    value={award.year} 
                                    onChange={(e) => handleAwardChange(idx, 'year', e.target.value)}
                                    placeholder="Year (2024)"
                                    className="px-2 py-1 bg-white border border-stone-200 rounded focus:border-stone-400 focus:outline-none text-xs font-mono"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        <hr className="border-stone-100" />

        {/* Settings / Monetization Section */}
        <section className="space-y-6 pb-10">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest">
                <Settings size={14} /> Account & Monetization
            </div>
            
            <div className={`p-5 rounded-xl border-2 transition-all ${userData?.isPro ? 'border-amber-200 bg-amber-50/30' : 'border-stone-100 bg-stone-50/30'}`}>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={18} className={userData?.isPro ? 'text-amber-500' : 'text-stone-400'} />
                            <h4 className="font-bold text-stone-900 text-sm">
                                {userData?.isPro ? 'Pro Plan Active' : 'Free Student Plan'}
                            </h4>
                        </div>
                        {userData?.isPro && <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded uppercase">Active</span>}
                    </div>
                    
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                        {userData?.isPro 
                            ? "You have full access to all features, including custom domains and advanced AI generation."
                            : "Upgrade to Pro to add a custom domain, remove branding, and get unlimited AI credits."}
                    </p>

                    {!userData?.isPro && (
                        <button 
                            onClick={handleUpgrade}
                            className="w-full py-2.5 bg-stone-900 text-white rounded-lg font-bold text-xs hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-200"
                        >
                            <CreditCard size={14} />
                            Upgrade for $5/mo
                        </button>
                    )}
                </div>
            </div>

            <div className={`space-y-4 ${!userData?.isPro ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <div className="flex items-center gap-2 text-xs font-bold text-stone-900 uppercase">
                    <Globe size={14} className="text-stone-400" /> Custom Domain
                </div>
                
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase">Domain Name</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={customDomain}
                                onChange={(e) => setCustomDomain(e.target.value)}
                                placeholder="e.g. portfolio.yourname.com"
                                className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-stone-900 focus:outline-none text-sm"
                            />
                            <button 
                                onClick={handleDomainUpdate}
                                className="px-4 py-2 bg-stone-900 text-white rounded text-xs font-bold hover:bg-stone-800 transition-all"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-3 bg-stone-50 rounded border border-stone-100">
                        <h5 className="text-[9px] font-bold text-stone-900 uppercase mb-1">DNS Configuration</h5>
                        <p className="text-[9px] text-stone-500 leading-relaxed">
                            Add a CNAME record in your DNS settings:<br/>
                            <span className="font-mono text-stone-900 font-bold">Type: CNAME | Host: @ | Value: ais-dev-euyhlomyke7e6itiplgfde-142345459943.us-east1.run.app</span>
                        </p>
                    </div>
                </div>
                {!userData?.isPro && (
                    <div className="p-2 bg-amber-50 border border-amber-100 rounded flex items-center gap-2">
                        <AlertCircle size={12} className="text-amber-500 shrink-0" />
                        <p className="text-[9px] text-amber-800 font-medium">
                            Custom domains are a Pro feature.
                        </p>
                    </div>
                )}
            </div>
        </section>

      </div>

      {/* BibTeX Import Modal */}
      {showBibtexModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-base">
                <FileCode size={18} className="text-blue-600" />
                <span>Import BibTeX Publications</span>
              </div>
              <button onClick={() => setShowBibtexModal(false)} className="text-stone-400 hover:text-stone-700 p-1">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Paste raw BibTeX text from Google Scholar, ACM Digital Library, IEEE Xplore, or arXiv. We will parse titles, authors, venues, years, DOIs, and abstracts automatically.
            </p>
            <textarea
              value={rawBibtexInput}
              onChange={(e) => setRawBibtexInput(e.target.value)}
              placeholder={`@article{morgan2024neural,\n  title = {Neural Interface Design},\n  author = {Morgan, Alex and Chen, Lin},\n  journal = {Journal of HCI},\n  year = {2024}\n}`}
              rows={8}
              className="w-full p-3 font-mono text-xs bg-stone-900 text-emerald-400 rounded-lg focus:outline-none border border-stone-800"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowBibtexModal(false)} className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded font-medium">
                Cancel
              </button>
              <button onClick={handleImportBibTeX} className="px-5 py-2 text-xs bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors shadow-md">
                Parse & Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Bio Modal */}
      {showBioModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-purple-600 animate-pulse" size={20} />
                <h3 className="font-serif text-xl font-bold text-stone-900">AI Bio & About Assistant</h3>
              </div>
              <button onClick={() => setShowBioModal(false)} className="text-stone-400 hover:text-stone-600 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
                  Select Desired Tone / Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "Concise & Direct",
                    "Academic & Visionary",
                    "Technical & Methodology-Focused"
                  ].map((goalOption) => (
                    <button
                      key={goalOption}
                      type="button"
                      onClick={() => setBioGoal(goalOption)}
                      className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all text-left ${
                        bioGoal === goalOption
                          ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {goalOption}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Additional Keywords or Context (Optional)
                </label>
                <input
                  type="text"
                  value={bioCustomNotes}
                  onChange={(e) => setBioCustomNotes(e.target.value)}
                  placeholder="e.g. Focus on climate modeling, recent NSF grant, open for collaborations..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-stone-400"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateBioSuggestions}
                disabled={isBioLoading}
                className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs rounded-lg transition-all shadow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isBioLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Crafting Bio Suggestions with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Bio Options</span>
                  </>
                )}
              </button>

              {bioError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
                  <span>{bioError}</span>
                </div>
              )}

              {bioSuggestions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Generated Bio Options
                  </div>
                  {bioSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-stone-50 border border-stone-200 rounded-xl hover:border-purple-300 transition-all space-y-3 group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          Option {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => applyBioSuggestion(suggestion)}
                          className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Check size={12} />
                          <span>Apply To Bio</span>
                        </button>
                      </div>
                      <p className="text-xs text-stone-800 leading-relaxed font-sans">{suggestion}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Project Description Modal */}
      {activeProjectAiIdx !== null && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-purple-600 animate-pulse" size={20} />
                <h3 className="font-serif text-xl font-bold text-stone-900">Project AI Description Generator</h3>
              </div>
              <button onClick={() => setActiveProjectAiIdx(null)} className="text-stone-400 hover:text-stone-600 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                <div className="text-[10px] font-bold uppercase text-stone-400">Project Title</div>
                <div className="text-sm font-bold text-stone-900">{config.projects[activeProjectAiIdx]?.title || "Project"}</div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Keywords & Concepts
                  </label>
                  <input
                    type="text"
                    value={projectAiKeywords}
                    onChange={(e) => setProjectAiKeywords(e.target.value)}
                    placeholder="e.g. Distributed Consensus, Raft, Go, Fault Tolerance"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Role</label>
                    <input
                      type="text"
                      value={projectAiRole}
                      onChange={(e) => setProjectAiRole(e.target.value)}
                      placeholder="e.g. Lead Researcher / Engineer"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-stone-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Venue / Context</label>
                    <input
                      type="text"
                      value={projectAiVenue}
                      onChange={(e) => setProjectAiVenue(e.target.value)}
                      placeholder="e.g. NeurIPS 2025 / Open Source"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Additional Notes / Metrics (Optional)</label>
                  <input
                    type="text"
                    value={projectAiNotes}
                    onChange={(e) => setProjectAiNotes(e.target.value)}
                    placeholder="e.g. Reduced latency by 45%, 10k downloads on GitHub"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateProjectDesc}
                disabled={isProjectAiLoading}
                className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs rounded-lg transition-all shadow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProjectAiLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generating Description with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Project Description</span>
                  </>
                )}
              </button>

              {projectAiError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
                  <span>{projectAiError}</span>
                </div>
              )}

              {projectGeneratedDesc && (
                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                      Generated Description
                    </span>
                    <button
                      type="button"
                      onClick={applyProjectDesc}
                      className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Check size={12} />
                      <span>Apply To Project</span>
                    </button>
                  </div>

                  <p className="text-xs text-stone-800 leading-relaxed">{projectGeneratedDesc}</p>

                  {projectGeneratedHighlights.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-purple-200/60">
                      <div className="text-[10px] font-bold uppercase text-purple-700">Key Highlights</div>
                      <ul className="space-y-1">
                        {projectGeneratedHighlights.map((hl, i) => (
                          <li key={i} className="text-xs text-stone-700 flex items-start gap-1.5">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>{hl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="sticky bottom-0 bg-stone-50 p-4 border-t border-stone-200 flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
            <label className="cursor-pointer px-2.5 py-1.5 text-stone-600 text-xs font-medium hover:text-stone-900 flex items-center gap-1.5 bg-white border border-stone-200 rounded shadow-sm transition-all">
                <FileText size={13} /> Import JSON
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={downloadBibTeX} className="px-2.5 py-1.5 text-blue-700 bg-blue-50 border border-blue-200 rounded text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-1">
                <FileCode size={13} /> Export .bib
            </button>
            <button onClick={downloadManifest} className="px-2.5 py-1.5 text-stone-600 text-xs font-medium hover:text-stone-900 flex items-center gap-1.5">
                <Save size={13} /> Export JSON
            </button>
            <button onClick={onClose} className="px-5 py-1.5 bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-lg text-xs font-bold">
               Done
            </button>
        </div>
      </div>
    </div>
  );
};

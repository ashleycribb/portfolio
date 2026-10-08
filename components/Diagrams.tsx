
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ArrowUpRight, FolderOpen, Briefcase, ExternalLink, Code, Square, ChevronUp, ChevronDown, Trash2, PenTool, Plus } from 'lucide-react';
import { Project, ExperienceItem, TemplateType } from './Editor';

// --- EDITABLE WRAPPER ---
interface EditableItemWrapperProps {
    isEditing: boolean;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onDelete: () => void;
    onEdit?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
    children: React.ReactNode;
}

export const EditableItemWrapper: React.FC<EditableItemWrapperProps> = ({
    isEditing,
    onMoveUp,
    onMoveDown,
    onDelete,
    onEdit,
    canMoveUp = true,
    canMoveDown = true,
    children
}) => {
    if (!isEditing) return <>{children}</>;

    return (
        <div className="relative group/editable border border-dashed border-stone-300 hover:border-stone-500 p-2 rounded-lg transition-all">
            {/* Hover Toolbar */}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/95 border border-stone-200 shadow-md rounded-md p-1 opacity-0 group-hover/editable:opacity-100 transition-opacity z-20 pointer-events-auto">
                {onMoveUp && (
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMoveUp(); }}
                        disabled={!canMoveUp}
                        className="p-1 hover:bg-stone-100 rounded text-stone-600 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                    >
                        <ChevronUp size={14} />
                    </button>
                )}
                {onMoveDown && (
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMoveDown(); }}
                        disabled={!canMoveDown}
                        className="p-1 hover:bg-stone-100 rounded text-stone-600 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                    >
                        <ChevronDown size={14} />
                    </button>
                )}
                {onEdit && (
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
                        className="p-1 hover:bg-stone-100 rounded text-blue-600 cursor-pointer"
                        title="Edit Details"
                    >
                        <PenTool size={14} />
                    </button>
                )}
                <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (confirm("Are you sure you want to delete this item?")) onDelete(); }}
                    className="p-1 hover:bg-red-50 rounded text-red-600 cursor-pointer"
                    title="Delete"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            {children}
        </div>
    );
};

// --- PROJECT GRID MODULE ---
interface ProjectGridProps {
  projects: Project[];
  template?: TemplateType;
  isEditing?: boolean;
  onChange?: (projects: Project[]) => void;
}

export const ProjectGrid: React.FC<ProjectGridProps> = ({ projects, template = 'classic', isEditing = false, onChange }) => {
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const isCyber = template === 'cyber';
  const isBrutal = template === 'brutal';

  const handleProjectChange = (idx: number, field: keyof Project, val: string) => {
    if (!onChange) return;
    const list = [...projects];
    list[idx] = { ...list[idx], [field]: val };
    onChange(list);
  };

  const addProject = () => {
    if (!onChange) return;
    onChange([...projects, {
      id: Date.now().toString(),
      title: "New Project",
      category: "Design/Research",
      description: "Project description goes here.",
      imageUrl: "",
      projectUrl: ""
    }]);
  };

  return (
    <div className="w-full space-y-8">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {projects.map((project, index) => {
          if (isEditing && editingProjectId === project.id) {
            let formClasses = "p-6 rounded-lg border-2 border-dashed border-blue-500 bg-blue-50/10 space-y-4 ";
            if (isCyber) formClasses += "bg-slate-900 border-cyan-500 text-slate-300";
            else if (isBrutal) formClasses += "bg-white border-black text-black shadow-[4px_4px_0px_rgba(0,0,0,1)]";
            else formClasses += "bg-white border-stone-300";

            return (
                <div key={project.id} className={formClasses}>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Project Title</label>
                        <input 
                            type="text" 
                            value={project.title} 
                            onChange={(e) => handleProjectChange(index, 'title', e.target.value)} 
                            className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Category</label>
                            <input 
                                type="text" 
                                value={project.category} 
                                onChange={(e) => handleProjectChange(index, 'category', e.target.value)} 
                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Image URL</label>
                            <input 
                                type="text" 
                                value={project.imageUrl || ''} 
                                onChange={(e) => handleProjectChange(index, 'imageUrl', e.target.value)} 
                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Project URL</label>
                            <input 
                                type="text" 
                                value={project.projectUrl} 
                                onChange={(e) => handleProjectChange(index, 'projectUrl', e.target.value)} 
                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Embed URL (Optional)</label>
                            <input 
                                type="text" 
                                value={project.embedUrl || ''} 
                                onChange={(e) => handleProjectChange(index, 'embedUrl', e.target.value)} 
                                className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Description</label>
                        <textarea 
                            value={project.description} 
                            onChange={(e) => handleProjectChange(index, 'description', e.target.value)} 
                            className="w-full p-2 text-xs bg-white border border-stone-200 rounded h-16 resize-none text-black font-sans focus:outline-none focus:border-stone-400" 
                        />
                    </div>
                    <div className="flex justify-end">
                        <button 
                            onClick={() => setEditingProjectId(null)}
                            className="px-4 py-1.5 bg-stone-900 text-white rounded text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                            Done
                        </button>
                    </div>
                </div>
            );
          }

          const isEmbed = !!project.embedUrl;

          // --- STYLES ---
          let cardClasses = isEmbed ? "w-full md:w-3/5 relative overflow-hidden transition-all duration-500 min-h-[400px] md:min-h-0 " : "w-full aspect-[4/3] relative overflow-hidden transition-all duration-500 ";
          let titleClasses = "text-2xl transition-colors ";
          let textClasses = "leading-relaxed text-sm md:text-base ";
          let categoryClasses = "text-xs font-bold tracking-widest uppercase ";
          let hoverIconBg = "bg-white text-stone-900";
          
          // Base wrapping classes
          let wrapperClasses = isEmbed 
              ? "group flex flex-col md:flex-row md:col-span-2 " 
              : "group flex flex-col gap-1 cursor-pointer ";

          if (isCyber) {
              if (isEmbed) wrapperClasses += " bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg ";
              cardClasses += "bg-slate-900 border border-slate-700 rounded-lg group-hover:border-cyan-500 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]";
              titleClasses += "font-mono text-slate-100 group-hover:text-cyan-400";
              textClasses += "text-slate-400 font-mono";
              categoryClasses += "text-cyan-600";
              hoverIconBg = "bg-cyan-500 text-black";
          } else if (isBrutal) {
              if (isEmbed) wrapperClasses += " bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] ";
              cardClasses += "bg-white border-4 border-black group-hover:translate-x-[-4px] group-hover:translate-y-[-4px] group-hover:shadow-[8px_8px_0px_rgba(0,0,0,1)]";
              titleClasses += "font-sans font-black text-black uppercase";
              textClasses += "text-black font-medium border-l-2 border-black pl-4";
              categoryClasses += "bg-black text-white px-2 py-1";
              hoverIconBg = "bg-black text-white";
          } else {
              // Classic / Others
              if (isEmbed) wrapperClasses += " bg-stone-50 border border-stone-200 rounded-xl overflow-hidden shadow-sm ";
              cardClasses += "bg-stone-100 rounded-lg border border-stone-200 group-hover:shadow-lg";
              titleClasses += "font-serif text-stone-900 group-hover:text-nobel-gold";
              textClasses += "text-stone-600";
              categoryClasses += "text-stone-400";
          }

          // If it's an embed, we strip some hover effects from the card container because it needs to be interactive
          if (isEmbed) {
              cardClasses = cardClasses.replace("group-hover:shadow-lg", "").replace("group-hover:translate-x-[-4px]", "");
              if (!isCyber && !isBrutal) {
                  cardClasses = cardClasses.replace("border-stone-200 rounded-lg", "border-b md:border-b-0 md:border-r border-stone-200");
              }
          }

          const content = (
              <>
                  {/* Project Media / Embed */}
                  <div className={cardClasses}>
                      {isEmbed ? (
                          <div className="w-full h-full relative z-10 pointer-events-auto">
                              <iframe 
                                  src={project.embedUrl} 
                                  className="w-full h-full absolute inset-0 border-0"
                                  title={`${project.title} Interactive Embed`}
                                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                              />
                          </div>
                      ) : project.imageUrl ? (
                          <img 
                              src={project.imageUrl} 
                              alt={project.title}
                              className={`w-full h-full object-cover transition-transform duration-700 ${isBrutal ? 'grayscale group-hover:grayscale-0' : 'group-hover:scale-105'}`}
                          />
                      ) : (
                          <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-700 group-hover:scale-105 ${isCyber ? 'bg-slate-800 text-slate-600' : (isBrutal ? 'bg-yellow-50 text-black' : 'bg-stone-200 text-stone-300')}`}>
                               {isCyber ? <Code size={48} /> : (isBrutal ? <Square size={48} fill="black" /> : <FolderOpen size={48} strokeWidth={1} />)}
                          </div>
                      )}
                      
                      {!isEmbed && (
                          <>
                              {/* Overlay on hover */}
                              <div className={`absolute inset-0 transition-colors duration-300 pointer-events-none ${isCyber ? 'bg-cyan-900/0 group-hover:bg-cyan-900/20' : (isBrutal ? 'bg-transparent' : 'bg-stone-900/0 group-hover:bg-stone-900/10')}`}></div>
                              
                              <div className={`absolute top-4 right-4 rounded-full p-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-sm pointer-events-none ${hoverIconBg}`}>
                                  <ArrowUpRight size={20} />
                              </div>

                              {/* Tooltip for URL */}
                              {project.projectUrl && (
                                  <div className={`absolute bottom-3 left-3 right-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex justify-center pointer-events-none z-10`}>
                                       <div className={`flex items-center gap-2 px-3 py-1.5 shadow-lg max-w-full ${
                                          isCyber ? 'bg-slate-900/95 border border-cyan-500/50 text-cyan-300 rounded-md backdrop-blur-md' : 
                                          (isBrutal ? 'bg-white text-black border-2 border-black font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'bg-white/95 text-stone-600 backdrop-blur-md border border-stone-200 rounded-full')
                                       }`}>
                                          <ExternalLink size={12} className="flex-shrink-0" />
                                          <span className="text-xs truncate font-medium">{project.projectUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                                       </div>
                                  </div>
                              )}
                          </>
                      )}
                  </div>

                  {/* Content */}
                  <div className={isEmbed ? "flex flex-col gap-4 p-6 md:p-8 md:w-2/5 justify-center" : "flex flex-col gap-2 pt-4"}>
                      <div className={isEmbed ? "flex flex-col gap-2" : "flex justify-between items-baseline"}>
                          <h3 className={titleClasses}>{project.title}</h3>
                          <span className={categoryClasses}>{project.category}</span>
                      </div>
                      {!isBrutal && <div className={`h-px w-full ${isEmbed ? 'my-2' : 'my-2'} transition-colors ${isCyber ? 'bg-slate-800 group-hover:bg-cyan-900' : 'bg-stone-200 group-hover:bg-stone-300'}`}></div>}
                      <p className={textClasses}>{project.description}</p>
                      
                      {isEmbed && project.projectUrl && (
                          <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className={`mt-4 inline-flex items-center gap-2 text-sm font-bold w-max transition-colors ${isCyber ? 'text-cyan-400 hover:text-cyan-300' : 'text-stone-900 hover:text-stone-600'}`}>
                              View Full Project <ExternalLink size={16} />
                          </a>
                      )}
                  </div>
              </>
          );

          const commonProps: any = {
              initial: { opacity: 0, y: 20 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true },
              transition: { delay: index * 0.1, duration: 0.6 },
              className: wrapperClasses
          };

          const cardJSX = (!isEditing && project.projectUrl) ? (
              <motion.a 
                  key={project.id}
                  {...commonProps}
                  href={project.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
              >
                  {content}
              </motion.a>
          ) : (
              <motion.div key={project.id} {...commonProps}>
                  {content}
              </motion.div>
          );

          return (
              <EditableItemWrapper
                  key={project.id}
                  isEditing={isEditing}
                  onMoveUp={() => {
                      if (index > 0 && onChange) {
                          const list = [...projects];
                          const temp = list[index];
                          list[index] = list[index - 1];
                          list[index - 1] = temp;
                          onChange(list);
                      }
                  }}
                  onMoveDown={() => {
                      if (index < projects.length - 1 && onChange) {
                          const list = [...projects];
                          const temp = list[index];
                          list[index] = list[index + 1];
                          list[index + 1] = temp;
                          onChange(list);
                      }
                  }}
                  onDelete={() => {
                      if (onChange) {
                          const list = projects.filter((_, i) => i !== index);
                          onChange(list);
                      }
                  }}
                  onEdit={() => setEditingProjectId(project.id)}
                  canMoveUp={index > 0}
                  canMoveDown={index < projects.length - 1}
              >
                  {cardJSX}
              </EditableItemWrapper>
          );
        })}
      </div>

      {isEditing && (
        <div className="flex justify-center mt-4">
          <button 
            onClick={addProject}
            className={`px-5 py-2 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                template === 'cyber' ? 'border border-cyan-800 text-cyan-400 bg-slate-900 hover:bg-cyan-900/30' :
                (template === 'brutal' ? 'border-2 border-black bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-stone-200 text-stone-600 hover:border-stone-800 hover:text-stone-900 rounded-full bg-white')
            }`}
          >
            <Plus size={14} /> Add Project
          </button>
        </div>
      )}
    </div>
  );
};

// --- EXPERIENCE TIMELINE MODULE ---
interface ExperienceTimelineProps {
    experience: ExperienceItem[];
    template?: TemplateType;
    isEditing?: boolean;
    onChange?: (experience: ExperienceItem[]) => void;
}

export const ExperienceTimeline: React.FC<ExperienceTimelineProps> = ({ experience, template = 'classic', isEditing = false, onChange }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isEditingActive, setIsEditingActive] = useState(false);
    const isCyber = template === 'cyber';
    const isBrutal = template === 'brutal';

    // Clamping selectedIndex
    useEffect(() => {
        if (experience.length > 0 && selectedIndex >= experience.length) {
            setSelectedIndex(Math.max(0, experience.length - 1));
        }
    }, [experience.length, selectedIndex]);

    // Auto-play feature
    useEffect(() => {
        let interval: any;
        if (isPlaying && !isEditing) {
            interval = setInterval(() => {
                setSelectedIndex(prev => (prev + 1) % experience.length);
            }, 4000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, experience.length, isEditing]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    // Calculate progress (0 to 100%)
    const progress = experience.length <= 1 ? 0 : (selectedIndex / (experience.length - 1)) * 100;
  
    if (experience.length === 0) {
        if (isEditing) {
            return (
                <div className="w-full text-center py-8">
                    <p className="text-sm text-stone-400 mb-4">No experience entries found.</p>
                    <button 
                        onClick={() => {
                            if (onChange) {
                                onChange([{
                                    id: Date.now().toString(),
                                    year: "2025",
                                    role: "New Role",
                                    company: "New Company",
                                    description: "Description of your responsibilities..."
                                }]);
                                setSelectedIndex(0);
                                setIsEditingActive(true);
                            }
                        }}
                        className={`px-5 py-2 flex items-center gap-1.5 text-xs font-bold transition-all mx-auto cursor-pointer ${
                            template === 'cyber' ? 'border border-cyan-800 text-cyan-400 bg-slate-900 hover:bg-cyan-900/30' :
                            (template === 'brutal' ? 'border-2 border-black bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-stone-200 text-stone-600 hover:border-stone-800 hover:text-stone-900 rounded-full bg-white')
                        }`}
                    >
                        <Plus size={14} /> Add Experience
                    </button>
                </div>
            );
        }
        return null;
    }

    // --- STYLES ---
    let buttonClasses = "flex items-center gap-2 px-5 py-2 transition-colors text-sm font-medium shadow-sm cursor-pointer ";
    let trackBg = "";
    let trackFill = "";
    let pointInactive = "";
    let pointActive = "";
    let cardClasses = "w-full max-w-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start transition-all duration-300 ";
    let roleClasses = "text-2xl md:text-3xl mb-2 md:mb-4 ";
    let companyClasses = "font-bold uppercase text-xs tracking-widest ";

    if (isCyber) {
        buttonClasses += "rounded-md border border-cyan-800 text-cyan-400 hover:bg-cyan-900/30 bg-slate-900";
        trackBg = "bg-slate-800";
        trackFill = "bg-cyan-500 shadow-[0_0_10px_#06b6d4]";
        pointInactive = "bg-slate-900 border-slate-700";
        pointActive = "bg-cyan-500 border-cyan-400 shadow-[0_0_15px_#06b6d4]";
        cardClasses += "bg-slate-900 border border-slate-700 rounded-xl text-slate-300";
        roleClasses += "font-mono text-white";
        companyClasses += "text-cyan-500";
    } else if (isBrutal) {
        buttonClasses += "border-2 border-black bg-white text-black hover:bg-black hover:text-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
        trackBg = "bg-black/20";
        trackFill = "bg-black";
        pointInactive = "bg-white border-2 border-black";
        pointActive = "bg-black border-2 border-black scale-150";
        cardClasses += "bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]";
        roleClasses += "font-sans font-black text-black uppercase";
        companyClasses += "bg-black text-white px-2 py-1 inline-block";
    } else {
        // Classic
        buttonClasses += "rounded-full border border-stone-200 hover:border-stone-900 hover:bg-stone-50 text-stone-600 bg-white";
        trackBg = "bg-stone-200";
        trackFill = "bg-stone-800";
        pointInactive = "bg-[#F9F8F4] border-stone-300 group-hover:border-stone-500";
        pointActive = "bg-stone-800 border-stone-800 shadow-[0_0_0_4px_rgba(26,26,26,0.1)]";
        cardClasses += "bg-white border border-stone-200 rounded-xl text-stone-600";
        roleClasses += "font-serif text-stone-900";
        companyClasses += "text-stone-500";
    }

    const cardJSX = (
        <motion.div
            key={selectedIndex}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start"
        >
            <div className={`flex flex-shrink-0 w-16 h-16 md:w-20 md:h-20 items-center justify-center relative overflow-hidden mb-4 md:mb-0 ${isBrutal ? 'bg-black text-white border-2 border-black' : 'rounded-full bg-stone-50 border border-stone-100 text-stone-300'} ${isCyber ? 'bg-slate-800 border-slate-700 text-slate-600' : ''}`}>
                 <Briefcase size={24} className="md:w-7 md:h-7" />
                 {!isBrutal && <div className="absolute inset-0 border-4 border-inherit rounded-full opacity-50"></div>}
            </div>
            <div className="text-center md:text-left flex-1 w-full">
                <div className="flex flex-col md:flex-row md:items-baseline gap-2 mb-2 justify-center md:justify-start">
                     <div className={`font-mono text-sm font-bold uppercase tracking-wider ${isCyber ? 'text-slate-500' : 'text-stone-400'}`}>{experience[selectedIndex]?.year}</div>
                     <div className={`hidden md:block w-1 h-1 rounded-full ${isCyber ? 'bg-slate-700' : 'bg-stone-300'}`}></div>
                     <div className={companyClasses}>{experience[selectedIndex]?.company}</div>
                </div>
                <h4 className={roleClasses}>{experience[selectedIndex]?.role}</h4>
                <p className={`leading-relaxed text-sm md:text-base ${isCyber ? 'font-mono text-slate-400' : (isBrutal ? 'font-medium' : '')}`}>{experience[selectedIndex]?.description}</p>
            </div>
        </motion.div>
    );

    return (
      <div className="w-full max-w-5xl mx-auto my-8 md:my-16">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 md:mb-16 gap-4 px-4 md:px-0">
            <div className="text-center md:text-left w-full md:w-auto">
                <span className={`text-xs font-bold tracking-widest uppercase mb-3 block ${isCyber ? 'text-cyan-800' : 'text-stone-500'}`}>My Journey</span>
                <h3 className={`text-3xl md:text-4xl ${isCyber ? 'font-mono text-white' : (isBrutal ? 'font-black uppercase' : 'font-serif text-stone-900')}`}>Career Timeline</h3>
            </div>
            {!isEditing && (
                <button 
                    onClick={togglePlay}
                    className={buttonClasses}
                >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    {isPlaying ? "Pause Timeline" : "Play Timeline"}
                </button>
            )}
            {isEditing && (
                <button 
                    onClick={() => {
                        if (onChange) {
                            const newItem = {
                                id: Date.now().toString(),
                                year: "2025 - Present",
                                role: "New Role",
                                company: "New Company",
                                description: "Description of your responsibilities..."
                            };
                            onChange([...experience, newItem]);
                            setSelectedIndex(experience.length);
                            setIsEditingActive(true);
                        }
                    }}
                    className={`px-5 py-2 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        template === 'cyber' ? 'border border-cyan-800 text-cyan-400 bg-slate-900 hover:bg-cyan-900/30' :
                        (template === 'brutal' ? 'border-2 border-black bg-white text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-stone-200 text-stone-600 hover:border-stone-800 hover:text-stone-900 rounded-full bg-white')
                    }`}
                >
                    <Plus size={14} /> Add Experience
                </button>
            )}
        </div>
        
        {/* Timeline Track */}
        <div className="relative mb-12 md:mb-16 px-4 md:px-8 select-none">
          {/* Base Line */}
          <div className={`absolute left-4 right-4 md:left-8 md:right-8 top-1/2 h-0.5 -z-20 transform -translate-y-1/2 ${trackBg}`}></div>
          
          {/* Progress Line */}
          <div className="absolute left-4 right-4 md:left-8 md:right-8 top-1/2 h-0.5 -z-10 transform -translate-y-1/2 overflow-hidden rounded-full">
             <div 
                className={`h-full transition-all duration-500 ease-out ${trackFill}`}
                style={{ width: `${progress}%` }}
             ></div>
          </div>
          
          {/* Points */}
          <div className="flex justify-between items-center relative z-10">
              {experience.map((item, idx) => (
              <button 
                  key={item.id}
                  onClick={() => { setSelectedIndex(idx); setIsPlaying(false); }}
                  className="group focus:outline-none flex flex-col items-center gap-4 cursor-pointer relative p-2 md:p-0"
              >
                  <div className={`
                      w-4 h-4 transition-all duration-300 relative z-20 box-content
                      ${isBrutal ? '' : 'rounded-full border-2'}
                      ${idx <= selectedIndex ? pointActive : pointInactive}
                  `}>
                  </div>
                  
                  {/* Floating Year Label */}
                  <span className={`
                      text-xs font-bold tracking-widest transition-all duration-300 absolute top-10 md:top-8
                      ${isCyber ? 'font-mono' : 'font-serif'}
                      ${idx === selectedIndex 
                          ? (isCyber ? 'text-cyan-400 opacity-100' : 'text-stone-800 opacity-100')
                          : (isCyber ? 'text-slate-600' : 'text-stone-400') + ' opacity-60 group-hover:opacity-100 hidden md:block'}
                  `}>
                      {item.year}
                  </span>
              </button>
              ))}
          </div>
        </div>
  
        {/* Content Area */}
        <div className="relative min-h-[250px] flex justify-center px-4 md:px-0">
          {isEditing && isEditingActive ? (
              <div className={`${cardClasses} border-2 border-dashed border-blue-500 bg-blue-50/10 space-y-4 flex-col md:flex-col items-stretch`}>
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Year</label>
                          <input 
                              type="text" 
                              value={experience[selectedIndex]?.year} 
                              onChange={(e) => {
                                  if (!onChange) return;
                                  const list = [...experience];
                                  list[selectedIndex] = { ...list[selectedIndex], year: e.target.value };
                                  onChange(list);
                              }} 
                              className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Company</label>
                          <input 
                              type="text" 
                              value={experience[selectedIndex]?.company} 
                              onChange={(e) => {
                                  if (!onChange) return;
                                  const list = [...experience];
                                  list[selectedIndex] = { ...list[selectedIndex], company: e.target.value };
                                  onChange(list);
                              }} 
                              className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Role / Position</label>
                      <input 
                          type="text" 
                          value={experience[selectedIndex]?.role} 
                          onChange={(e) => {
                              if (!onChange) return;
                              const list = [...experience];
                              list[selectedIndex] = { ...list[selectedIndex], role: e.target.value };
                              onChange(list);
                          }} 
                          className="w-full p-2 text-xs bg-white border border-stone-200 rounded text-black font-sans focus:outline-none focus:border-stone-400" 
                      />
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Description</label>
                      <textarea 
                          value={experience[selectedIndex]?.description} 
                          onChange={(e) => {
                              if (!onChange) return;
                              const list = [...experience];
                              list[selectedIndex] = { ...list[selectedIndex], description: e.target.value };
                              onChange(list);
                          }} 
                          className="w-full p-2 text-xs bg-white border border-stone-200 rounded h-20 resize-none text-black font-sans focus:outline-none focus:border-stone-400" 
                      />
                  </div>
                  <div className="flex justify-end">
                      <button 
                          onClick={() => setIsEditingActive(false)}
                          className="px-4 py-1.5 bg-stone-900 text-white rounded text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                          Done
                      </button>
                  </div>
              </div>
          ) : (
              <AnimatePresence mode='wait'>
                  <div className={cardClasses}>
                      <EditableItemWrapper
                          isEditing={isEditing}
                          onMoveUp={() => {
                              if (selectedIndex > 0 && onChange) {
                                  const list = [...experience];
                                  const temp = list[selectedIndex];
                                  list[selectedIndex] = list[selectedIndex - 1];
                                  list[selectedIndex - 1] = temp;
                                  onChange(list);
                                  setSelectedIndex(selectedIndex - 1);
                              }
                          }}
                          onMoveDown={() => {
                              if (selectedIndex < experience.length - 1 && onChange) {
                                  const list = [...experience];
                                  const temp = list[selectedIndex];
                                  list[selectedIndex] = list[selectedIndex + 1];
                                  list[selectedIndex + 1] = temp;
                                  onChange(list);
                                  setSelectedIndex(selectedIndex + 1);
                              }
                          }}
                          onDelete={() => {
                              if (onChange) {
                                  const list = experience.filter((_, i) => i !== selectedIndex);
                                  onChange(list);
                                  setSelectedIndex(Math.max(0, selectedIndex - 1));
                              }
                          }}
                          onEdit={() => setIsEditingActive(true)}
                          canMoveUp={selectedIndex > 0}
                          canMoveDown={selectedIndex < experience.length - 1}
                      >
                          {cardJSX}
                      </EditableItemWrapper>
                  </div>
              </AnimatePresence>
          )}
        </div>
      </div>
    );
};


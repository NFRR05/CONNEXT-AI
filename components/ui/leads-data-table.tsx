"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, MoreHorizontal, Phone, Clock, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Adapted Lead interface to match CONNEXT AI structure
export interface Lead {
  id: string;
  customer_phone: string | null;
  call_summary: string | null;
  status: 'New' | 'Contacted' | 'Closed';
  created_at: string;
  duration: number | null;
  sentiment: string | null;
  agent_id: string;
  agent_name?: string; // Optional, can be joined from agents table
}

interface LeadsTableProps {
  title?: string;
  leads?: Lead[];
  onLeadAction?: (leadId: string, action: string) => void;
  className?: string;
}

export function LeadsTable({
  title = "Leads",
  leads: initialLeads = [],
  onLeadAction,
  className = ""
}: LeadsTableProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const shouldReduceMotion = useReducedMotion();

  // Detect dark mode via CSS
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    return () => observer.disconnect();
  }, []);

  const handleLeadSelection = (leadId: string, selected: boolean) => {
    const newSelected = new Set(selectedLeads);
    if (selected) {
      newSelected.add(leadId);
    } else {
      newSelected.delete(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedLeads(new Set(leads.map(lead => lead.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const isSelected = (leadId: string) => selectedLeads.has(leadId);
  const isAllSelected = selectedLeads.size === leads.length && leads.length > 0;
  const isIndeterminate = selectedLeads.size > 0 && selectedLeads.size < leads.length;

  const handleLeadActionClick = (leadId: string, action: string) => {
    if (onLeadAction) {
      onLeadAction(leadId, action);
    } else if (action === "view") {
      router.push(`/client/leads/${leadId}`);
    }
  };

  const handleSort = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    
    const sortedLeads = [...leads].sort((a, b) => {
      const aDate = new Date(a.created_at);
      const bDate = new Date(b.created_at);
      return newOrder === "asc" ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
    });
    
    setLeads(sortedLeads);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusPill = (status: Lead["status"]) => {
    const statusConfig = {
      "New": {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-800/30",
        label: "NEW"
      },
      "Contacted": {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800/30",
        label: "CONTACTED"
      },
      "Closed": {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-200 dark:border-green-800/30",
        label: "CLOSED"
      }
    };

    const config = statusConfig[status];
    return (
      <div className={cn("px-2 py-1 rounded-lg text-xs font-medium border", config.bg, config.text, config.border)}>
        {config.label}
      </div>
    );
  };

  const getSentimentPill = (sentiment: string | null) => {
    if (!sentiment) return null;
    
    const lowerSentiment = sentiment.toLowerCase();
    let config;
    
    if (lowerSentiment.includes('positive') || lowerSentiment.includes('happy')) {
      config = {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-200 dark:border-green-800/30",
      };
    } else if (lowerSentiment.includes('negative') || lowerSentiment.includes('angry')) {
      config = {
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-200 dark:border-red-800/30",
      };
    } else {
      config = {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        text: "text-yellow-600 dark:text-yellow-400",
        border: "border-yellow-200 dark:border-yellow-800/30",
      };
    }

    return (
      <div className={cn("px-2 py-1 rounded-lg text-xs font-medium border", config.bg, config.text, config.border)}>
        {sentiment}
      </div>
    );
  };

  const getInitials = (phone: string | null) => {
    if (!phone) return '?';
    // Use last 4 digits or first character
    const digits = phone.replace(/\D/g, '');
    return digits.slice(-1) || '?';
  };

  const containerVariants = {
    visible: {
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.1,
      }
    }
  };

  const rowVariants = {
    hidden: shouldReduceMotion ? {} : { 
      opacity: 0, 
      y: 20,
      scale: 0.98,
      filter: "blur(4px)" 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.7,
      },
    },
  };

  if (leads.length === 0) {
    return (
      <div className={cn("w-full max-w-7xl mx-auto", className)}>
        <div className="bg-background border border-border/50 rounded-2xl p-12 text-center">
          <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
          <p className="text-muted-foreground">
            Leads will appear here once your agents start receiving calls
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-7xl mx-auto", className)}>
      {/* Table Container */}
      <div className="bg-background border border-border/50 rounded-2xl overflow-hidden">
        {/* Table Headers */}
        <div className="grid grid-cols-6 gap-4 px-6 py-3 text-xs font-medium text-muted-foreground/70 uppercase tracking-wide bg-muted/15 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded border-muted-foreground/40 text-muted-foreground focus:ring-muted-foreground/20 focus:ring-2 accent-muted-foreground bg-background"
              />
            </div>
            <span>Lead</span>
          </div>
          <div>Status</div>
          <div>Sentiment</div>
          <div>Duration</div>
          <div>Agent</div>
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleSort}>
            Created
            <ChevronDown className={cn("w-4 h-4 transition-transform", sortOrder === "asc" && "rotate-180")} />
          </div>
        </div>

        {/* Table Rows */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {leads.map((lead, index) => (
            <motion.div key={lead.id} variants={rowVariants}>
              <div
                className={cn(
                  "grid grid-cols-6 gap-4 px-6 py-3 hover:bg-muted/30 transition-colors cursor-pointer group relative",
                  isSelected(lead.id) && "bg-blue-50/50 dark:bg-blue-900/10",
                  index < leads.length - 1 && "border-b border-border/20"
                )}
                onMouseEnter={() => {
                  setHoveredRow(lead.id);
                  setHoveredAction(lead.id);
                }}
                onMouseLeave={() => {
                  setHoveredRow(null);
                  setHoveredAction(null);
                }}
              >
                {/* Lead Info */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected(lead.id)}
                    onChange={(e) => handleLeadSelection(lead.id, e.target.checked)}
                    className="w-4 h-4 rounded border-muted-foreground/40 text-muted-foreground focus:ring-muted-foreground/20 focus:ring-2 accent-muted-foreground bg-background"
                  />
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-muted/30 rounded-full flex items-center justify-center flex-shrink-0 border border-border/20">
                      <Phone className="w-4 h-4 text-muted-foreground/80" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground/90 truncate">
                        {lead.customer_phone || 'Unknown'}
                      </div>
                      {lead.call_summary && (
                        <div className="text-xs text-muted-foreground/70 truncate line-clamp-1">
                          {lead.call_summary}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center">
                  {getStatusPill(lead.status)}
                </div>

                {/* Sentiment */}
                <div className="flex items-center">
                  {getSentimentPill(lead.sentiment) || (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </div>

                {/* Duration */}
                <div className="flex items-center">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-muted-foreground/60" />
                    <span className="text-sm font-medium text-foreground/90">
                      {formatDuration(lead.duration)}
                    </span>
                  </div>
                </div>

                {/* Agent */}
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground/70 truncate">
                    {lead.agent_name || 'Agent'}
                  </span>
                </div>

                {/* Created Date / Action */}
                <div className="flex items-center">
                  <AnimatePresence mode="wait">
                    {hoveredAction === lead.id ? (
                      <motion.button
                        initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 500, 
                          damping: 25,
                          duration: 0.1
                        }}
                        onClick={() => handleLeadActionClick(lead.id, "view")}
                        className="flex items-center gap-2 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        View
                        <div className="w-px h-3 bg-primary/30 mx-1" />
                        <MoreHorizontal className="w-3 h-3" />
                      </motion.button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.05 }}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground/70"
                      >
                        <Calendar className="w-3 h-3" />
                        {formatDate(lead.created_at)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom Action Bar */}
      <AnimatePresence>
        {selectedLeads.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, filter: "blur(8px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 100, opacity: 0, filter: "blur(8px)" }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 30,
              mass: 0.8 
            }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-background/95 backdrop-blur-lg border border-border/50 rounded-xl px-4 py-2 shadow-2xl">
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-foreground/80">
                  {selectedLeads.size} selected lead{selectedLeads.size !== 1 ? 's' : ''}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      selectedLeads.forEach(id => handleLeadActionClick(id, "view"));
                      setSelectedLeads(new Set());
                    }}
                    className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition-colors"
                  >
                    View Selected
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log("Export selected leads");
                      setSelectedLeads(new Set());
                    }}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground/80 rounded-lg text-xs font-medium transition-colors"
                  >
                    Export CSV
                  </button>
                  
                  <button
                    onClick={() => setSelectedLeads(new Set())}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground/80 rounded-lg text-xs font-medium transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


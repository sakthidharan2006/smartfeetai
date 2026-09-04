import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useIsMobile } from './use-mobile';

interface SidebarContextType {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close sidebar on mobile by default, open on desktop
  useEffect(() => {
    setIsOpen(!isMobile);
    if (isMobile) {
      setIsCollapsed(false); // Don't collapse on mobile, just hide
    }
  }, [isMobile]);

  const toggle = () => {
    if (isMobile) {
      setIsOpen(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  };

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <SidebarContext.Provider value={{
      isOpen,
      isCollapsed,
      isMobile,
      toggle,
      open,
      close,
      setCollapsed: setIsCollapsed,
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

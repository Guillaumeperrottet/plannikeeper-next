"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";
import Link from "next/link";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  // Définir l'état initial à false pour que la sidebar soit repliée au départ
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = ({
  children,
  userComponent,
  ...props
}: React.ComponentProps<typeof motion.div> & {
  userComponent?: (open: boolean) => React.ReactNode;
}) => {
  return (
    <>
      <DesktopSidebar userComponent={userComponent} {...props}>
        {children}
      </DesktopSidebar>
      <MobileSidebar
        userComponent={userComponent}
        {...(props as React.ComponentProps<"div">)}
      >
        {children}
      </MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  userComponent,
  ...props
}: React.ComponentProps<typeof motion.div> & {
  userComponent?: (open: boolean) => React.ReactNode;
}) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "hidden md:flex md:flex-col h-full bg-[color:var(--sidebar-background)] text-[color:var(--sidebar-foreground)] shadow-md shrink-0 transition-all duration-30 border-r border-[color:var(--sidebar-border)]",
          className
        )}
        animate={{
          width: animate ? (open ? "300px" : "45px") : "300px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        <div className="flex flex-col h-full">
          {/* Main Navigation */}
          <div className="flex-grow p-1">{children}</div>

          {/* User Profile Section */}
          <div className="border-t border-[color:var(--sidebar-border)] p-4 flex items-center gap-3">
            {userComponent ? (
              userComponent(open)
            ) : (
              <>
                <div className="w-10 h-10 bg-[color:var(--muted)] rounded-full flex items-center justify-center text-[color:var(--muted-foreground)] font-semibold">
                  U
                </div>
                {open && (
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">Utilisateur</span>
                    <span className="text-xs text-[color:var(--muted-foreground)]"></span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  userComponent,
  ...props
}: React.ComponentProps<"div"> & {
  userComponent?: (open: boolean) => React.ReactNode;
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-16 px-4 flex flex-row md:hidden items-center justify-between bg-[color:var(--sidebar-background)] text-[color:var(--sidebar-foreground)] border-b border-[color:var(--sidebar-border)] w-full",
          className
        )}
        {...props}
      >
        <div className="font-bold text-xl">PlanniKeeper</div>
        <div className="flex justify-end z-20">
          <IconMenu2
            className="text-[color:var(--sidebar-foreground)] cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-[color:var(--sidebar-background)] text-[color:var(--sidebar-foreground)] z-[100] flex flex-col",
                className
              )}
            >
              <div className="flex justify-between items-center p-4 border-b border-[color:var(--sidebar-border)]">
                <div className="font-bold text-xl">PlanniKeeper</div>
                <div
                  className="text-[color:var(--sidebar-foreground)] cursor-pointer"
                  onClick={() => setOpen(!open)}
                >
                  <IconX />
                </div>
              </div>
              <div className="flex-grow p-4 overflow-y-auto">{children}</div>
              <div className="border-t border-[color:var(--sidebar-border)] p-4 flex items-center gap-3">
                {userComponent ? (
                  userComponent(true)
                ) : (
                  <>
                    <div className="w-10 h-10 bg-[color:var(--muted)] rounded-full flex items-center justify-center text-[color:var(--muted-foreground)] font-semibold">
                      U
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">Utilisateur</span>
                      <span className="text-xs text-[color:var(--muted-foreground)]"></span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  isActive,
  ...props
}: {
  link: Links;
  className?: string;
  isActive?: boolean;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center gap-2 py-2 px-2 my-1 rounded-lg transition-colors duration-1", // gap et padding réduits
        isActive
          ? "bg-[color:var(--sidebar-accent)] text-[color:var(--sidebar-accent-foreground)]"
          : "text-[color:var(--sidebar-foreground)] hover:bg-[color:var(--sidebar-accent)] hover:bg-opacity-50 hover:text-[color:var(--sidebar-accent-foreground)]",
        className
      )}
      {...props}
    >
      {/* Icon */}
      <div className="text-lg min-w-[20px] flex-shrink-0">{link.icon}</div>{" "}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm font-medium whitespace-nowrap overflow-hidden"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

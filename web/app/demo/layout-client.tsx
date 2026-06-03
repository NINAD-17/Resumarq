"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { LoginModal } from "@/components/dashboard/login-modal";

export function DemoLayoutClient() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <Sidebar 
        demoMode={true} 
        onActionClick={() => setShowLoginModal(true)} 
      />
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
}

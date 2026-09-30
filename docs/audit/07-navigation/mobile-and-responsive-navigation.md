# Mobile & Responsive Navigation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 22 of 27  

---

## 1. Responsive Viewport Breakpoints

BP-CMS utilizes Tailwind CSS responsive breakpoints to adapt its navigation architecture across device form factors:
- **Mobile (<640px / `sm:`)**: Single-column layout, sticky top header, off-canvas slide-out navigation drawer.
- **Tablet (640px - 1023px / `md:`, `lg:`)**: Persistent top header with search, off-canvas navigation drawer.
- **Desktop (>=1024px / `lg:`)**: Persistent left sidebar (256px or 64px collapsed), contextual page title, full layout frame.

---

## 2. Mobile Drawer Mechanics (`Sidebar.tsx`)

```typescript
// src/components/layout/Sidebar.tsx:73-86
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpenMobile && onCloseMobile) {
      onCloseMobile();
    }
  };
  if (isOpenMobile) {
    document.addEventListener("keydown", handleKeyDown);
  }
  return () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
}, [isOpenMobile, onCloseMobile]);
```

1. **Overlay Backdrop**: Semi-opaque dark scrim (`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden`).
2. **Slide-Out Transition**: Smooth CSS transition off-canvas.
3. **Auto-Dismiss on Navigation**: Clicking any nav link inside the drawer automatically invokes `onCloseMobile()`.
4. **Touch Target Size**: Nav items in mobile drawer provide at least 44px vertical height, meeting mobile touch accessibility guidelines.

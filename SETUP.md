# 🎯 CLAW-EMPIRE PROJECT SETUP GUIDE
# Creating Projects and Branches

---

## 📊 CURRENT STATE

**Existing Project Found:**
- **Name:** "Audit and fix" (generic)
- **Path:** `/home/clawuser/Ecommerce-website-beta`
- **Goal:** "please audit and improve my website..."
- **Pack:** development

---

## 🏗️ RECOMMENDED: Create New Properly Named Project

### Option 1: Rename Existing Project (Easiest)

**CEO Directive to send:**
```
$ Update project name and details

Project ID: b1ea722f-5083-4e02-8fdf-dddd5c414e82

New Name: "GoldenTier MVP"
New Path: /home/clawuser/Ecommerce-website-beta
New Core Goal: "Launch production-ready B2B peptide e-commerce platform with partner portal, product catalog, cart, and checkout"
Default Pack: development

Clarify assignment: Add project_path context to all tasks
```

---

### Option 2: Create Fresh Project (Recommended)

**CEO Directive to send:**
```
$ Create new project

Name: "GoldenTier Peptide Partners"
Path: /home/clawuser/Ecommerce-website-beta
Core Goal: "Build and launch premium B2B peptide e-commerce platform with wholesale partner system"
Default Pack: development
Assignment Mode: manual

This project includes:
- Partner registration and authentication
- Product catalog with variant support
- Shopping cart with partner discounts
- Checkout and order management
- Admin dashboard for product/order management
```

---

## 🌿 GIT BRANCH STRATEGY

After creating the project, set up this branch structure in the repo:

### Branch Setup Commands:

```bash
# In /home/clawuser/Ecommerce-website-beta

# 1. Create main development branch
git checkout -b develop

# 2. Create feature branches for Sprint 1
git checkout -b feature/variant-stock-fix
git checkout -b feature/disable-cart-oos
git checkout -b feature/cart-usememo
git checkout -b feature/cart-debounce
git checkout -b feature/cart-logout-clear

# 3. Push branches to remote
git push origin develop
```

---

## 📋 COMPLETE CEO DIRECTIVE (Copy This)

```
$ CEO Directive - Project Setup and Sprint 1

=== PART 1: PROJECT CONFIGURATION ===

Create or update project:
Name: "GoldenTier Peptide Partners"
Path: /home/clawuser/Ecommerce-website-beta
Core Goal: "Launch B2B peptide e-commerce platform with partner portal, 
discount system, and admin dashboard"

Project Context for Agents:
- This is a premium wholesale peptide platform
- Target users: Research partners (B2B)
- Tech: React 19 + Vite + Supabase + Tailwind
- Brand: Gold theme (#D4AF37), luxury aesthetic
- Key Features: Product catalog, partner discounts, cart, checkout, admin

=== PART 2: BRANCH SETUP ===

Bolt (Dev Lead) - Execute these git commands:

cd /home/clawuser/Ecommerce-website-beta

# Create develop branch
git checkout -b develop
git push origin develop

# Create Sprint 1 feature branches
git checkout -b feature/C1-variant-stock-fix
git checkout -b feature/C2-disable-cart-oos
git checkout -b feature/C3-cart-usememo
git checkout -b feature/C4-cart-debounce
git checkout -b feature/C5-cart-logout-clear
git checkout -b feature/H1-auth-toast
git checkout -b feature/H2-checkout-stock
git checkout -b feature/H3-partner-discount

# Push all branches
git push origin --all

Report back when branches are created.

=== PART 3: TASK ASSIGNMENTS ===

Each agent checkout their feature branch and start:

C1: Bolt + Kitty → feature/C1-variant-stock-fix
C2: ARIA + Luna → feature/C2-disable-cart-oos
C3: RIVER + Lint → feature/C3-cart-usememo
C4: Turbo + Nova → feature/C4-cart-debounce
C5: Vault + RIVER → feature/C5-cart-logout-clear

Reference: TASKS.md in project root
Questions? Ask in team channel.

- CEO (Earth)
```

---

## 🔧 ALTERNATIVE: Simple Branch Setup

If you just want simple branches without complex naming:

```
$ Setup GoldenTier branches

Bolt:
1. cd /home/clawuser/Ecommerce-website-beta
2. git checkout -b sprint-1
git push origin sprint-1

All agents:
- Work on sprint-1 branch
- Create PRs to sprint-1
- I'll merge approved PRs

Simple workflow for MVP sprint.
```

---

## 📁 PROJECT FILE STRUCTURE

After setup, your project should have:

```
/home/clawuser/Ecommerce-website-beta/
├── TASKS.md              ← Task list (already added)
├── README.md             ← Project docs
├── CLAUDE.md             ← Project memory
├── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   └── ...
├── .git/                 ← Git repo
└── Branches:
    ├── main              ← Production
    ├── develop           ← Integration
    ├── sprint-1          ← Current sprint
    └── feature/*         ← Individual features
```

---

## 🎯 NEXT STEPS

1. **Copy CEO Directive above** into Claw-Empire
2. **Bolt will create branches** (he's Dev Lead)
3. **Agents checkout their feature branch**
4. **Start coding on assigned tasks**

---

## ✅ VERIFICATION

After setup, verify with:

```bash
cd /home/clawuser/Ecommerce-website-beta
git branch -a
```

Should show:
- main
- develop (or sprint-1)
- feature/C1-* through feature/H3-*

---

Ready to send the directive? 🦋💙

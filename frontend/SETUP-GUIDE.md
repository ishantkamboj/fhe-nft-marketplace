# 🚀 COMPLETE SETUP GUIDE

Follow these steps exactly to get everything working!

---

## 📦 **STEP 1: BACKEND SETUP (5 minutes)**

```bash
# Navigate to workspace
cd ~/Desktop/ZAMA\ OTC

# Create backend
mkdir marketplace-backend
cd marketplace-backend

# Copy these 2 files from downloads:
# - server.ts
# - package.json

# Create .env
echo 'RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY' > .env
echo 'PORT=3001' >> .env

# Install
npm install

# Start
npm run dev
```

**✅ Backend running at http://localhost:3001**

---

## 📦 **STEP 2: FRONTEND SETUP (10 minutes)**

```bash
cd ~/Desktop/ZAMA\ OTC

# Create frontend
mkdir marketplace-frontend
cd marketplace-frontend
```

### **Copy all files into this structure:**

```
marketplace-frontend/
├── src/
│   ├── pages/
│   │   ├── HomePage.tsx (UPDATED)
│   │   ├── CreateListingPage.tsx (UPDATED)
│   │   ├── ListingDetailPage.tsx (YOUR FILE)
│   │   ├── MyListingsPage.tsx (YOUR FILE)
│   │   └── MyPurchasesPage.tsx (YOUR FILE)
│   ├── components/
│   │   ├── Navbar.tsx (YOUR FILE)
│   │   └── ListingCard.tsx (UPDATED)
│   ├── lib/
│   │   ├── contract.ts (NEW)
│   │   └── wagmi.ts (NEW)
│   ├── App.tsx (NEW)
│   ├── App.css (NEW)
│   └── main.tsx (NEW)
├── package.json (NEW)
├── tailwind.config.js (NEW)
├── vite.config.ts (NEW)
├── index.html (NEW)
└── .env (NEW)
```

### **Install dependencies:**

```bash
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### **Create .env:**

```bash
cat > .env << 'EOF'
VITE_BACKEND_URL=http://localhost:3001
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
EOF
```

### **Start frontend:**

```bash
npm run dev
```

**✅ Frontend running at http://localhost:5173**

---

## 🎯 **WHAT YOU'LL HAVE:**

### **3 Files UPDATED (with backend integration):**
1. **HomePage.tsx** - Fetches from backend API
2. **CreateListingPage.tsx** - Calls backend to encrypt
3. **ListingCard.tsx** - Shows public price

### **5 Files FROM YOUR UPLOAD (keep as-is):**
1. **Navbar.tsx** - Your beautiful navbar
2. **ListingDetailPage.tsx** - Detail view
3. **MyListingsPage.tsx** - Seller dashboard
4. **MyPurchasesPage.tsx** - Buyer dashboard

### **NEW Files (configuration):**
1. **src/lib/contract.ts** - Contract ABI & address
2. **src/lib/wagmi.ts** - Wallet connection config
3. **App.tsx** - Main app with routing
4. **App.css** - Tailwind styles
5. **main.tsx** - React entry point
6. **package.json** - Dependencies
7. **tailwind.config.js** - Tailwind config
8. **vite.config.ts** - Vite config

---

## 🔄 **FULL FLOW:**

### **Create Listing:**
1. Fill form in CreateListingPage
2. Calls backend `/api/encrypt-listing`
3. Backend encrypts 53 FHE values
4. Frontend calls contract with encrypted data
5. Listing shows on HomePage with PUBLIC price!

### **Browse:**
1. HomePage fetches from backend
2. Shows all listings with prices
3. Users can see what they're buying!

### **Buy & Decrypt:**
1. User buys listing
2. Contract grants FHE permissions
3. Frontend decrypts with fhevmjs
4. Shows wallet + private key

---

## 📋 **FILES TO DOWNLOAD:**

**From me (complete-setup/):**
- All files in `/complete-setup/` folder
- Copy them to your marketplace-frontend/

**From your uploads (keep these):**
- Navbar.tsx
- ListingDetailPage.tsx  
- MyListingsPage.tsx
- MyPurchasesPage.tsx

**Updated (from frontend-updated/):**
- HomePage.tsx
- ListingCard.tsx
- CreateListingPage.tsx

---

## ✅ **TESTING:**

```bash
# Terminal 1 - Backend
cd ~/Desktop/ZAMA\ OTC/marketplace-backend
npm run dev

# Terminal 2 - Frontend
cd ~/Desktop/ZAMA\ OTC/marketplace-frontend
npm run dev

# Open browser
http://localhost:5173
```

**You should see:**
- ✅ Beautiful homepage
- ✅ Create listing button
- ✅ All navigation working
- ✅ Backend API responding

---

## 🎯 **QUICK START COMMANDS:**

```bash
# Setup everything
cd ~/Desktop/ZAMA\ OTC

# Backend
cd marketplace-backend && npm install && npm run dev &

# Frontend  
cd marketplace-frontend && npm install && npm run dev
```

---

**Follow these steps and you'll have a complete working marketplace!** 🚀

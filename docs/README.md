# 📚 MD-Focus Documentation

Welcome to the MD-Focus documentation! This folder contains comprehensive guides to understand the application architecture.

## 📖 Available Documentation

### 🏗️ [ARCHITECTURE_VISUAL.md](./ARCHITECTURE_VISUAL.md)
Visual diagrams and simplified architecture overview.
- System architecture diagram
- Data flow visualization
- Component examples
- Quick reference

**Start here if you:** Want a quick visual understanding of how the app works.

---

### 📊 [ARCHITECTURE_DATA_FLOW.md](../ARCHITECTURE_DATA_FLOW.md)
Complete technical documentation of the data flow architecture.
- Detailed layer-by-layer breakdown
- Performance analysis
- Security features
- Code examples (correct vs incorrect)
- Best practices guide

**Start here if you:** Need deep technical understanding or are contributing code.

---

### 🎯 [ISSUE_RESOLUTION_SUMMARY.md](../ISSUE_RESOLUTION_SUMMARY.md)
Analysis and resolution of the "localStorage vs backend" question.
- Problem statement analysis
- Complete code audit results
- Architecture clarification
- Performance benefits
- Recommendations

**Start here if you:** Want to understand why no backend is needed and how the app manages data.

---

### 🏛️ [ARQUITETURA.md](../ARQUITETURA.md)
Original architecture documentation (in Portuguese).
- File structure
- Module responsibilities
- Separation of concerns
- Refactoring notes

**Start here if you:** Prefer Portuguese or need original architecture reference.

---

## 🎯 Quick Start Guide

### For Developers:

1. **Understanding the Architecture:**
   - Read [ARCHITECTURE_VISUAL.md](./ARCHITECTURE_VISUAL.md) for overview
   - Deep dive into [ARCHITECTURE_DATA_FLOW.md](../ARCHITECTURE_DATA_FLOW.md) for details

2. **Making Changes:**
   - Always use `getDadosUsuario()` to read data
   - Always use `atualizarDadosUsuario()` to save data
   - Never access `localStorage` directly (except for app preferences)

3. **Testing:**
   - Ensure UI updates correctly after data changes
   - Test cross-tab synchronization (open multiple tabs)
   - Verify backup recovery (simulate JSON corruption)

### For Managers/Stakeholders:

1. **Understanding the System:**
   - Read [ISSUE_RESOLUTION_SUMMARY.md](../ISSUE_RESOLUTION_SUMMARY.md)
   - Key point: **No backend needed** - this is a PWA that works offline

2. **Why No Backend?**
   - Data stored locally in user's browser
   - Works offline
   - No server costs
   - Instant synchronization across browser tabs
   - Private by design (data never leaves user's device)

3. **Performance:**
   - In-memory cache makes it ~90x faster
   - Instant UI updates
   - No network latency

---

## 🏗️ Architecture Overview

```
┌─────────────┐
│  UI Layer   │  ← index.html, report.html
└──────┬──────┘
       │ getDadosUsuario()
┌──────▼──────┐
│ Data Layer  │  ← data.js (cache + logic)
└──────┬──────┘
       │ obterItem(), salvarItem()
┌──────▼──────┐
│Storage Layer│  ← storage.js (protection + backup)
└──────┬──────┘
       │ localStorage API
┌──────▼──────┐
│localStorage │  ← Browser storage
└─────────────┘
```

**Key Point:** All UI components use the Data Layer (data.js), never accessing localStorage directly.

---

## ✅ Verified Components

All these components correctly use the data layer:

- ✅ Progress Circle (`atualizarGraficoCircular`)
- ✅ Progress Bar (`atualizarUIDashboard`)
- ✅ Dashboard (`iniciarDashboard`)
- ✅ Reports (`renderReport` via `safeGetDadosUsuario`)
- ✅ Simulations (`executarCalculoRapidoSimulacao`)
- ✅ Calculations (`calcularEAtualizarDashboard`)

---

## 🎯 Key Principles

### DO ✅

```javascript
// ✅ CORRECT - Use data layer
const dados = getDadosUsuario();
dados.realizadoTotal += 250;
atualizarDadosUsuario(dados);
```

### DON'T ❌

```javascript
// ❌ WRONG - Direct localStorage access
const dados = JSON.parse(localStorage.getItem("dados_usuario"));
dados.realizadoTotal += 250;
localStorage.setItem("dados_usuario", JSON.stringify(dados));
```

---

## 🔗 External Resources

- [MDN localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Progressive Web Apps (PWA)](https://web.dev/progressive-web-apps/)
- [JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

---

## 📝 Contributing

When contributing to this project:

1. Read the architecture docs first
2. Follow the data layer pattern
3. Never access localStorage directly in UI code
4. Add tests for new features
5. Update documentation if needed

---

## 🆘 Getting Help

- **Architecture questions:** Read [ARCHITECTURE_DATA_FLOW.md](../ARCHITECTURE_DATA_FLOW.md)
- **"Why no backend?"** Read [ISSUE_RESOLUTION_SUMMARY.md](../ISSUE_RESOLUTION_SUMMARY.md)
- **Code examples:** Check any of the docs above
- **File structure:** See [ARQUITETURA.md](../ARQUITETURA.md)

---

## 📊 Performance Stats

- **Cache Hit:** ~0.001ms (in-memory)
- **Cache Miss:** ~1ms (localStorage read)
- **Speedup:** ~90x with caching
- **Storage Size:** ~5-10MB (browser limit)

---

## 🔐 Security Features

- ✅ Automatic data backup
- ✅ Error recovery
- ✅ Data sanitization
- ✅ QuotaExceeded handling
- ✅ Cross-tab sync
- ✅ Try-catch protection

---

**Last Updated:** December 2025
**Maintainer:** MD-Focus Team

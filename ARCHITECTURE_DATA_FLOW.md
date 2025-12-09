# 📊 Arquitetura de Fluxo de Dados - MD-Focus

## 🎯 Visão Geral

O MD-Focus utiliza uma arquitetura em camadas que **NÃO possui backend**. É uma aplicação PWA (Progressive Web App) puramente frontend que armazena dados localmente no navegador do usuário.

## 🏗️ Camadas da Arquitetura

### 1. Camada de Armazenamento (Storage Layer)
**Arquivo:** `js/storage.js`

**Responsabilidade:** Gerenciar TODAS as operações de `localStorage` com proteção contra erros.

**Funções principais:**
- `obterItem(chave)` - GET com proteção JSON.parse
- `salvarItem(chave, dados)` - SET com proteção QuotaExceeded + backup automático
- `removerItem(chave)` - DELETE da chave e seu backup

**Proteções implementadas:**
- ✅ Try-catch automático
- ✅ Sistema de backup automático
- ✅ Recuperação de erros
- ✅ Sanitização de dados
- ✅ Tratamento de QuotaExceededError

### 2. Camada de Dados (Data Layer)
**Arquivo:** `js/data.js`

**Responsabilidade:** Gerenciar dados do usuário com cache em memória.

**Funções principais:**
- `getDadosUsuario()` - **FONTE ÚNICA DE VERDADE** para dados do usuário
- `atualizarDadosUsuario(dados)` - Atualiza cache E salva no localStorage
- `carregarDados()` - Carrega dados do localStorage (uso interno)

**Cache em memória:**
```javascript
let dadosUsuario = null;  // Cache privado

export function getDadosUsuario() {
  if (!dadosUsuario) {
    dadosUsuario = carregarDados();  // Carrega do localStorage APENAS na primeira vez
  }
  return dadosUsuario;  // Retorna do cache nas próximas chamadas
}
```

### 3. Camada de UI (UI Layer)
**Arquivos:** `js/app.js`, `js/report.js`, `js/calc.js`

**Responsabilidade:** Renderizar dados na interface.

**Regra de ouro:** ⚠️ **NUNCA acessar localStorage diretamente!**

## 🔄 Fluxo de Dados

### 📥 Carregamento Inicial (Page Load)

```
1. DOMContentLoaded
   ↓
2. carregarDados()  ← storage.js → localStorage
   ↓
3. Cache em memória (dadosUsuario)
   ↓
4. Renderiza UI com getDadosUsuario()
```

### 📝 Registro de Pontos (User Action)

```
1. Usuário digita pontos
   ↓
2. validarESubmeterPontos()
   ↓
3. const dados = getDadosUsuario()  ← Cache em memória (SEM localStorage)
   ↓
4. Modifica dados.realizadoTotal
   ↓
5. atualizarDadosUsuario(dados)
   ├─→ Atualiza cache
   └─→ storage.js → localStorage
   ↓
6. iniciarDashboard() → Re-renderiza UI
```

### 🔄 Sincronização Entre Abas

```
Aba 1: Usuário registra pontos
   ↓
atualizarDadosUsuario() → localStorage
   ↓
window.storage event ⚡
   ↓
Aba 2: Detecta mudança
   ↓
sincronizarDadosDeOutraAba()
   ├─→ Atualiza cache
   └─→ Re-renderiza UI
```

## ✅ Componentes Usando Corretamente o Data Layer

### Círculo de Progresso
```javascript
// ✅ CORRETO - Usa getDadosUsuario()
export function iniciarDashboard(nome) {
  const dadosUsuario = getDadosUsuario();  // Cache em memória
  const resultado = calcularEAtualizarDashboard(dadosUsuario);
  atualizarGraficoCircular(resultado.percentualProgresso, ...);
}
```

### Barra de Progresso / Dashboard
```javascript
// ✅ CORRETO - Usa getDadosUsuario()
export function atualizarUIDashboard(resultados) {
  const dadosUsuario = getDadosUsuario();  // Cache em memória
  
  PontotalElement.textContent = dadosUsuario.realizadoTotal;
  metaMensalElement.textContent = dadosUsuario.metaMensal;
  // ... etc
}
```

### Relatórios (report.html)
```javascript
// ✅ CORRETO - Usa getDadosUsuario()
function renderReport() {
  const dados = safeGetDadosUsuario();  // Wrapper de getDadosUsuario()
  
  // Renderiza tabela, gráficos, análises...
}
```

### Simulação
```javascript
// ✅ CORRETO - Usa getDadosUsuario()
function executarCalculoRapidoSimulacao(pontoAdicionado) {
  const dadosUsuario = getDadosUsuario();  // Cache em memória
  
  const dadosSimulados = {
    metaMensal: dadosUsuario.metaMensal,
    // ...
  };
}
```

## ⚠️ Acessos Diretos ao localStorage (Apropriados)

Existem poucos casos onde acessar `localStorage` diretamente é apropriado:

### 1. Configurações de Preferências do App
```javascript
// ✅ APROPRIADO - Preferências do app, não dados do usuário
localStorage.getItem("feedbackSom")
localStorage.getItem("feedbackVibracao")
localStorage.getItem("tema")
```

### 2. Verificação de Primeiro Acesso
```javascript
// ✅ APROPRIADO - Verifica antes de inicializar o data layer
const primeiroAcesso = !localStorage.getItem(`${STORAGE_PREFIX}${nome}`);
```

### 3. Sincronização Entre Abas
```javascript
// ✅ APROPRIADO - Comunicação entre abas requer localStorage
window.addEventListener("storage", (evento) => {
  if (evento.key === chaveAtual) {
    // Sincronizar...
  }
});
```

## 🚫 Padrões INCORRETOS (Evitar)

### ❌ ERRADO - Acessar localStorage diretamente na UI
```javascript
// ❌ NÃO FAÇA ISSO!
function renderizarDashboard() {
  const dados = JSON.parse(localStorage.getItem("dados_usuario"));
  // ...
}
```

### ✅ CORRETO - Usar data layer
```javascript
// ✅ FAÇA ASSIM!
function renderizarDashboard() {
  const dados = getDadosUsuario();  // Usa cache em memória
  // ...
}
```

## 📊 Performance

### Benefícios do Cache em Memória

| Operação | Sem Cache | Com Cache |
|----------|-----------|-----------|
| Primeira leitura | ~1ms (localStorage) | ~1ms (localStorage) |
| Leituras seguintes | ~1ms × N | ~0.001ms (memória) |
| **Total (100 leituras)** | **~100ms** | **~1.1ms** |

**Ganho de performance: ~90x mais rápido!** 🚀

### Quando o Cache é Atualizado

1. ✅ Na primeira chamada a `getDadosUsuario()` (carrega do localStorage)
2. ✅ Quando `atualizarDadosUsuario()` é chamado (atualiza cache + localStorage)
3. ✅ Quando outra aba salva dados (sincronização automática)
4. ✅ Quando usuário faz logout/login (limpa e recarrega cache)

## 🔍 Verificação Rápida

### Como verificar se um componente usa corretamente o data layer:

1. Procure por `getDadosUsuario()` ✅
2. Procure por `localStorage.getItem()` com chave de dados ❌
3. Procure por `atualizarDadosUsuario()` para salvar ✅
4. Procure por `localStorage.setItem()` com chave de dados ❌

## 📝 Resumo

- ✅ **Todos os componentes UI** usam o data layer corretamente
- ✅ **Cache em memória** evita leituras repetidas do localStorage
- ✅ **Sincronização entre abas** funciona automaticamente
- ✅ **Backup automático** protege contra perda de dados
- ✅ **Arquitetura limpa** facilita manutenção e testes

**Conclusão:** A aplicação JÁ está corretamente implementada. Não há "backend" - é uma PWA que usa localStorage. Todos os componentes de UI (círculo de progresso, barra, relatórios, simulações) **já usam o data layer** ao invés de acessar localStorage diretamente.

# 🏗️ ARQUITETURA DO MD-FOCUS (Refatorado - Nov 2025)

## 📁 Estrutura de Arquivos JavaScript

```
js/
├── constants.js        # ⚙️ Constantes centralizadas
├── storage.js          # 🛡️ Proteções de localStorage
├── notifications.js    # 📢 Sistema de notificações
├── data.js            # 📊 Gerenciamento de dados (REFATORADO)
├── app.js             # 🎯 Controlador principal (REFATORADO)
├── validation.js      # ✅ Validações de entrada
├── calc.js            # 🧮 Cálculos e dashboard
├── ui.js              # 🎨 Utilitários de UI
├── history.js         # 📜 Histórico e comandos
└── report.js          # 📈 Relatórios e análises
```

---

## 🎯 Conceito de Separação de Responsabilidades

### 🆕 **constants.js** - Configurações Centralizadas

**Responsabilidade:** Armazenar TODOS os valores mágicos da aplicação

- ✅ Chaves de localStorage
- ✅ Limites de validação
- ✅ Tempos de notificação
- ✅ Breakpoints responsivos
- ✅ Mensagens de erro/sucesso
- ✅ Mapeamento de metas
- ✅ Configurações de tema

**Benefícios:**

- 🔧 Mudanças globais em um único lugar
- 📖 Documentação clara de todos os valores
- 🧪 Facilita testes unitários
- 🌍 Preparado para internacionalização

---

### 🛡️ **storage.js** - Camada de Proteção

**Responsabilidade:** Gerenciar TODO acesso ao localStorage com segurança

**Proteções implementadas:**

1. ✅ Try-catch automático em JSON.parse
2. ✅ Try-catch automático em localStorage.setItem
3. ✅ Sistema de backup automático
4. ✅ Recuperação de erros
5. ✅ Sanitização de dados
6. ✅ Tratamento de QuotaExceededError
7. ✅ Limpeza automática de espaço

**API pública:**

```javascript
// Operações básicas protegidas
obterItem(chave); // GET com proteção JSON.parse
salvarItem(chave, dados); // SET com proteção QuotaExceeded + backup
removerItem(chave); // DELETE da chave e seu backup
obterString(chave); // GET sem parse (para strings simples)
salvarString(chave, valor); // SET sem stringify

// Utilitários
isStorageDisponivel(); // Verifica se localStorage funciona
obterTamanhoStorage(); // Tamanho usado (bytes)
obterTamanhoStorageFormatado(); // Tamanho formatado (KB/MB)
```

**Benefícios:**

- 🧹 Código de negócio limpo (sem try-catch espalhado)
- 🔒 Segurança centralizada
- 🔄 Backup transparente para o resto do código
- 🐛 Fácil debug de problemas de storage

---

### 📢 **notifications.js** - Sistema Unificado

**Responsabilidade:** Centralizar TODAS as notificações do app

**Categorias de notificações:**

1. ✅ Sucesso (verde)
2. ❌ Erro (vermelho)
3. ⚠️ Aviso (amarelo)
4. ℹ️ Info (azul)

**API pública:**

```javascript
// Notificações genéricas
notificarSucesso(msg, tempo);
notificarErro(msg, tempo);
notificarAviso(msg, tempo);
notificarInfo(msg, tempo);

// Notificações específicas
notificarPontosRegistrados(valor);
notificarNomeInvalido();
notificarStorageQuaseCheio();
notificarSincronizado();

// Diálogos de confirmação
confirmar({ texto, aoConfirmar, aoCancelar });
confirmarLogout(aoConfirmar);
confirmarResetDados(aoConfirmar);
confirmarLeituraPolitica(aoConfirmar, aoCancelar);
```

**Benefícios:**

- 🎨 Consistência visual
- 🌍 Fácil tradução futura
- 📝 Mensagens padronizadas
- ⏱️ Controle centralizado de timing

---

### 📊 **data.js** - Gerenciamento de Dados (REFATORADO)

**Responsabilidade:** Lógica de negócio para dados do usuário

**O QUE FOI REMOVIDO:**

- ❌ Try-catch (delegado ao storage.js)
- ❌ Sanitização manual (delegado ao storage.js)
- ❌ Backup manual (delegado ao storage.js)
- ❌ Tratamento de QuotaExceeded (delegado ao storage.js)

**O QUE PERMANECE (responsabilidade única):**

- ✅ Gerenciar usuário atual
- ✅ Carregar/salvar dados
- ✅ Reset mensal automático
- ✅ Criar dados iniciais
- ✅ Gerenciar observações
- ✅ Gerenciar dias agendados
- ✅ Cache em memória

**Antes vs Depois:**

```javascript
// ❌ ANTES: 300+ linhas, muito try-catch, responsabilidades misturadas
export function salvarDados(dados) {
  const chave = getChaveDadosUsuario();
  const dadosSanitizados = sanitizarDados(dados); // sanitização manual
  const dadosJSON = JSON.stringify(dadosSanitizados);

  try {
    localStorage.setItem(chave, dadosJSON);
    try {
      localStorage.setItem(chave + "_backup", dadosJSON);
    } catch (backupError) {
      console.warn("Backup falhou");
    }
  } catch (error) {
    if (error.name === "QuotaExceededError") {
      // 20 linhas de tratamento...
    }
  }
}

// ✅ DEPOIS: 200 linhas, código limpo, responsabilidade única
export function salvarDados(dados) {
  const chave = getChaveDadosUsuario();
  if (!chave) return;

  // storage.js cuida de TUDO (sanitização, try-catch, backup, quota)
  const sucesso = salvarItem(chave, dados, true);

  if (sucesso) {
    dadosUsuario = dados;
  }
}
```

---

### 🎯 **app.js** - Controlador Principal (REFATORADO)

**Responsabilidade:** Orquestrar a aplicação

**Melhorias implementadas:**

- ✅ Imports organizados por categoria
- ✅ Comentários em seções
- ✅ Funções pequenas e focadas
- ✅ Usa módulos de notificação
- ✅ Usa constantes centralizadas
- ✅ Separação clara de responsabilidades

**Estrutura organizada:**

```javascript
// IMPORTS (organizados)
// ESTADO DA APLICAÇÃO
// INICIALIZAÇÃO
// CONFIGURAÇÃO DE CADASTRO
// DASHBOARD
// TEMA
// RESPONSIVIDADE
// SINCRONIZAÇÃO ENTRE ABAS
```

---

## 🔄 Fluxo de Dados Refatorado

### **Salvamento de Dados**

```
app.js (UI event)
    ↓
data.js (lógica de negócio)
    ↓
storage.js (proteções)
    ↓
localStorage (navegador)
```

### **Notificações**

```
app.js / data.js / calc.js (evento)
    ↓
notifications.js (formatação)
    ↓
notie.js (exibição)
```

### **Configurações**

```
constants.js (valores)
    ↓
data.js / validation.js / storage.js (uso)
```

---

## 📊 Métricas da Refatoração

### **Antes:**

- ❌ 7 arquivos JS
- ❌ Código repetido (try-catch, notificações)
- ❌ Números mágicos espalhados
- ❌ Mensagens hardcoded
- ❌ Difícil manutenção

### **Depois:**

- ✅ 10 arquivos JS (mais modularizado)
- ✅ Código DRY (Don't Repeat Yourself)
- ✅ Constantes centralizadas
- ✅ Notificações unificadas
- ✅ Fácil manutenção
- ✅ Preparado para crescimento

---

## 🛡️ Sistema de Proteções Completo

| Proteção            | Módulo        | Status          |
| ------------------- | ------------- | --------------- |
| JSON.parse error    | storage.js    | ✅ Implementado |
| QuotaExceededError  | storage.js    | ✅ Implementado |
| Backup automático   | storage.js    | ✅ Implementado |
| Sanitização         | storage.js    | ✅ Implementado |
| Múltiplas abas      | app.js        | ✅ Implementado |
| Reset mensal        | data.js       | ✅ Implementado |
| Validação de inputs | validation.js | ✅ Implementado |

---

## 🎓 Boas Práticas Aplicadas

1. ✅ **Single Responsibility Principle** - Cada módulo tem UMA responsabilidade
2. ✅ **DRY (Don't Repeat Yourself)** - Código reutilizável
3. ✅ **Separation of Concerns** - UI / Lógica / Storage separados
4. ✅ **Defensive Programming** - Proteções em camadas
5. ✅ **Clean Code** - Nomes claros, funções pequenas
6. ✅ **Documentation** - JSDoc completo
7. ✅ **Error Handling** - Try-catch centralizado
8. ✅ **Constants Over Magic Numbers** - Valores nomeados

---

## 🚀 Benefícios da Refatoração

### Para Desenvolvimento:

- 🧹 Código mais limpo e legível
- 🔧 Manutenção simplificada
- 🐛 Debug mais fácil
- 🧪 Testável (funções puras)
- 📖 Documentação integrada

### Para Usuário:

- 🛡️ Mais seguro (proteções robustas)
- ⚡ Performance mantida
- 🔄 Sincronização entre abas
- 💾 Backup automático
- ⚠️ Mensagens claras de erro

### Para Futuro:

- 🌍 Preparado para tradução
- 📱 Fácil adicionar features
- 🎨 Fácil trocar notie.js por outro
- 💾 Fácil trocar localStorage por IndexedDB
- 🧩 Módulos reutilizáveis

---

## 📝 Como Usar os Novos Módulos

### Exemplo 1: Salvar dados com proteção

```javascript
// ❌ ANTES
try {
  localStorage.setItem("chave", JSON.stringify(dados));
} catch (error) {
  // tratamento...
}

// ✅ DEPOIS
import { salvarItem } from "./storage.js";
salvarItem("chave", dados); // proteção automática
```

### Exemplo 2: Notificar usuário

```javascript
// ❌ ANTES
notie.alert({
  type: "success",
  text: "✅ Dados salvos!",
  time: 3,
});

// ✅ DEPOIS
import { notificarSucesso } from "./notifications.js";
notificarSucesso("✅ Dados salvos!");
```

### Exemplo 3: Usar constantes

```javascript
// ❌ ANTES
if (nome.length < 3 || nome.length > 10) { ... }

// ✅ DEPOIS
import { NOME_MIN_LENGTH, NOME_MAX_LENGTH } from "./constants.js";
if (nome.length < NOME_MIN_LENGTH || nome.length > NOME_MAX_LENGTH) { ... }
```

---

## 🎯 Conclusão

A refatoração transformou o MD-Focus em um aplicativo:

- 🏗️ Bem arquitetado
- 🛡️ Seguro e robusto
- 🧹 Limpo e manutenível
- 📖 Bem documentado
- 🚀 Preparado para crescer

**Linha de código reduzida com proteções aumentadas!** ✨

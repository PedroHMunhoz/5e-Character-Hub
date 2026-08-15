# D&D 5e Character Sheet App

🇧🇷 [Português](#-português) | 🇬🇧 [English](#-english)

---

## 🇧🇷 Português

Aplicativo universal (iOS, Android e Web) para criação e gerenciamento de fichas de personagem de **Dungeons & Dragons 5ª Edição (regras de 2014)**, com interface totalmente localizada em **Português do Brasil**. Construído com [Expo](https://expo.dev) e React Native.

### Sobre o projeto

O app oferece um assistente (wizard) guiado para criação de personagens seguindo as regras oficiais, e uma ficha de personagem completa e navegável por abas para uso durante as sessões de jogo. Todo o conteúdo de regras (classes, raças, magias, itens, antecedentes, etc.) fica em um banco de dados SQLite embarcado no próprio app, consultado localmente — sem depender de internet ou de um backend.

### Funcionalidades

- **Assistente de criação de personagem**, passo a passo:
  - Raça (com sub-raças e bônus de atributo)
  - Atributos (rolagem 4d6, standard array ou point buy)
  - Classe
  - Antecedente
  - Equipamento inicial
  - Magias (para classes conjuradoras)
  - Detalhes finais (nome, aparência, biografia)
- **Ficha de personagem** em abas:
  - **Resumo**: pontos de vida, testes de morte, inspiração, classe de armadura, bônus de proficiência, deslocamento e sentidos passivos
  - **Atributos**: perícias, testes de resistência, proficiência em ferramentas
  - **Inventário**: equipar/desequipar itens, gerenciar quantidade de itens empilháveis, gerenciar moedas, cálculo de capacidade de carga
  - **Magias**: espaços de magia, magias preparadas/conhecidas, detalhes de cada magia
  - **Características**: características de classe, subclasse e traços raciais
- **Banco de dados de referência local** (SQLite + busca em texto completo via FTS5), gerado por um pipeline de importação próprio a partir de dados fornecidos pelo usuário.
- **Camada de tradução PT-BR** separada dos dados de referência, para que as traduções sobrevivam a reimportações do banco.
- **Banco de dados de personagens** separado e persistente, independente do banco de referência — os personagens criados não são afetados por uma futura reimportação de dados de regras.

### Tecnologias

- [Expo](https://expo.dev) SDK 54
- React Native 0.81 (New Architecture habilitada)
- React 19
- [Expo Router](https://docs.expo.dev/router/introduction/) (roteamento baseado em arquivos)
- [expo-sqlite](https://docs.expo.dev/versions/v54.0.0/sdk/sqlite/)
- TypeScript
- Estado gerenciado via React Context (sem Redux/Zustand)

### Estrutura do projeto

```
app/            Rotas (Expo Router): wizard de criação e ficha de personagem
components/     Componentes de UI (ficha, wizard, primitivas compartilhadas)
context/        Providers de estado (personagem, banco de personagens, wizard)
data/           Consultas ao banco de referência e lógica de montagem de personagem
db/             Schema SQL do banco de referência e correções versionadas
scripts/        Pipeline de importação de dados e tradução
constants/      Constantes de regras do jogo
hooks/          Hooks compartilhados
utils/          Funções utilitárias (cálculos de regras, dados, etc.)
types/          Tipos TypeScript (personagem, dados de referência)
docs/           Documentação técnica do schema e backlog do projeto
```

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20 LTS ou superior
- npm (o projeto usa `package-lock.json`)
- Um dispositivo/emulador com o app [Expo Go](https://expo.dev/go) instalado, **ou** um dev client/emulador configurado

### Como executar

```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npx expo start
```

No terminal, o Expo mostrará opções para abrir o app em um build de desenvolvimento, emulador Android, simulador iOS ou no Expo Go. Também é possível usar diretamente:

```bash
npm run android   # abre no Android
npm run ios       # abre no iOS
npm run web       # abre no navegador
```

### ⚠️ Banco de dados e pipeline de conteúdo

O app lê o conteúdo de regras (classes, raças, magias, itens etc.) de um banco SQLite embarcado em `assets/data/dnd5e.db`, referenciado como asset estático pelo código. **Sem esse arquivo, o app não builda.**

Esse banco, junto com as pastas de dados-fonte (`5e-2014-data/` e `translations/`), está no `.gitignore` e **não é versionado neste repositório** — cada pessoa que for rodar o projeto precisa fornecer seus próprios arquivos de dados. Apenas o *código* do pipeline é versionado:

| Arquivo | Função |
| --- | --- |
| `db/schema.sql` | Schema do banco de referência |
| `scripts/import-5e-data.mjs` | Lido por `npm run db:import` |
| `scripts/import-translations.mjs` | Lido por `npm run db:translate` |

Para gerar seu próprio banco local:

1. Monte um dump de dados de regras no formato esperado por `scripts/import-5e-data.mjs` e coloque em `5e-2014-data/` na raiz do projeto.
2. Rode `npm run db:import` para compilar `assets/data/dnd5e.db`.
3. (Opcional) Para incluir traduções em PT-BR, monte arquivos de tradução em `translations/pt-BR/` seguindo a estrutura descrita em [`docs/data-schema.md`](docs/data-schema.md), e rode `npm run db:translate`.

Consulte [`docs/data-schema.md`](docs/data-schema.md) para o detalhamento técnico completo do schema e do mecanismo de tradução.

### Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `npm start` | Inicia o servidor de desenvolvimento do Expo |
| `npm run android` | Inicia o app no Android |
| `npm run ios` | Inicia o app no iOS |
| `npm run web` | Inicia o app no navegador |
| `npm run lint` | Executa o linter (`expo lint`) |
| `npm run format` | Formata o código com Prettier |
| `npm run format:check` | Verifica a formatação sem alterar arquivos |
| `npm run db:import` | Gera o banco de dados de referência a partir de `5e-2014-data/` |
| `npm run db:translate` | Popula as traduções PT-BR a partir de `translations/pt-BR/` |

### Status do projeto

O desenvolvimento está focado, por ora, no conteúdo do Livro do Jogador (PHB). A classe Patrulheiro (Ranger) está temporariamente bloqueada devido a inconsistências na edição impressa em PT-BR, e recursos como multiclasse e evolução de nível ainda não têm interface própria. O backlog detalhado é mantido em [`docs/TODO.md`](docs/TODO.md).

### Aviso legal

Dungeons & Dragons, D&D 5e e todo o conteúdo de regras associado são propriedade da Wizards of the Coast. Este é um projeto pessoal e não-oficial, sem fins comerciais e sem qualquer afiliação com a Wizards of the Coast. Este repositório não distribui conteúdo de regras ou de livros — os dados de jogo e as traduções ficam fora do controle de versão (veja a seção sobre o pipeline de dados acima).

---

## 🇬🇧 English

A universal app (iOS, Android and Web) for creating and managing character sheets for **Dungeons & Dragons 5th Edition (2014 rules)**, fully localized into **Brazilian Portuguese**. Built with [Expo](https://expo.dev) and React Native.

### About

The app provides a guided wizard for creating characters following the official rules, and a full, tab-based character sheet for use at the table. All rules content (classes, races, spells, items, backgrounds, etc.) lives in a SQLite database bundled with the app and queried locally — no internet connection or backend required.

### Features

- **Character creation wizard**, step by step:
  - Race (with subraces and ability score bonuses)
  - Ability scores (4d6 roll, standard array, or point buy)
  - Class
  - Background
  - Starting equipment
  - Spells (for spellcasting classes)
  - Final details (name, appearance, biography)
- **Tab-based character sheet**:
  - **Summary**: hit points, death saves, inspiration, armor class, proficiency bonus, speed, and passive senses
  - **Attributes**: skills, saving throws, tool proficiencies
  - **Inventory**: equip/unequip items, manage quantity of stackable items, manage currency, carrying capacity calculation
  - **Spells**: spell slots, prepared/known spells, spell details
  - **Features**: class, subclass, and racial features
- **Local reference database** (SQLite + full-text search via FTS5), generated by a custom import pipeline from data the user provides.
- **PT-BR translation layer** kept separate from the reference data, so translations survive database re-imports.
- **Separate, persistent character database**, independent from the reference database — created characters are unaffected by a future re-import of rules data.

### Tech Stack

- [Expo](https://expo.dev) SDK 54
- React Native 0.81 (New Architecture enabled)
- React 19
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- [expo-sqlite](https://docs.expo.dev/versions/v54.0.0/sdk/sqlite/)
- TypeScript
- State managed via React Context (no Redux/Zustand)

### Project Structure

```
app/            Routes (Expo Router): creation wizard and character sheet
components/     UI components (sheet, wizard, shared primitives)
context/        State providers (character, character database, wizard)
data/           Reference database queries and character assembly logic
db/             Reference database SQL schema and versioned overrides
scripts/        Data import and translation pipeline
constants/      Game rules constants
hooks/          Shared hooks
utils/          Utility functions (rules calculations, dice, etc.)
types/          TypeScript types (character, reference data)
docs/           Technical schema documentation and project backlog
```

### Prerequisites

- [Node.js](https://nodejs.org/) 20 LTS or newer
- npm (the project uses `package-lock.json`)
- A device/emulator with the [Expo Go](https://expo.dev/go) app installed, **or** a configured dev client/emulator

### Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

The terminal output will show options to open the app in a development build, Android emulator, iOS simulator, or Expo Go. You can also use directly:

```bash
npm run android   # open on Android
npm run ios       # open on iOS
npm run web       # open in the browser
```

### ⚠️ Database & Content Pipeline

The app reads rules content (classes, races, spells, items, etc.) from a SQLite database bundled at `assets/data/dnd5e.db`, referenced as a static asset by the code. **Without this file, the app will not build.**

This database, along with the source data folders (`5e-2014-data/` and `translations/`), is listed in `.gitignore` and is **not versioned in this repository** — anyone running the project needs to supply their own data files. Only the pipeline *code* is versioned:

| File | Purpose |
| --- | --- |
| `db/schema.sql` | Reference database schema |
| `scripts/import-5e-data.mjs` | Run via `npm run db:import` |
| `scripts/import-translations.mjs` | Run via `npm run db:translate` |

To generate your own local database:

1. Assemble a rules data dump in the format expected by `scripts/import-5e-data.mjs` and place it in `5e-2014-data/` at the project root.
2. Run `npm run db:import` to compile `assets/data/dnd5e.db`.
3. (Optional) To include PT-BR translations, assemble translation files under `translations/pt-BR/` following the structure described in [`docs/data-schema.md`](docs/data-schema.md), then run `npm run db:translate`.

See [`docs/data-schema.md`](docs/data-schema.md) for the full technical breakdown of the schema and the translation mechanism.

### Available Scripts

| Script | Description |
| --- | --- |
| `npm start` | Starts the Expo development server |
| `npm run android` | Starts the app on Android |
| `npm run ios` | Starts the app on iOS |
| `npm run web` | Starts the app in the browser |
| `npm run lint` | Runs the linter (`expo lint`) |
| `npm run format` | Formats the code with Prettier |
| `npm run format:check` | Checks formatting without modifying files |
| `npm run db:import` | Builds the reference database from `5e-2014-data/` |
| `npm run db:translate` | Populates PT-BR translations from `translations/pt-BR/` |

### Project Status

Development currently focuses on Player's Handbook (PHB) content. The Ranger class is temporarily blocked due to inconsistencies in the printed PT-BR edition, and features like multiclassing and level-up flows don't have a UI yet. The detailed backlog is tracked in [`docs/TODO.md`](docs/TODO.md).

### Legal Disclaimer

Dungeons & Dragons, D&D 5e, and all associated rules content are property of Wizards of the Coast. This is a personal, unofficial, non-commercial project with no affiliation to Wizards of the Coast. This repository does not distribute any rules or book content — game data and translations are kept out of version control (see the database pipeline section above).

# Guia de Implantação — Google Cloud Run

Este documento define os requisitos e o processo de implantação em contêineres de produção no Google Cloud Run.

---

## 1. Configuração de Rede e Portas

- **Porta de Execução**: `3000` (padrão obrigatório da infraestrutura de contêineres).
- **Host**: `0.0.0.0` (acessível através do proxy reverso de borda).

---

## 2. Processo de Build de Produção

O comando de build é padronizado no `package.json`:

```bash
npm run build
```

Este comando executa duas etapas fundamentais:
1. `vite build`: Compila a aplicação React 19 em arquivos estáticos otimizados na pasta `dist/`.
2. `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`: Empacota o backend Express em um único arquivo CommonJS autônomo em `dist/server.cjs`.

---

## 3. Inicialização de Produção

```bash
npm start
```

Executa `node dist/server.cjs`, iniciando o servidor Express na porta 3000, servindo os arquivos estáticos de `dist/` para a SPA e expondo as rotas de API `/api/*`.

---

## 4. Variáveis de Ambiente Necessárias

| Variável | Descrição | Onde Configurar |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Chave de acesso à API Gemini no Google AI Studio | Injetada automaticamente pelo AI Studio Secrets |
| `NODE_ENV` | `production` em produção | Configurado no contêiner Cloud Run |

# Segurança e Proteção de Dados — NutriMacro

Este documento define os controles de segurança, isolamento de inquilinos (*tenant isolation*), sanitização de entradas e proteção de segredos.

---

## 1. Gestão de Segredos

- A variável de ambiente `GEMINI_API_KEY` é estritamente de servidor e **nunca é prefixada com `VITE_`** ou incluída nos bundles de JavaScript enviados ao navegador.
- O SDK `@google/genai` é inicializado de forma tardia (*lazy initialization*) no arquivo `server.ts`.
- O cliente web se comunica exclusivamente com rotas intermediárias `/api/*`.

---

## 2. Isolamento de Usuários (Least Privilege)

- Toda refeição, medição corporal e fotografia é associada ao identificador único do usuário (`userId`).
- Consultas nos repositórios filtram rigorosamente pelo usuário ativo:
  $$\text{Usuário A} \neq \text{Dados do Usuário B}$$
- Operações de escrita e exclusão exigem confirmação explícita no cliente antes do disparo.

---

## 3. Prevenção Contra Prompt Injection

- Textos fornecidos pelo usuário no chat ou nomes de alimentos são passados como dados ou parâmetros estruturados.
- As instruções de sistema (*System Instructions*) no Gemini são isoladas do conteúdo do usuário.
- O modelo é instruído estritamente a não executar comandos de sistema ou modificar permissões com base no texto recebido.

---

## 4. Privacidade e LGPD

- O sistema inclui suporte à portabilidade e exportação integral de dados (`POST /api/export`) nos formatos JSON e CSV.
- Dados de saúde e bem-estar não contêm diagnósticos clínicos e trazem avisos explícitos de responsabilidade.

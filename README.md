# Sistema de Triagem de Chamados de TI — SEDEL

**Trabalho de Conclusão de Curso (TCC) em Engenharia da Computação**

Sistema de triagem e gerenciamento de chamados de TI desenvolvido para a Secretaria de Estado do Desporto e Lazer (SEDEL), com foco na classificação de problemas técnicos e no encaminhamento das solicitações para os níveis de suporte responsáveis.

## Sobre o projeto

O Sistema de Triagem de Chamados de TI para a SEDEL é um projeto prático desenvolvido como Trabalho de Conclusão de Curso em Engenharia da Computação.

Inspirado em sistemas de gerenciamento de serviços de TI, como o GLPI, o projeto tem como objetivo organizar e otimizar o fluxo de atendimento técnico por meio da classificação dos chamados em três níveis de suporte: N1, N2 e N3.

A proposta é permitir que as solicitações sejam direcionadas de acordo com a complexidade do problema, contribuindo para uma melhor distribuição das demandas entre os profissionais de TI e para a organização do processo de atendimento.

## Objetivos

- Automatizar a triagem inicial de chamados de TI.
- Classificar os problemas técnicos conforme sua complexidade.
- Encaminhar os chamados para o nível de suporte adequado.
- Melhorar a organização e a distribuição das solicitações.
- Otimizar o fluxo de atendimento e a gestão dos chamados.

## Níveis de suporte

O sistema organiza os chamados em três níveis de atendimento:

### N1 — Suporte de primeiro nível

Responsável pelo atendimento inicial e pela resolução de problemas simples, que podem ser tratados por estagiários ou profissionais de suporte de primeiro nível.

Exemplos:
- Dificuldades de acesso a sistemas.
- Problemas básicos de configuração.
- Dúvidas relacionadas à utilização de recursos de TI.

### N2 — Suporte de segundo nível

Responsável pelo atendimento de problemas de complexidade intermediária, que exigem conhecimentos técnicos mais específicos ou procedimentos adicionais de diagnóstico.

Exemplos:
- Problemas de configuração de rede.
- Falhas de software que exigem análise técnica.
- Problemas que não puderam ser resolvidos no N1.

### N3 — Suporte de terceiro nível

Responsável pelo atendimento de problemas de alta complexidade, que exigem conhecimento técnico especializado e uma análise mais aprofundada.

Exemplos:
- Falhas críticas de infraestrutura.
- Problemas complexos de servidores e redes.
- Incidentes que exigem intervenção especializada.

## Funcionalidades propostas

- **Triagem de chamados:** classificação das solicitações de suporte.
- **Encaminhamento por nível:** direcionamento dos chamados para N1, N2 ou N3.
- **Organização das demandas:** separação das solicitações conforme a complexidade.
- **Gestão de chamados:** estrutura para acompanhamento das solicitações de suporte.
- **Interface web:** ambiente para interação com o sistema.

## Tecnologias utilizadas

| Tecnologia | Aplicação |
|---|---|
| HTML | Estrutura das interfaces web |
| Supabase | Backend e integração com banco de dados |
| PostgreSQL | Banco de dados relacional |

## Estrutura do projeto

```text
Bot-Atendimento-TI-SEDEL/
├── backend/
├── index.html
├── login.html
├── adms.html
├── .gitignore
└── README.md
```

- `backend/`: estrutura destinada às funcionalidades de backend.
- `index.html`: interface principal da aplicação.
- `login.html`: interface de autenticação.
- `adms.html`: interface administrativa.
- `.gitignore`: arquivos e diretórios ignorados pelo Git.
- `README.md`: documentação do projeto.

## Contexto acadêmico

Este projeto foi desenvolvido como Trabalho de Conclusão de Curso em Engenharia da Computação, aplicando conhecimentos relacionados ao desenvolvimento de sistemas, automação de processos, integração com banco de dados e gerenciamento de serviços de TI.

A proposta busca demonstrar como a classificação e o encaminhamento de chamados podem contribuir para a melhoria dos processos de suporte técnico em uma organização.

## Instituição

**SEDEL — Secretaria de Estado do Desporto e Lazer**

Projeto acadêmico desenvolvido no contexto da Engenharia da Computação.

---

Desenvolvido como projeto de TCC em Engenharia da Computação.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// ─── BANCO DE DADOS (POSTGRESQL / SUPABASE) ─────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function inicializarBanco() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chamados (
        id SERIAL PRIMARY KEY,
        numero TEXT UNIQUE,
        solicitante TEXT,
        setor TEXT,
        nivel TEXT,
        prazo TEXT,
        descricao TEXT,
        status TEXT DEFAULT 'Pendente',
        data_abertura TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL
      )
    `);

    // Garante um usuário admin padrão caso o banco tenha sido criado do zero
    await pool.query(`
      INSERT INTO usuarios (email, senha)
      VALUES ('admin@sedel.am.gov.br', 'admin123')
      ON CONFLICT (email) DO NOTHING
    `);

    console.log('📦 Conectado ao PostgreSQL (Supabase) e tabelas verificadas.');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco de dados:', err.message);
  }
}

inicializarBanco();

// ─── CONFIGURAÇÃO DOS NÍVEIS DE SUPORTE ─────────────────────────────────────
const niveisSuporteConfig = {
  N1: {
    nome: 'Suporte Nível 1',
    descricao: 'Problemas de software, configurações básicas, e-mail e desempenho',
    prazo: 'em até 30 minutos',
    cor: '#22c55e',
    palavrasChave: [
      'office', 'word', 'excel', 'powerpoint', 'software', 'programa', 'instalar',
      'desinstalar', 'antivírus', 'windows', 'atualização', 'driver', 'bluetooth',
      'audio', 'som', 'microfone', 'webcam', 'câmera', 'pen drive', 'usb',
      'lento', 'travando', 'devagar', 'pasta da rede', 'mapear', 'wifi', 'travado'
    ]
  },
  N2: {
    nome: 'Suporte Nível 2',
    descricao: 'Falhas de hardware, conectividade de rede local e sistemas internos',
    prazo: 'em até 20 minutos',
    cor: '#f59e0b',
    palavrasChave: [
      'hardware', 'teclado', 'mouse', 'monitor', 'tela', 'não liga', 'desliga sozinho',
      'servidor', 'siged', 'sistema', 'acesso bloqueado', 'senha', 'switch',
      'domínio', 'impressora', 'login', 'usuário bloqueado', 'permissão',
      'sigef', 'sisp', 'sefin', 'rede', 'sei', 'sgp', 'sistema interno',
      'sistema da secretaria', 'papel', 'ponto eletrônico', 'contracheque',
      'senha do windows', 'erro', 'senha expirou', 'trocar senha do windows',
      'imprimir', 'toner', 'impressão', 'não imprime',
      'internet', 'não carrega', 'página não abre'
    ]
  },
  N3: {
    nome: 'Suporte Nível 3',
    descricao: 'Incidentes críticos: infraestrutura de servidores, banco de dados e segurança',
    prazo: 'em até 10 minutos',
    cor: '#ef4444',
    palavrasChave: [
      'servidor caiu', 'banco de dados', 'dados corrompidos',
      'ransomware', 'vírus', 'hackeado', 'secretario', 'gabinete', 'restore',
      'sistema fora do ar', 'sem acesso', 'crítico', 'urgente', 'emergência',
      'falha geral', 'rede toda', 'secretaria inteira'
    ]
  }
};

// ─── FUNÇÕES AUXILIARES ─────────────────────────────────────────────────────
function normalizarTexto(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function analisarChamado(mensagem) {
  const texto = normalizarTexto(mensagem);

  for (const nivel of [3, 2, 1]) {
    const config = niveisSuporteConfig[`N${nivel}`];
    if (config.palavrasChave.some((kw) => texto.includes(normalizarTexto(kw)))) {
      return { nivel, config };
    }
  }

  return { nivel: -1 };
}

function gerarNumeroChamado() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `SEDEL-${ano}${mes}${dia}-${rand}`;
}

const sessoes = {};

function obterOuCriarSessao(sessionId) {
  if (!sessoes[sessionId]) {
    sessoes[sessionId] = {
      etapa: 'inicio',
      nome: null,
      setor: null,
      descricaoProblema: null,
      classificacao: null,
      numeroChamado: null
    };
  }
  return sessoes[sessionId];
}

// ─── ROTAS DA API ───────────────────────────────────────────────────────────

// Listar chamados (Painel ADM)
app.get('/api/chamados', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM chamados ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Resolver chamado (Painel ADM)
app.patch('/api/chamados/:id/resolver', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      "UPDATE chamados SET status = 'Resolvido' WHERE id = $1 RETURNING *",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Chamado não encontrado' });
    }

    res.json({ sucesso: true, chamado: rows[0] });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Exportar chamados em CSV
app.get('/api/chamados/exportar', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM chamados ORDER BY id DESC');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio_chamados_sedel.csv');

    const limparCampo = (valor) => String(valor ?? '').replace(/[\r\n;]+/g, ' ').trim();

    const cabecalho = 'ID;Numero_Chamado;Solicitante;Setor;Nivel_Suporte;Prazo;Status;Data_Abertura;Descricao_Problema';
    const linhas = rows.map((c) => [
      c.id,
      c.numero,
      limparCampo(c.solicitante),
      limparCampo(c.setor),
      limparCampo(c.nivel),
      limparCampo(c.prazo),
      limparCampo(c.status),
      limparCampo(c.data_abertura),
      limparCampo(c.descricao)
    ].join(';'));

    res.send('\uFEFF' + [cabecalho, ...linhas].join('\n'));
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Login do Painel ADM
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ sucesso: false, erro: 'E-mail e senha são obrigatórios' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, email FROM usuarios WHERE email = $1 AND senha = $2',
      [email, senha]
    );

    if (rows.length > 0) {
      return res.json({ sucesso: true });
    }

    res.status(401).json({ sucesso: false, erro: 'Credenciais inválidas' });
  } catch (err) {
    console.error('❌ Erro no login:', err.message);
    res.status(500).json({ sucesso: false, erro: 'Erro interno no servidor' });
  }
});

// Fluxo do Bot de Atendimento
app.post('/api/chat', async (req, res) => {
  const { mensagem = '', sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ erro: 'sessionId é obrigatório' });
  }

  const textoMensagem = String(mensagem).trim();
  const sessao = obterOuCriarSessao(sessionId);
  let resposta = '';
  let opcoes = [];
  let tipoChamado = null;

  switch (sessao.etapa) {
    case 'inicio':
      sessao.etapa = 'aguardando_nome';
      resposta = 'Central de Atendimento de TI - SEDEL\n\nPara iniciar o seu atendimento, por favor, informe o seu nome completo:';
      break;

    case 'aguardando_nome':
      sessao.nome = textoMensagem;
      sessao.etapa = 'aguardando_setor';
      resposta = `Solicitante registrado: ${sessao.nome}\n\nPor favor, informe o seu setor ou departamento de trabalho:`;
      break;

    case 'aguardando_setor':
      sessao.setor = textoMensagem;
      sessao.etapa = 'aguardando_problema';
      resposta = `Setor registrado: ${sessao.setor}\n\nPor favor, informe detalhadamente o problema técnico que está enfrentando:`;
      break;

    case 'aguardando_problema': {
      sessao.descricaoProblema = textoMensagem;
      const analise = analisarChamado(textoMensagem);

      if (analise.nivel === -1) {
        sessao.etapa = 'aguardando_detalhes';
        resposta = 'Por favor, forneça mais detalhes sobre o problema para classificação adequada:\n\n• Qual equipamento é afetado (computador, notebook, impressora)?\n• Quando o erro começou a ocorrer?\n• É exibida alguma mensagem ou código de erro específico na tela?';
      } else {
        sessao.classificacao = analise;
        sessao.etapa = 'confirmando_abertura';
        const { config } = analise;
        tipoChamado = `N${analise.nivel}`;

        resposta = `Atendimento Identificado: ${config.nome}\nPrazo estimado: ${config.prazo}\n\nConfirmação de dados do chamado:\n\n• Solicitante: ${sessao.nome}\n• Setor: ${sessao.setor}\n• Classificação: ${config.nome}\n• Prazo estimado: ${config.prazo}\n• Descrição: ${sessao.descricaoProblema}\n\nConfirmar a abertura desta solicitação técnica?`;
        opcoes = ['Confirmar abertura', 'Corrigir informações'];
      }
      break;
    }

    case 'aguardando_detalhes': {
      sessao.descricaoProblema += `\n${textoMensagem}`;
      const analise = analisarChamado(sessao.descricaoProblema);

      sessao.classificacao = analise.nivel === -1
        ? { nivel: 1, config: niveisSuporteConfig.N1 }
        : analise;

      sessao.etapa = 'confirmando_abertura';
      const { config, nivel } = sessao.classificacao;
      tipoChamado = `N${nivel}`;

      resposta = `Confirmação de dados do chamado:\n\n• Solicitante: ${sessao.nome}\n• Setor: ${sessao.setor}\n• Classificação: ${config.nome}\n• Prazo estimado: ${config.prazo}\n• Descrição: ${sessao.descricaoProblema}\n\nConfirmar a abertura do chamado técnico?`;
      opcoes = ['Confirmar abertura', 'Corrigir informações'];
      break;
    }

    case 'confirmando_abertura':
      if (textoMensagem.includes('Confirmar')) {
        sessao.numeroChamado = gerarNumeroChamado();
        sessao.etapa = 'finalizado';
        const { nivel, config } = sessao.classificacao;
        tipoChamado = `N${nivel}`;

        const dataAbertura = new Date().toLocaleString('pt-BR', { timeZone: 'America/Manaus' });

        try {
          await pool.query(
            `INSERT INTO chamados (numero, solicitante, setor, nivel, prazo, descricao, data_abertura)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              sessao.numeroChamado,
              sessao.nome,
              sessao.setor,
              config.nome,
              config.prazo,
              sessao.descricaoProblema,
              dataAbertura
            ]
          );
          console.log(`💾 Chamado ${sessao.numeroChamado} salvo no Supabase com sucesso.`);
        } catch (err) {
          console.error(`❌ Erro ao gravar chamado ${sessao.numeroChamado}:`, err.message);
        }

        resposta = `Chamado registrado com sucesso.\n\n• Número do chamado: \`${sessao.numeroChamado}\`\n• Solicitante: ${sessao.nome}\n• Setor: ${sessao.setor}\n• Classificação: ${config.nome}\n• Prazo de atendimento: ${config.prazo}\n\nDescrição do Incidente:\n${sessao.descricaoProblema}\n\nPor favor, guarde o número do chamado para fins de acompanhamento. A equipe técnica entrará em contato.`;
      } else {
        sessao.etapa = 'aguardando_nome';
        resposta = 'Por favor, reinicie o preenchimento dos dados informando o seu nome completo:';
      }
      break;

    default:
      sessao.etapa = 'aguardando_nome';
      sessao.numeroChamado = null;
      resposta = 'Para iniciar um novo atendimento, por favor, informe o seu nome completo:';
  }

  res.json({
    resposta,
    opcoes,
    etapa: sessao.etapa,
    numeroChamado: sessao.numeroChamado || null,
    tipoChamado
  });
});

// Reset de sessão
app.post('/api/reset', (req, res) => {
  const { sessionId } = req.body;
  delete sessoes[sessionId];
  res.json({ ok: true });
});

// ─── INICIAR SERVIDOR ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Servidor SEDEL Bot rodando em http://localhost:${PORT}`);
});
const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Configurações do Servidor
const app = express();
const PORT = 3000;
const JWT_SECRET = 'seu-segredo-jwt';

app.use(cors());
app.use(bodyParser.json());

// Configuração do Banco de Dados
const dbConfig = {
    user: 'seu_usuario',
    password: 'sua_senha',
    server: 'localhost\\MSSQLLocalDB',
    database: 'LojaAluguer',
    options: {
        encrypt: false, // Para conexões locais
        trustServerCertificate: true
    }
};

sql.connect(dbConfig).then(() => {
    console.log('Conectado ao banco de dados SQL Server.');
}).catch(err => {
    console.error('Erro ao conectar ao banco de dados:', err);
});

// Middleware para verificar autenticação
function authenticateToken(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Acesso negado' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token inválido' });
        req.user = user;
        next();
    });
}

// Rotas de Usuários
app.post('/register', async (req, res) => {
    const { nome, email, senha, tipo } = req.body;
    const hashedPassword = await bcrypt.hash(senha, 10);

    const query = `INSERT INTO utilizadores (nome, email, senha, tipo) VALUES (@nome, @email, @senha, @tipo)`;

    const request = new sql.Request();
    request.input('nome', sql.VarChar, nome);
    request.input('email', sql.VarChar, email);
    request.input('senha', sql.VarChar, hashedPassword);
    request.input('tipo', sql.VarChar, tipo);

    request.query(query, (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao registrar usuário', error: err });
        }
        res.status(201).json({ message: 'Usuário registrado com sucesso' });
    });
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    const query = `SELECT * FROM utilizadores WHERE email = @email`;
    const request = new sql.Request();
    request.input('email', sql.VarChar, email);

    request.query(query, async (err, result) => {
        if (err || result.recordset.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const user = result.recordset[0];
        const isValidPassword = await bcrypt.compare(senha, user.senha);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const token = jwt.sign({ id: user.id_utilizador, tipo: user.tipo }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
});

// Rotas de Gestão de Artigos
app.post('/artigos', authenticateToken, (req, res) => {
    const { nome_artigo, tipo, categoria, tamanho, cor, marca, preco_aluguer, estado } = req.body;

    if (req.user.tipo !== 'funcionario') {
        return res.status(403).json({ message: 'Permissão negada' });
    }

    const query = `INSERT INTO artigos (nome_artigo, tipo, categoria, tamanho, cor, marca, preco_aluguer, estado, disponibilidade, data_adicionado) 
                   VALUES (@nome_artigo, @tipo, @categoria, @tamanho, @cor, @marca, @preco_aluguer, @estado, 1, GETDATE())`;

    const request = new sql.Request();
    request.input('nome_artigo', sql.VarChar, nome_artigo);
    request.input('tipo', sql.VarChar, tipo);
    request.input('categoria', sql.VarChar, categoria);
    request.input('tamanho', sql.VarChar, tamanho);
    request.input('cor', sql.VarChar, cor);
    request.input('marca', sql.VarChar, marca);
    request.input('preco_aluguer', sql.Decimal, preco_aluguer);
    request.input('estado', sql.VarChar, estado);

    request.query(query, (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao adicionar artigo', error: err });
        }
        res.status(201).json({ message: 'Artigo adicionado com sucesso' });
    });
});

app.get('/artigos', (req, res) => {
    const query = `SELECT * FROM artigos WHERE disponibilidade = 1`;
    const request = new sql.Request();

    request.query(query, (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar artigos', error: err });
        }
        res.json(result.recordset);
    });
});

// Rotas de Reservas
app.post('/reservas', authenticateToken, (req, res) => {
    const { id_artigo, data_inicio, data_fim } = req.body;

    const checkQuery = `SELECT disponibilidade FROM artigos WHERE id_artigo = @id_artigo`;
    const insertQuery = `INSERT INTO reservas (id_utilizador, id_artigo, data_inicio, data_fim, estado_reserva, data_reserva) 
                         VALUES (@id_utilizador, @id_artigo, @data_inicio, @data_fim, 'pendente', GETDATE())`;
    const updateQuery = `UPDATE artigos SET disponibilidade = 0 WHERE id_artigo = @id_artigo`;

    const request = new sql.Request();
    request.input('id_artigo', sql.Int, id_artigo);

    request.query(checkQuery, (err, result) => {
        if (err || result.recordset.length === 0 || !result.recordset[0].disponibilidade) {
            return res.status(400).json({ message: 'Artigo não disponível' });
        }

        request.input('id_utilizador', sql.Int, req.user.id);
        request.input('data_inicio', sql.Date, data_inicio);
        request.input('data_fim', sql.Date, data_fim);

        request.query(insertQuery, (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao criar reserva', error: err });
            }

            request.query(updateQuery, (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao atualizar disponibilidade', error: err });
                }
                res.status(201).json({ message: 'Reserva criada com sucesso' });
            });
        });
    });
});

// Iniciar o Servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

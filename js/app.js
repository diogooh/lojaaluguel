document.addEventListener('DOMContentLoaded', () => {
    const artigosContainer = document.getElementById('artigos-container');
    const addArticleForm = document.getElementById('add-article-form');
    const logoutButton = document.getElementById('logout-btn');

    // Exemplo de carregamento dinâmico de artigos
    function loadArtigos() {
        fetch('/artigos')
            .then(response => response.json())
            .then(artigos => {
                artigosContainer.innerHTML = ''; // Limpa artigos existentes
                artigos.forEach(artigo => {
                    const articleCard = document.createElement('div');
                    articleCard.classList.add('article-card');
                    articleCard.innerHTML = `
                        <h3>${artigo.nome_artigo}</h3>
                        <p>Categoria: ${artigo.categoria}</p>
                        <p>Marca: ${artigo.marca}</p>
                        <p>Preço: €${artigo.preco_aluguer}</p>
                        <button>Reservar</button>
                    `;
                    artigosContainer.appendChild(articleCard);
                });
            })
            .catch(error => console.error('Erro ao carregar artigos:', error));
    }

    // Envio do formulário para adicionar artigos
    addArticleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(addArticleForm);

        fetch('/artigos', {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(formData)),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                loadArtigos(); // Atualiza a lista de artigos
                addArticleForm.reset();
            })
            .catch(error => console.error('Erro ao adicionar artigo:', error));
    });

    // Logout
    logoutButton.addEventListener('click', () => {
        alert('Você foi desconectado!');
        window.location.href = '/login.html';
    });

    // Inicializar carregamento de artigos
    loadArtigos();
});

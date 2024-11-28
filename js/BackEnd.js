document.addEventListener('DOMContentLoaded', () => {
    // Seleção de elementos
    const loginPage = document.getElementById('login-page');
    const registerPage = document.getElementById('register-page');
    const toRegisterLink = document.getElementById('to-register');
    const toLoginLink = document.getElementById('to-login');

    // Alternar para a página de registro
    toRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginPage.classList.add('hidden');
        registerPage.classList.remove('hidden');
    });

    // Alternar para a página de login
    toLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerPage.classList.add('hidden');
        loginPage.classList.remove('hidden');
    });

    // Validação de registro
    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }

        alert('Registro bem-sucedido!');
        // Aqui você pode enviar os dados ao servidor com fetch()
    });

    // Validação de login
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Login bem-sucedido!');
        // Aqui você pode enviar os dados ao servidor com fetch()
    });
});

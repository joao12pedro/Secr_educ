const API_BASE = 'https://secr-educ.onrender.com';

async function fetchAlunos() {
    try {
        const response = await fetch(`${API_BASE}/alunos`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao buscar alunos');
        }

        const data = await response.json();

        return {
            success: true,
            count: data.count,
            alunos: data.data,
            timestamp: data.timestamp
        };

    } catch (error) {
        console.error('Erro na requisição fetchAlunos:', error);
        return {
            success: false,
            error: error.message || 'Erro desconhecido ao buscar alunos'
        };
    }
}

async function fetchAlunosPorMotorista(nomeMotorista) {
    try {
        const response = await fetch(`${API_BASE}/alunos/motorista/${encodeURIComponent(nomeMotorista)}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao buscar alunos por motorista');
        }

        return {
            success: true,
            count: data.count,
            alunos: data.data,
            timestamp: data.timestamp
        };
    } catch (error) {
        console.error('Erro na pesquisa por motorista:', error);
        return {
            success: false,
            error: error.message || 'Erro desconhecido ao buscar por motorista'
        };
    }
}

function formatarData(dataString) {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

async function carregarAlunos() {
    const loadingElement = document.getElementById('loading');
    const errorContainer = document.getElementById('error-container');
    const alunosContainer = document.getElementById('alunos-container');
    const tbody = document.getElementById('alunos-tbody');
    const timestampElement = document.getElementById('timestamp');

    try {
        const resultado = await fetchAlunos();

        if (resultado.success) {
            loadingElement.style.display = 'none';
            alunosContainer.style.display = 'block';

            tbody.innerHTML = resultado.alunos.map(aluno =>
                `<tr>
                    <td>${aluno.id || '-'}</td>
                    <td>${aluno.nome_aluno || '-'}</td>
                    <td>${aluno.rg || '-'}</td>
                    <td>${formatarData(aluno.data_nasc)}</td>
                    <td>${aluno.escola || '-'}</td>
                    <td>${aluno.serie || '-'}</td>
                    <td>${aluno.turno || '-'}</td>
                </tr>`
            ).join('');

            if (resultado.timestamp) {
                const dataAtualizacao = new Date(resultado.timestamp);
                timestampElement.textContent = `Última atualização: ${dataAtualizacao.toLocaleString('pt-BR')}`;
            }
        } else {
            loadingElement.style.display = 'none';
            errorContainer.style.display = 'block';
            errorContainer.textContent = resultado.error;
        }
    } catch (error) {
        loadingElement.style.display = 'none';
        errorContainer.style.display = 'block';
        errorContainer.textContent = `Erro inesperado: ${error.message}`;
    }
}

async function carregarAlunosPorMotorista() {
    const motoristaInput = document.getElementById('motorista-search-input');
    const nomeMotorista = motoristaInput.value.trim();

    if (!nomeMotorista) {
        showMessage(DOM.errorMessage, 'Digite um nome de motorista para pesquisar');
        return;
    }

    try {
        showLoading(true);
        const resultado = await fetchAlunosPorMotorista(nomeMotorista);

        if (resultado.success) {
            DOM.loading.style.display = 'none';
            DOM.alunosContainer.style.display = 'block';

            DOM.tbody.innerHTML = resultado.alunos.map(aluno =>
                `<tr>
                    <td>${aluno.id || '-'}</td>
                    <td>${aluno.nome_aluno || '-'}</td>
                    <td>${aluno.rg || '-'}</td>
                    <td>${formatarData(aluno.data_nasc)}</td>
                    <td>${aluno.escola || '-'}</td>
                    <td>${aluno.serie || '-'}</td>
                    <td>${aluno.turno || '-'}</td>
                </tr>`
            ).join('');

            if (resultado.timestamp) {
                const dataAtualizacao = new Date(resultado.timestamp);
                DOM.timestamp.textContent = `Atualizado: ${dataAtualizacao.toLocaleString('pt-BR')}`;
            }
        } else {
            showMessage(DOM.errorMessage, resultado.error);
        }
    } catch (error) {
        showMessage(DOM.errorMessage, `Erro: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

window.addEventListener('DOMContentLoaded', carregarAlunos);

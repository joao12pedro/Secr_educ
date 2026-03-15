const API_BASE = 'https://secr-educ.onrender.com';

const ENDPOINTS = {
    alunos: '/alunos',
    aluno: '/aluno',
    pesquisar: '/alunos/pesquisar',
    motorista: '/alunos/motorista',
    health: '/health-check'
};

async function fetchAlunos() {
    try {
        const response = await fetch(`${API_BASE}${ENDPOINTS.alunos}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erro ${response.status}`);
        }

        const data = await response.json();

        return {
            success: true,
            count: data.count || (data.data ? data.data.length : 0),
            alunos: data.data || data || [],
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
        const response = await fetch(`${API_BASE}${ENDPOINTS.motorista}/${encodeURIComponent(nomeMotorista)}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao buscar alunos por motorista');
        }

        return {
            success: true,
            count: data.count || (data.data ? data.data.length : 0),
            alunos: data.data || [],
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
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    } catch {
        return dataString;
    }
}

// Função para ser chamada pelo HTML se usar o arquivo separado
window.carregarAlunos = async function() {
    const loadingElement = document.getElementById('loading');
    const errorContainer = document.getElementById('error-message');
    const alunosContainer = document.getElementById('alunos-container');
    const tbody = document.getElementById('alunos-tbody');
    const timestampElement = document.getElementById('timestamp');

    if (!loadingElement || !tbody) return;

    try {
        if (loadingElement) loadingElement.style.display = 'block';
        
        const resultado = await fetchAlunos();

        if (resultado.success) {
            if (loadingElement) loadingElement.style.display = 'none';
            
            if (alunosContainer) alunosContainer.style.display = 'block';

            if (tbody) {
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
            }

            if (resultado.timestamp && timestampElement) {
                const dataAtualizacao = new Date(resultado.timestamp);
                timestampElement.textContent = `Última atualização: ${dataAtualizacao.toLocaleString('pt-BR')}`;
            }
        } else {
            if (loadingElement) loadingElement.style.display = 'none';
            if (errorContainer) {
                errorContainer.style.display = 'block';
                errorContainer.textContent = resultado.error;
            }
        }
    } catch (error) {
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorContainer) {
            errorContainer.style.display = 'block';
            errorContainer.textContent = `Erro inesperado: ${error.message}`;
        }
    }
};

// Inicialização automática apenas se não houver outro evento
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.carregarAlunos);
} else {
    window.carregarAlunos();
}

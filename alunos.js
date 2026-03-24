// alunos.js
const API_BASE_URL = 'https://secr-educ.onrender.com';

// Elementos DOM
const DOM = {
    form: document.getElementById('aluno-form'),
    formTitle: document.getElementById('form-title'),
    formMessage: document.getElementById('form-message'),
    alunoId: document.getElementById('aluno-id'),
    submitButton: document.getElementById('submit-button'),
    cancelEditButton: document.getElementById('cancel-edit'),
    nomeAluno: document.getElementById('nome_aluno'),
    rg: document.getElementById('rg'),
    dataNasc: document.getElementById('data_nasc'),
    nomePai: document.getElementById('nome_pai'),
    nomeMae: document.getElementById('nome_mae'),
    endereco: document.getElementById('endereco'),
    escola: document.getElementById('escola'),
    turno: document.getElementById('turno'),
    serie: document.getElementById('serie'),
    ref: document.getElementById('ref'),
    motorista: document.getElementById('motorista'),
    obs: document.getElementById('obs'),
    alunoSearchInput: document.getElementById('aluno-search-input'),
    alunoSearchButton: document.getElementById('aluno-search-button'),
    motoristaSearchInput: document.getElementById('motorista-search-input'),
    motoristaSearchButton: document.getElementById('motorista-search-button'),
    showAllButton: document.getElementById('show-all-button'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    table: document.getElementById('alunos-table'),
    tbody: document.getElementById('alunos-tbody'),
    noResults: document.getElementById('no-results'),
    timestamp: document.getElementById('timestamp')
};

let isEditing = false;
let currentAlunos = [];

function showLoading(show) {
    DOM.loading.style.display = show ? 'block' : 'none';
}

function showMessage(element, message, type = 'error') {
    element.textContent = message;
    element.className = `message ${type}`;
    element.classList.remove('hidden');
    if (type === 'success') {
        setTimeout(() => element.classList.add('hidden'), 5000);
    }
}

function resetForm() {
    DOM.form.reset();
    DOM.alunoId.value = '';
    isEditing = false;
    DOM.formTitle.textContent = 'Cadastrar Novo Aluno';
    DOM.submitButton.textContent = 'Cadastrar Aluno';
    DOM.cancelEditButton.classList.add('hidden');
    DOM.formMessage.classList.add('hidden');
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    } catch {
        return dateString;
    }
}

function updateTimestamp(timestamp) {
    if (timestamp) {
        try {
            const date = new Date(timestamp);
            DOM.timestamp.textContent = `Última atualização: ${date.toLocaleString('pt-BR')}`;
        } catch {
            DOM.timestamp.textContent = `Atualizado: ${new Date().toLocaleString('pt-BR')}`;
        }
    }
}

async function fetchAllAlunos() {
    try {
        showLoading(true);
        DOM.errorMessage.classList.add('hidden');
        const response = await fetch(`${API_BASE_URL}/alunos`);
        if (!response.ok) throw new Error(`Erro ${response.status}`);
        const data = await response.json();
        currentAlunos = data.data || [];
        renderAlunos(currentAlunos);
        updateTimestamp(data.timestamp);
    } catch (error) {
        showMessage(DOM.errorMessage, error.message);
        DOM.errorMessage.classList.remove('hidden');
    } finally {
        showLoading(false);
    }
}

async function searchAlunosPorNome(nome) {
    try {
        showLoading(true);
        DOM.errorMessage.classList.add('hidden');
        const response = await fetch(`${API_BASE_URL}/alunos/pesquisar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome })
        });
        if (!response.ok) throw new Error('Erro na pesquisa');
        const data = await response.json();
        currentAlunos = data.resultados || data.data || [];
        renderAlunos(currentAlunos);
        updateTimestamp(data.timestamp);
    } catch (error) {
        showMessage(DOM.errorMessage, error.message);
        DOM.errorMessage.classList.remove('hidden');
    } finally {
        showLoading(false);
    }
}

async function searchAlunosPorMotorista(nomeMotorista) {
    try {
        showLoading(true);
        DOM.errorMessage.classList.add('hidden');
        const response = await fetch(`${API_BASE_URL}/alunos/motorista/${encodeURIComponent(nomeMotorista)}`);
        if (!response.ok) throw new Error('Erro na pesquisa');
        const data = await response.json();
        currentAlunos = data.data || [];
        renderAlunos(currentAlunos);
        updateTimestamp(data.timestamp);
    } catch (error) {
        showMessage(DOM.errorMessage, error.message);
        DOM.errorMessage.classList.remove('hidden');
    } finally {
        showLoading(false);
    }
}

async function createAluno(alunoData) {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/aluno`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alunoData)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.erro || 'Erro ao criar aluno');
        showMessage(DOM.formMessage, 'Aluno cadastrado com sucesso!', 'success');
        resetForm();
        await fetchAllAlunos();
    } catch (error) {
        showMessage(DOM.formMessage, error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function updateAluno(id, alunoData) {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/aluno/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alunoData)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.erro || 'Erro ao atualizar aluno');
        showMessage(DOM.formMessage, 'Aluno atualizado com sucesso!', 'success');
        resetForm();
        await fetchAllAlunos();
    } catch (error) {
        showMessage(DOM.formMessage, error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteAluno(id) {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/aluno/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Erro ao excluir aluno');
        showMessage(DOM.errorMessage, 'Aluno excluído com sucesso!', 'success');
        await fetchAllAlunos();
    } catch (error) {
        showMessage(DOM.errorMessage, error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function editAluno(id) {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/aluno/${id}`);
        if (!response.ok) throw new Error('Aluno não encontrado');
        const aluno = await response.json();

        DOM.alunoId.value = aluno.id;
        DOM.nomeAluno.value = aluno.nome_aluno || '';
        DOM.rg.value = aluno.rg || '';
        DOM.dataNasc.value = aluno.data_nasc ? aluno.data_nasc.split('T')[0] : '';
        DOM.nomePai.value = aluno.nome_pai || '';
        DOM.nomeMae.value = aluno.nome_mae || '';
        DOM.endereco.value = aluno.endereco || '';
        DOM.escola.value = aluno.escola || '';
        DOM.turno.value = aluno.turno || '';
        DOM.serie.value = aluno.serie || '';
        DOM.ref.value = aluno.ref || '';
        DOM.motorista.value = aluno.motorista || '';
        DOM.obs.value = aluno.obs || '';

        isEditing = true;
        DOM.formTitle.textContent = 'Editar Aluno';
        DOM.submitButton.textContent = 'Atualizar Aluno';
        DOM.cancelEditButton.classList.remove('hidden');
        DOM.formMessage.classList.add('hidden');

        document.querySelector('.left-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        showMessage(DOM.errorMessage, error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function renderAlunos(alunos) {
    DOM.tbody.innerHTML = '';
    if (!alunos || alunos.length === 0) {
        DOM.noResults.classList.remove('hidden');
        DOM.table.classList.add('hidden');
        document.getElementById('result-count').textContent = '0 alunos';
        return;
    }
    DOM.noResults.classList.add('hidden');
    DOM.table.classList.remove('hidden');
    document.getElementById('result-count').textContent = `${alunos.length} aluno${alunos.length !== 1 ? 's' : ''}`;

    alunos.forEach(aluno => {
        const row = DOM.tbody.insertRow();
        row.innerHTML = `
            <td>${aluno.id || '-'}</td>
            <td>${aluno.nome_aluno || '-'}</td>
            <td>${aluno.rg || '-'}</td>
            <td>${formatDate(aluno.data_nasc)}</td>
            <td>${aluno.escola || '-'}</td>
            <td>${aluno.serie || '-'}</td>
            <td>${aluno.turno || '-'}</td>
            <td>${aluno.motorista || '-'}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${aluno.obs || '-'}</td>
            <td class="action-buttons">
                <button class="action-btn btn-primary edit-btn" data-id="${aluno.id}">Editar</button>
                <button class="action-btn btn-danger delete-btn" data-id="${aluno.id}">Excluir</button>
            </td>
        `;
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editAluno(btn.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteAluno(btn.dataset.id));
    });
}

// Event Listeners
DOM.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alunoData = {
        nome_aluno: DOM.nomeAluno.value.trim(),
        rg: DOM.rg.value.trim(),
        data_nasc: DOM.dataNasc.value,
        nome_pai: DOM.nomePai.value.trim(),
        nome_mae: DOM.nomeMae.value.trim(),
        endereco: DOM.endereco.value.trim(),
        escola: DOM.escola.value,
        turno: DOM.turno.value,
        serie: DOM.serie.value.trim(),
        ref: DOM.ref.value.trim() || undefined,
        motorista: DOM.motorista.value.trim() || undefined,
        obs: DOM.obs.value.trim() || undefined
    };
    if (isEditing) {
        await updateAluno(parseInt(DOM.alunoId.value), alunoData);
    } else {
        await createAluno(alunoData);
    }
});

DOM.cancelEditButton.addEventListener('click', resetForm);
DOM.alunoSearchButton.addEventListener('click', () => {
    const term = DOM.alunoSearchInput.value.trim();
    term ? searchAlunosPorNome(term) : showMessage(DOM.errorMessage, 'Digite um nome para pesquisar');
});
DOM.motoristaSearchButton.addEventListener('click', () => {
    const term = DOM.motoristaSearchInput.value.trim();
    term ? searchAlunosPorMotorista(term) : showMessage(DOM.errorMessage, 'Digite um nome de motorista');
});
DOM.showAllButton.addEventListener('click', fetchAllAlunos);
DOM.alunoSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const term = DOM.alunoSearchInput.value.trim();
        if (term) searchAlunosPorNome(term);
    }
});
DOM.motoristaSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const term = DOM.motoristaSearchInput.value.trim();
        if (term) searchAlunosPorMotorista(term);
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await fetchAllAlunos();
    DOM.nomeAluno.focus();
});

async function fetchAlunos() {
            try {
                // Realiza a requisição GET para o endpoint /alunos
                const response = await fetch('http://localhost:5000/alunos', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                // Verifica se a resposta foi bem sucedida
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao buscar alunos');
                }

                // Converte a resposta para JSON
                const data = await response.json();

                // Retorna os dados formatados
                return {
                    success: true,
                    count: data.count,
                    alunos: data.data,
                    timestamp: data.timestamp
                };

            } catch (error) {
                // Tratamento de erros
                console.error('Erro na requisição fetchAlunos:', error);
                return {
                    success: false,
                    error: error.message || 'Erro desconhecido ao buscar alunos'
                };
            }
        }

        // Função para formatar a data no formato dd/mm/aaaa
        function formatarData(dataString) {
            if (!dataString) return '-';
            const data = new Date(dataString);
            return data.toLocaleDateString('pt-BR');
        }

        // Função principal que é executada quando a página carrega
        async function carregarAlunos() {
            const loadingElement = document.getElementById('loading');
            const errorContainer = document.getElementById('error-container');
            const alunosContainer = document.getElementById('alunos-container');
            const tbody = document.getElementById('alunos-tbody');
            const timestampElement = document.getElementById('timestamp');

            try {
                const resultado = await fetchAlunos();

                if (resultado.success) {
                    // Esconde o loading e mostra a tabela
                    loadingElement.style.display = 'none';
                    alunosContainer.style.display = 'block';

                    // Preenche a tabela com os dados dos alunos
                    tbody.innerHTML = resultado.alunos.map(aluno => `
                        <tr>
                            <td>${aluno.id || '-'}</td>
                            <td>${aluno.nome_aluno || '-'}</td>
                            <td>${aluno.rg || '-'}</td>
                            <td>${formatarData(aluno.data_nasc) || '-'}</td>
                            <td>${aluno.escola || '-'}</td>
                            <td>${aluno.serie || '-'}</td>
                            <td>${aluno.turno || '-'}</td>
                        </tr>
                    `).join('');

                    // Exibe o timestamp da última atualização
                    if (resultado.timestamp) {
                        const dataAtualizacao = new Date(resultado.timestamp);
                        timestampElement.textContent = `Última atualização: ${dataAtualizacao.toLocaleString('pt-BR')}`;
                    }

                    console.log('Dados carregados com sucesso:', resultado.alunos);
                } else {
                    // Mostra mensagem de erro
                    loadingElement.style.display = 'none';
                    errorContainer.style.display = 'block';
                    errorContainer.textContent = resultado.error;
                    console.error('Erro ao carregar alunos:', resultado.error);
                }
            } catch (error) {
                // Tratamento de erros inesperados
                loadingElement.style.display = 'none';
                errorContainer.style.display = 'block';
                errorContainer.textContent = `Erro inesperado: ${error.message}`;
                console.error('Erro inesperado:', error);
            }
        }

        // Chama a função principal quando a página terminar de carregar
        window.addEventListener('DOMContentLoaded', carregarAlunos);
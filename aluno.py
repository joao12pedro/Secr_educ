from datetime import datetime
from flask import jsonify, request, Blueprint
from db_config import connect_db

aluno_bp = Blueprint("aluno", __name__)  # Corrigido para "aluno" ao invés de "usuario"


@aluno_bp.route("/alunos", methods=["GET"])
def get_all_alunos():
    try:
        supabase = connect_db()
        response = supabase.table("alunos").select("*").execute()

        if not response.data:
            return jsonify({
                'status': 'success',
                'data': [],
                'message': 'Nenhum aluno encontrado',
                'timestamp': datetime.now().isoformat()
            }), 200

        return jsonify({
            'status': 'success',
            'count': len(response.data),
            'data': response.data,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        print(f"Erro na consulta de alunos: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erro ao buscar alunos',
            'error_details': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@aluno_bp.route("/alunos/pesquisar", methods=["POST"])
def pesquisar_aluno():
    """
    Rota para pesquisar alunos por nome
    Exemplo de JSON:
    {
        "nome": "João"  # Pode ser parte do nome
    }
    """
    try:
        dados = request.get_json()

        # Validação do campo nome
        if not dados or 'nome' not in dados or not dados['nome'].strip():
            return jsonify({
                'status': 'error',
                'message': 'O campo "nome" é obrigatório para a pesquisa',
                'timestamp': datetime.now().isoformat()
            }), 400

        nome_pesquisa = dados['nome'].strip()
        supabase = connect_db()

        # Pesquisa no Supabase usando ilike para busca parcial case-insensitive
        response = supabase.table("alunos") \
            .select("*") \
            .ilike("nome_aluno", f"%{nome_pesquisa}%") \
            .execute()

        # Alternativa para colunas com nomes diferentes
        if not response.data:
            response = supabase.table("alunos") \
                .select("*") \
                .ilike("nome_aluno", f"%{nome_pesquisa}%") \
                .execute()

        return jsonify({
            'status': 'success',
            'count': len(response.data),
            'resultados': response.data,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        print(f"Erro na pesquisa de alunos: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erro ao pesquisar alunos',
            'error_details': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@aluno_bp.route("/aluno", methods=["POST"])
def criar_aluno():
    # Dados esperados do formulário/JSON
    dados = request.get_json()

    # Validação dos dados obrigatórios
    campos_obrigatorios = ['nome_aluno', 'rg', 'data_nasc', 'nome_pai', 'nome_mae',
                           'endereco', 'escola', 'turno', 'serie']
    for campo in campos_obrigatorios:
        if campo not in dados:
            return jsonify({"erro": f"Campo obrigatório faltando: {campo}"}), 400

    # Validação dos valores enum
    escolas_validas = ['Estadual', 'Municipal', 'Orlando Soares']
    turnos_validos = ['Matutino', 'Vespertino', 'Noturno']

    if dados['escola'] not in escolas_validas:
        return jsonify({"erro": f"Escola inválida. Valores permitidos: {', '.join(escolas_validas)}"}), 400

    if dados['turno'] not in turnos_validos:
        return jsonify({"erro": f"Turno inválido. Valores permitidos: {', '.join(turnos_validos)}"}), 400

    try:
        # Prepara os dados para inserção no Supabase
        aluno_data = {
            "nome_aluno": dados['nome_aluno'],  # Mapeando para o nome da coluna no banco
            "rg": dados['rg'],
            "data_nasc": dados['data_nasc'],
            "nome_pai": dados['nome_pai'],  # Mapeando para o nome da coluna no banco
            "nome_mae": dados['nome_mae'],  # Mapeando para o nome da coluna no banco
            "endereco": dados['endereco'],
            "escola": dados['escola'],
            "turno": dados['turno'],
            "serie": dados['serie']
        }

        # Campos opcionais
        if 'ref' in dados:
            aluno_data['ref'] = dados['ref']
        if 'motorista' in dados:
            aluno_data['motorista'] = dados['motorista']
        if 'obs' in dados:
            aluno_data['obs'] = dados['obs']

        # Insere no Supabase
        response = connect_db().table('alunos').insert(aluno_data).execute()

        # Verifica se houve erro na inserção
        if hasattr(response, 'error') and response.error:
            return jsonify({"erro": str(response.error)}), 400

        return jsonify({
            "mensagem": "Aluno criado com sucesso",
            "dados": response.data[0] if response.data else None
        }), 201

    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@aluno_bp.route("/aluno/<int:id>", methods=["PUT"])
def atualizar_aluno(id):
    try:
        dados = request.get_json()

        # Verifica se o aluno existe
        aluno_existente = connect_db().table('alunos').select('*').eq('id', id).execute()
        if not aluno_existente.data:
            return jsonify({"erro": "Aluno não encontrado"}), 404

        # Validação de campos
        if not dados:
            return jsonify({"erro": "Nenhum dado fornecido para atualização"}), 400

        # Validação de data
        if 'data_nascimento' in dados:
            try:
                datetime.strptime(dados['data_nascimento'], '%Y-%m-%d')
            except ValueError:
                return jsonify({"erro": "Formato de data inválido. Use YYYY-MM-DD"}), 400

        # Validação de valores permitidos
        if 'escola' in dados:
            escolas_validas = ['Estadual', 'Municipal', 'Orlando Soares']
            if dados['escola'] not in escolas_validas:
                return jsonify({
                    "erro": f"Escola inválida. Valores permitidos: {', '.join(escolas_validas)}"
                }), 400

        if 'turno' in dados:
            turnos_validos = ['Matutino', 'Vespertino', 'Noturno']
            if dados['turno'] not in turnos_validos:
                return jsonify({
                    "erro": f"Turno inválido. Valores permitidos: {', '.join(turnos_validos)}"
                }), 400

        # Mapeamento para o banco de dados
        mapeamento_campos = {
            'nome': 'nome_aluno',
            'data_nascimento': 'data_nasc',
            'nome_aluno': 'nome_aluno',
            'nome_pai': 'nome_pai',
            'nome_mae': 'nome_mae',
            'observacoes': 'obs',
            'serie': 'serie'
        }

        dados_atualizacao = {}
        for campo_api, campo_bd in mapeamento_campos.items():
            if campo_api in dados:
                dados_atualizacao[campo_bd] = dados[campo_api]

        # Campos que não precisam de mapeamento
        campos_diretos = ['rg', 'endereco', 'escola', 'turno', 'ref', 'motorista']
        for campo in campos_diretos:
            if campo in dados:
                dados_atualizacao[campo] = dados[campo]

        # Atualização no Supabase
        response = connect_db().table('alunos').update(dados_atualizacao).eq('id', id).execute()

        if hasattr(response, 'error') and response.error:
            return jsonify({"erro": "Falha ao atualizar aluno", "detalhes": str(response.error)}), 500

        return jsonify({
            "sucesso": True,
            "mensagem": "Aluno atualizado com sucesso",
            "dados antigos": aluno_existente.data[0],
            "dados_atualizados": dados_atualizacao
        }), 200

    except Exception as e:
        return jsonify({
            "erro": "Erro interno no servidor",
            "detalhes": str(e)
        }), 500


@aluno_bp.route("/aluno/<int:id>", methods=["DELETE"])
def deletar_aluno(id):
    try:
        supabase = connect_db()

        # Verifica se o aluno existe
        aluno_existente = supabase.table("alunos").select("*").eq("id", id).execute()
        if not aluno_existente.data:
            return jsonify({
                'status': 'error',
                'message': f'Aluno com ID {id} não encontrado',
                'timestamp': datetime.now().isoformat()
            }), 404

        # Executa a exclusão
        response = supabase.table("alunos").delete().eq("id", id).execute()

        return jsonify({
            'status': 'success',
            'message': f'Aluno {id} removido com sucesso',
            'deleted_data': response.data[0] if response.data else None,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        print(f"Erro ao deletar aluno: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erro ao excluir aluno',
            'error_details': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500
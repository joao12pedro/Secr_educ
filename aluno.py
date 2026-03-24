from datetime import datetime
from flask import jsonify, request, Blueprint
from db_config import connect_db

aluno_bp = Blueprint("aluno", __name__)


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
    try:
        dados = request.get_json()

        if not dados or 'nome' not in dados or not dados['nome'].strip():
            return jsonify({
                'status': 'error',
                'message': 'O campo "nome" é obrigatório para a pesquisa',
                'timestamp': datetime.now().isoformat()
            }), 400

        nome_pesquisa = dados['nome'].strip()
        supabase = connect_db()

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


@aluno_bp.route("/alunos/motorista/<string:nome_motorista>", methods=["GET"])
def get_alunos_por_motorista(nome_motorista):
    try:
        supabase = connect_db()

        response = supabase.table("alunos") \
            .select("*") \
            .ilike("motorista", f"%{nome_motorista}%") \
            .execute()

        return jsonify({
            'status': 'success',
            'count': len(response.data),
            'data': response.data,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        print(f"Erro na pesquisa por motorista: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Erro ao buscar alunos por motorista',
            'error_details': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@aluno_bp.route("/aluno", methods=["POST"])
def criar_aluno():
    dados = request.get_json()
    campos_obrigatorios = ['nome_aluno', 'rg', 'data_nasc', 'nome_pai', 'nome_mae',
                           'endereco', 'escola', 'turno', 'serie']
    for campo in campos_obrigatorios:
        if campo not in dados:
            return jsonify({"erro": f"Campo obrigatório faltando: {campo}"}), 400

    escolas_validas = ['Estadual', 'Municipal', 'Orlando Soares']
    turnos_validos = ['Matutino', 'Vespertino', 'Noturno']

    if dados['escola'] not in escolas_validas:
        return jsonify({"erro": f"Escola inválida. Valores permitidos: {', '.join(escolas_validas)}"}), 400

    if dados['turno'] not in turnos_validos:
        return jsonify({"erro": f"Turno inválido. Valores permitidos: {', '.join(turnos_validos)}"}), 400

    try:
        aluno_data = {
            "nome_aluno": dados['nome_aluno'],
            "rg": dados['rg'],
            "data_nasc": dados['data_nasc'],
            "nome_pai": dados['nome_pai'],
            "nome_mae": dados['nome_mae'],
            "endereco": dados['endereco'],
            "escola": dados['escola'],
            "turno": dados['turno'],
            "serie": dados['serie']
        }

        if 'ref' in dados:
            aluno_data['ref'] = dados['ref']
        if 'motorista' in dados:
            aluno_data['motorista'] = dados['motorista']
        if 'obs' in dados:
            aluno_data['obs'] = dados['obs']

        response = connect_db().table('alunos').insert(aluno_data).execute()

        if hasattr(response, 'error') and response.error:
            return jsonify({"erro": str(response.error)}), 400

        return jsonify({
            "mensagem": "Aluno criado com sucesso",
            "dados": response.data[0] if response.data else None
        }), 201

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@aluno_bp.route("/aluno/<int:id>", methods=["GET"])
def get_aluno(id):
    """Endpoint para buscar um aluno específico por ID"""
    try:
        supabase = connect_db()
        response = supabase.table("alunos").select("*").eq("id", id).execute()

        if not response.data:
            return jsonify({"erro": "Aluno não encontrado"}), 404

        return jsonify(response.data[0]), 200
    except Exception as e:
        print(f"Erro ao buscar aluno: {str(e)}")
        return jsonify({"erro": str(e)}), 500


@aluno_bp.route("/aluno/<int:id>", methods=["PUT"])
def atualizar_aluno(id):
    try:
        dados = request.get_json()

        # Verifica se o aluno existe
        aluno_existente = connect_db().table('alunos').select('*').eq('id', id).execute()
        if not aluno_existente.data:
            return jsonify({"erro": "Aluno não encontrado"}), 404

        if not dados:
            return jsonify({"erro": "Nenhum dado fornecido para atualização"}), 400

        # Validações de data
        if 'data_nascimento' in dados:
            try:
                datetime.strptime(dados['data_nascimento'], '%Y-%m-%d')
            except ValueError:
                return jsonify({"erro": "Formato de data inválido. Use YYYY-MM-DD"}), 400

        # Validações de escola
        if 'escola' in dados:
            escolas_validas = ['Estadual', 'Municipal', 'Orlando Soares']
            if dados['escola'] not in escolas_validas:
                return jsonify({
                    "erro": f"Escola inválida. Valores permitidos: {', '.join(escolas_validas)}"
                }), 400

        # Validações de turno
        if 'turno' in dados:
            turnos_validos = ['Matutino', 'Vespertino', 'Noturno']
            if dados['turno'] not in turnos_validos:
                return jsonify({
                    "erro": f"Turno inválido. Valores permitidos: {', '.join(turnos_validos)}"
                }), 400

        # Dicionário de atualização com mapeamento completo
        dados_atualizacao = {}

        # Mapeamento de campos (incluindo todas as variações de observações)
        mapeamento = {
            'nome_aluno': 'nome_aluno',
            'nome': 'nome_aluno',
            'rg': 'rg',
            'data_nasc': 'data_nasc',
            'data_nascimento': 'data_nasc',
            'nome_pai': 'nome_pai',
            'nome_mae': 'nome_mae',
            'endereco': 'endereco',
            'escola': 'escola',
            'turno': 'turno',
            'serie': 'serie',
            'ref': 'ref',
            'motorista': 'motorista',
            'obs': 'obs'
        }

        # Aplica o mapeamento
        for campo_recebido, campo_banco in mapeamento.items():
            if campo_recebido in dados and dados[campo_recebido] is not None:
                dados_atualizacao[campo_banco] = dados[campo_recebido]

        # Verifica se há algo para atualizar
        if not dados_atualizacao:
            return jsonify({"erro": "Nenhum campo válido para atualização"}), 400

        # Executa a atualização
        response = connect_db().table('alunos').update(dados_atualizacao).eq('id', id).execute()

        if hasattr(response, 'error') and response.error:
            return jsonify({"erro": "Falha ao atualizar aluno", "detalhes": str(response.error)}), 500

        # Retorna o aluno atualizado
        aluno_atualizado = connect_db().table('alunos').select('*').eq('id', id).execute()

        return jsonify({
            "sucesso": True,
            "mensagem": "Aluno atualizado com sucesso",
            "dados_antigos": aluno_existente.data[0],
            "dados_atualizados": dados_atualizacao,
            "dados_finais": aluno_atualizado.data[0] if aluno_atualizado.data else None
        }), 200

    except Exception as e:
        print(f"Erro na atualização: {str(e)}")
        return jsonify({
            "erro": "Erro interno no servidor",
            "detalhes": str(e)
        }), 500


@aluno_bp.route("/aluno/<int:id>", methods=["DELETE"])
def deletar_aluno(id):
    try:
        supabase = connect_db()
        aluno_existente = supabase.table("alunos").select("*").eq("id", id).execute()
        if not aluno_existente.data:
            return jsonify({
                'status': 'error',
                'message': f'Aluno com ID {id} não encontrado',
                'timestamp': datetime.now().isoformat()
            }), 404

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


@aluno_bp.route('/health-check')
def health_check():
    return {'status': 'ok'}, 200

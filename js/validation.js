export function validarNome(nome) {
  const regex = /^(?!.*(.)\1{2})[A-Za-z\u00C0-\u00Ff]{3,10}$/i;
  return regex.test(nome);
}

export function validarMeta(meta) {
  return meta !== "none";
}

export function validarPontosRegistro(
  pontos,
  realizadoDiario,
  diasAgendados = []
) {
  if (!pontos || isNaN(pontos) || pontos <= 0) {
    return {
      valido: false,
      mensagem: "Insira um valor numérico válido e maior que zero.",
    };
  }
  if (pontos < 100) {
    return {
      valido: false,
      mensagem: "Para registro, o valor deve ser maior que 100.",
    };
  }
  const hoje = new Date();
  const diaDaSemana = hoje.getDay();
  if (diaDaSemana === 0 || diaDaSemana === 6) {
    return {
      valido: false,
      mensagem: "Fim de semana! Só é possível registrar pontos em dias úteis.",
    };
  }

  // Verificar se hoje está agendado como dia off
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = hoje.getFullYear();
  const dataHojeBR = `${dia}/${mes}/${ano}`;

  if (diasAgendados.includes(dataHojeBR)) {
    return {
      valido: false,
      mensagem:
        "🚫 Registro bloqueado: Este dia está agendado como folga/atestado e não pode receber registros.",
    };
  }

  const dataHojeKey =
    hoje.getFullYear() +
    "-" +
    String(hoje.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(hoje.getDate()).padStart(2, "0");
  if (realizadoDiario[dataHojeKey]) {
    return {
      valido: false,
      mensagem:
        "Registro bloqueado: O total de pontos para hoje já foi inserido.",
    };
  }
  return { valido: true, dataHojeKey };
}

export function validarEdicao(dataKeyDoItem, dadosUsuario) {
  const hoje = new Date();
  const diaDaSemana = hoje.getDay();
  if (diaDaSemana === 0 || diaDaSemana === 6) {
    return {
      valido: false,
      mensagem: "Não é possível corrigir registros durante o fim de semana.",
    };
  }

  const dataOrdenadas = Object.keys(dadosUsuario.realizadoDiario)
    .sort()
    .reverse();
  const ultimoRegistroDataKey =
    dataOrdenadas.length > 0 ? dataOrdenadas[0] : null;

  if (dataKeyDoItem !== ultimoRegistroDataKey) {
    return {
      valido: false,
      mensagem:
        "Apenas o último registro pode ser corrigido para manter a consistência dos dados.",
    };
  }

  const hojeDataKey =
    hoje.getFullYear() +
    "-" +
    String(hoje.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(hoje.getDate()).padStart(2, "0");

  if (dataKeyDoItem !== hojeDataKey) {
    return {
      valido: false,
      mensagem:
        "O prazo para correção expirou. Só é possível corrigir registros no mesmo dia.",
    };
  }

  return { valido: true };
}

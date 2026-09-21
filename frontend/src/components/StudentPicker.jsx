import React, { useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { listStudents } from "../api/students.js";
import { getErrorMessage } from "../api/errors.js";

const LIMITE = 50;

/*
  Caixa de seleção de aluno com busca no servidor.

  O select anterior carregava a escola inteira e obrigava a percorrer a lista à
  mão: aceitável com dezenas de alunos, impraticável com centenas. Aqui o
  backend filtra por nome, código ou email (GET /students?search=&limit=) e
  devolve no máximo 50.

  O valor continua a ser o id do aluno, para os formulários que a usam não
  precisarem de mudar nada além do campo.

  Em modo de edição o aluno já escolhido pode não vir na primeira página de
  resultados — por isso `selectedLabel` permite ao formulário dar o nome que já
  conhece, e a caixa mostra-o sem ter de o ir buscar.
*/
export default function StudentPicker({
  value,
  onChange,
  label = "Aluno",
  disabled = false,
  required = false,
  autoFocus = false,
  selectedLabel = "",
  helperText,
}) {
  const [opcoes, setOpcoes] = useState([]);
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const pedidoAtual = useRef(0);

  useEffect(() => {
    if (!aberto) return undefined;

    // Espera o utilizador parar de escrever antes de perguntar ao servidor.
    const temporizador = setTimeout(async () => {
      const meuPedido = ++pedidoAtual.current;
      setCarregando(true);
      setErro(null);
      try {
        const dados = await listStudents({ search: texto, limit: LIMITE });
        // Uma resposta lenta de uma pesquisa antiga não pode sobrepor-se à
        // atual — sem esta guarda, escrever depressa mostra resultados de uma
        // letra anterior.
        if (meuPedido === pedidoAtual.current) setOpcoes(dados);
      } catch (err) {
        if (meuPedido === pedidoAtual.current) {
          setErro(getErrorMessage(err, "Não foi possível procurar alunos."));
          setOpcoes([]);
        }
      } finally {
        if (meuPedido === pedidoAtual.current) setCarregando(false);
      }
    }, 300);

    return () => clearTimeout(temporizador);
  }, [texto, aberto]);

  const selecionado = useMemo(() => {
    if (!value) return null;
    const encontrado = opcoes.find((o) => String(o.id) === String(value));
    if (encontrado) return encontrado;
    // Ainda não veio nas opções: mostra o que o formulário souber.
    return { id: value, name: selectedLabel || `#${value}`, studentCode: "" };
  }, [value, opcoes, selectedLabel]);

  return (
    <Autocomplete
      fullWidth
      disabled={disabled}
      open={aberto}
      onOpen={() => setAberto(true)}
      onClose={() => setAberto(false)}
      options={opcoes}
      loading={carregando}
      value={selecionado}
      isOptionEqualToValue={(opcao, valor) => String(opcao.id) === String(valor?.id)}
      getOptionLabel={(o) => (o?.studentCode ? `${o.name} (${o.studentCode})` : o?.name || "")}
      onChange={(_evento, novo) => onChange(novo ? novo.id : "")}
      onInputChange={(_evento, novoTexto, motivo) => {
        if (motivo === "input") setTexto(novoTexto);
      }}
      filterOptions={(x) => x} // quem filtra é o servidor
      noOptionsText={texto ? "Nenhum aluno encontrado" : "Escreva para procurar"}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          autoFocus={autoFocus}
          error={Boolean(erro)}
          helperText={erro || helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {carregando ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

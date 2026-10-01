/*
  Agregação do boletim: notas soltas -> matriz disciplina x período.

  Fora do componente de propósito, para poder ser verificada sem browser:
    node frontend/src/pages/students/reportCard.selfcheck.js
*/

// `term` é texto livre — não existe entidade de período formal (ver
// docs/project-rules.md, seção 6, item 7). Ordenar alfabeticamente é o melhor
// possível sem inventar um conceito que o modelo não tem; com "T1/T2/T3" ou
// "1º/2º/3º" dá a ordem certa.
export function ordenarPeriodos(periodos) {
  return [...periodos].sort((a, b) => String(a).localeCompare(String(b), "pt"));
}

export function media(valores) {
  if (!valores.length) return null;
  return valores.reduce((soma, v) => soma + v, 0) / valores.length;
}

export function formatar(valor) {
  return valor === null || valor === undefined ? "—" : valor.toFixed(1);
}

/*
  Devolve { periodos, linhas, mediaGeral }.

  Várias notas na mesma disciplina e período (dois testes, por exemplo) dão a
  média delas: somar daria um valor fora da escala e guardar só a última
  perderia informação.

  A média final de uma disciplina é calculada sobre TODAS as suas notas, não
  sobre as médias por período. Com o mesmo número de notas em cada período dá
  o mesmo; com números diferentes, esta forma dá o peso devido a cada nota
  lançada em vez de fazer um período com uma nota valer tanto como outro com
  três.
*/
export function montarBoletim(grades) {
  const porDisciplina = new Map();
  const conjuntoPeriodos = new Set();

  for (const nota of grades || []) {
    const disciplina = nota.subject?.name || "—";
    const periodo = nota.term || "—";
    const valor = Number(nota.score);
    if (Number.isNaN(valor)) continue;

    conjuntoPeriodos.add(periodo);
    if (!porDisciplina.has(disciplina)) porDisciplina.set(disciplina, new Map());
    const celulas = porDisciplina.get(disciplina);
    if (!celulas.has(periodo)) celulas.set(periodo, []);
    celulas.get(periodo).push(valor);
  }

  const periodos = ordenarPeriodos([...conjuntoPeriodos]);

  const linhas = [...porDisciplina.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "pt"))
    .map(([disciplina, celulas]) => ({
      disciplina,
      valoresPorPeriodo: periodos.map((p) => media(celulas.get(p) || [])),
      mediaFinal: media([...celulas.values()].flat()),
    }));

  const finais = linhas.map((l) => l.mediaFinal).filter((v) => v !== null);

  return { periodos, linhas, mediaGeral: media(finais) };
}

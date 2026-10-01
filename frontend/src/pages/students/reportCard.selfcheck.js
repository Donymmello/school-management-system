/*
  Verificação da agregação do boletim. Sem framework de propósito — o projeto
  não tem runner de testes, e isto corre com o node que já está instalado:

    node frontend/src/pages/students/reportCard.selfcheck.js

  Falha com exceção se algo quebrar; em silêncio bem-sucedido imprime "ok".
*/
import assert from "node:assert/strict";
import { montarBoletim, formatar, ordenarPeriodos } from "./reportCard.js";

const nota = (disciplina, periodo, score) => ({
  subject: { name: disciplina },
  term: periodo,
  score,
});

// --- vazio ---
{
  const r = montarBoletim([]);
  assert.deepEqual(r.periodos, []);
  assert.deepEqual(r.linhas, []);
  assert.equal(r.mediaGeral, null);
  assert.equal(formatar(r.mediaGeral), "—");
}

// --- matriz simples ---
{
  const r = montarBoletim([
    nota("Matemática", "T2", 12),
    nota("Matemática", "T1", 14),
    nota("Português", "T1", 10),
  ]);

  assert.deepEqual(r.periodos, ["T1", "T2"], "períodos ordenados");
  assert.deepEqual(
    r.linhas.map((l) => l.disciplina),
    ["Matemática", "Português"],
    "disciplinas por ordem alfabética"
  );

  const mat = r.linhas[0];
  assert.deepEqual(mat.valoresPorPeriodo, [14, 12]);
  assert.equal(mat.mediaFinal, 13);

  const port = r.linhas[1];
  // Português não tem nota em T2: a célula fica vazia, não zero. Zero seria
  // uma nota má; vazio é ausência de nota.
  assert.deepEqual(port.valoresPorPeriodo, [10, null]);
  assert.equal(formatar(port.valoresPorPeriodo[1]), "—");

  assert.equal(r.mediaGeral, 11.5, "média geral sobre as médias finais");
}

// --- várias notas na mesma célula ---
{
  const r = montarBoletim([
    nota("Física", "T1", 10),
    nota("Física", "T1", 20),
  ]);
  assert.deepEqual(r.linhas[0].valoresPorPeriodo, [15], "célula com duas notas = média");
  assert.equal(r.linhas[0].mediaFinal, 15);
}

// --- média final pondera cada nota, não cada período ---
{
  const r = montarBoletim([
    nota("Química", "T1", 20),
    nota("Química", "T2", 10),
    nota("Química", "T2", 10),
  ]);
  // Média das médias por período seria (20 + 10) / 2 = 15.
  // Sobre todas as notas: (20 + 10 + 10) / 3 = 13.33...
  assert.equal(formatar(r.linhas[0].mediaFinal), "13.3");
}

// --- entradas defeituosas não derrubam nem contaminam ---
{
  const r = montarBoletim([
    nota("Biologia", "T1", 15),
    { subject: null, term: null, score: "nao-numero" },
    { subject: { name: "Biologia" }, term: "T1", score: "16" }, // string numérica
  ]);
  assert.equal(r.linhas.length, 1, "linha inválida descartada, sem criar disciplina fantasma");
  assert.equal(r.linhas[0].valoresPorPeriodo[0], 15.5, "string numérica conta");
}

// --- notas sem disciplina ou período caem num rótulo próprio ---
{
  const r = montarBoletim([{ subject: undefined, term: undefined, score: 8 }]);
  assert.deepEqual(r.periodos, ["—"]);
  assert.equal(r.linhas[0].disciplina, "—");
}

// --- ordenação ---
assert.deepEqual(ordenarPeriodos(["T3", "T1", "T2"]), ["T1", "T2", "T3"]);

console.log("ok — agregação do boletim verificada");

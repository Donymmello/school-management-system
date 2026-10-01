import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { getFeeById } from "../../api/fees.js";
import { getErrorMessage } from "../../api/errors.js";
import { useAuth } from "../../context/AuthContext.jsx";

/*
  Recibo de propina para impressão (docs/project-rules.md, seção 6, item 7).

  Mesmo desenho do boletim: sem biblioteca de PDF, as regras @media print de
  index.css preparam a página e o browser faz o resto. GET /fees/:id já devolve
  propina, aluno e quem confirmou o pagamento numa só chamada.

  REGRA QUE NÃO SE QUEBRA: só uma propina PAGA produz um recibo. Um recibo é um
  documento financeiro — emitir um para uma propina não paga seria fabricar
  prova de um pagamento que não aconteceu. Com estado PENDING a página continua
  a abrir, mas identifica-se como "Aviso de pagamento" e a palavra recibo não
  aparece em lado nenhum.
*/

const METODOS = {
  MANUAL: "Confirmação manual na secretaria",
  WEBHOOK: "Confirmação automática do gateway",
};

function dinheiro(valor, moeda) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return "—";
  return `${numero.toFixed(2)} ${moeda || ""}`.trim();
}

function data(valor, comHoras = false) {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return comHoras ? d.toLocaleString("pt-PT") : d.toLocaleDateString("pt-PT");
}

function Linha({ rotulo, children }) {
  return (
    <TableRow>
      <TableCell sx={{ width: "38%", border: 0, py: 0.75 }}>
        <Typography variant="body2" color="text.secondary">
          {rotulo}
        </Typography>
      </TableCell>
      <TableCell sx={{ border: 0, py: 0.75 }}>
        <Typography variant="body2">{children}</Typography>
      </TableCell>
    </TableRow>
  );
}

export default function FeeReceiptPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFee(await getFeeById(id));
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar a propina."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const paga = fee?.status === "PAID";
  const titulo = paga ? "Recibo de pagamento" : "Aviso de pagamento";

  return (
    <Box>
      <Stack direction="row" spacing={1} className="no-print" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate("/propinas")}>
          Voltar
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintOutlinedIcon />}
          onClick={() => window.print()}
          disabled={loading || Boolean(error)}
        >
          Imprimir / Guardar PDF
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}

      {!loading && fee && !paga && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Esta propina está <strong>pendente</strong>. Não há recibo a emitir — o documento abaixo é
          um aviso de pagamento, com a entidade e a referência para pagar.
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 720 }}>
        <Box className="evitar-corte" sx={{ mb: 2 }}>
          <Typography variant="h6" component="h1">
            {user?.school?.name || "—"}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {loading ? <Skeleton width={220} /> : titulo}
          </Typography>
        </Box>

        <Divider sx={{ mb: 1 }} />

        {loading && <Skeleton height={180} />}

        {!loading && fee && (
          <>
            <Table size="small">
              <TableBody>
                {/* Número do documento: o id da propina. Não é uma série de
                    recibos numerada — isso exigiria um contador próprio por
                    escola, que o modelo não tem. */}
                <Linha rotulo="Documento nº">{fee.id}</Linha>
                <Linha rotulo="Aluno">
                  {fee.student?.name || "—"}
                  {fee.student?.studentCode ? ` (${fee.student.studentCode})` : ""}
                </Linha>
                <Linha rotulo="Descrição">{fee.description || "—"}</Linha>
                <Linha rotulo="Valor">
                  <strong>{dinheiro(fee.amount, fee.currency)}</strong>
                </Linha>
                <Linha rotulo="Vencimento">{data(fee.dueDate)}</Linha>

                {paga ? (
                  <>
                    <Linha rotulo="Pago em">{data(fee.paidAt, true)}</Linha>
                    <Linha rotulo="Forma de confirmação">
                      {METODOS[fee.paymentMethod] || fee.paymentMethod || "—"}
                    </Linha>
                    <Linha rotulo="Recebido por">{fee.confirmedBy?.name || "—"}</Linha>
                  </>
                ) : (
                  <>
                    <Linha rotulo="Estado">Pendente</Linha>
                    <Linha rotulo="Entidade">{fee.entity || "—"}</Linha>
                    <Linha rotulo="Referência">{fee.reference || "—"}</Linha>
                  </>
                )}

                {fee.notes && <Linha rotulo="Observações">{fee.notes}</Linha>}
                <Linha rotulo="Emitido em">{new Date().toLocaleString("pt-PT")}</Linha>
              </TableBody>
            </Table>

            <Divider sx={{ my: 2 }} />

            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {paga
                ? "Comprovativo de pagamento emitido pelo sistema de gestão escolar."
                : "Documento informativo. Não comprova pagamento."}
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}

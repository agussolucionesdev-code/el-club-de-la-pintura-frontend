import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReceiptData {
  ticketNumber: number;
  customerName: string;
  pickedUpBy: string;
  previousBalance: number;
  paymentAmount: number;
  newBalance: number;
  cashierName: string;
}

// 🛡️ TIPADO ESTRICTO (Poka-Yoke): Le explicamos a TypeScript la estructura exacta del plugin
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export const generatePaymentReceipt = (data: ReceiptData) => {
  // Creamos el documento PDF en formato Ticket/A4
  const doc = new jsPDF();

  const currentDate = new Date().toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  // ==========================================
  // CABECERA CORPORATIVA (NEURO-DISEÑO)
  // ==========================================
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(44, 62, 80); // Azul oscuro corporativo
  doc.text("EL CLUB DE LA PINTURA", 14, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(127, 140, 141);
  doc.text("Documento Interno - No válido como factura", 14, 28);

  // ==========================================
  // TÍTULO DEL COMPROBANTE
  // ==========================================
  doc.setFontSize(16);
  doc.setTextColor(39, 174, 96); // Verde Esmeralda (Éxito Financiero)
  doc.setFont("helvetica", "bold");
  doc.text("RECIBO DE INTEGRACIÓN DE SALDO", 14, 45);

  // ==========================================
  // DATOS DE LA OPERACIÓN
  // ==========================================
  doc.setFontSize(11);
  doc.setTextColor(44, 62, 80);
  doc.setFont("helvetica", "normal");

  doc.text(`Fecha y Hora: ${currentDate}`, 14, 55);
  doc.text(`Operador (Caja): ${data.cashierName}`, 14, 61);
  doc.text(`Comprobante Ref: Ticket Original #${data.ticketNumber}`, 14, 67);

  doc.setFont("helvetica", "bold");
  doc.text(`Titular de la Cuenta: ${data.customerName}`, 14, 77);
  doc.setFont("helvetica", "normal");
  doc.text(`Autorizado (Retiró): ${data.pickedUpBy}`, 14, 83);

  // ==========================================
  // TABLA FINANCIERA (AUTOTABLE)
  // ==========================================
  autoTable(doc, {
    startY: 90,
    head: [["Concepto", "Monto"]],
    body: [
      ["Saldo Anterior Pendiente", `$${data.previousBalance.toLocaleString()}`],
      ["Integración Actual (Pago)", `$${data.paymentAmount.toLocaleString()}`],
    ],
    foot: [["NUEVO SALDO RESTANTE", `$${data.newBalance.toLocaleString()}`]],
    theme: "grid",
    headStyles: { fillColor: [44, 62, 80], fontSize: 12, fontStyle: "bold" },
    footStyles: {
      fillColor: data.newBalance === 0 ? [39, 174, 96] : [231, 76, 60],
      fontSize: 14,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { halign: "right", fontStyle: "bold" },
    },
  });

  // ==========================================
  // FOOTER PERSUASIVO (NEURO-COPYWRITING)
  // ==========================================

  // 🛡️ SOLUCIÓN DEL ANY: Hacemos el cast seguro con nuestra interfaz 'jsPDFWithAutoTable'
  const finalY = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 20;

  doc.setFontSize(10);
  doc.setTextColor(127, 140, 141);
  doc.setFont("helvetica", "italic");

  const footerText =
    data.newBalance === 0
      ? "¡Felicitaciones! Su cuenta corriente se encuentra saldada al 100%. Gracias por elegir El Club de la Pintura."
      : "Gracias por confiar en El Club de la Pintura. Mantener su cuenta al día nos permite seguir ofreciéndole los mejores beneficios comerciales.";

  // Dividir texto largo para que no se salga de la hoja
  const splitText = doc.splitTextToSize(footerText, 180);
  doc.text(splitText, 14, finalY);

  // Firma
  doc.setLineWidth(0.5);
  doc.line(130, finalY + 30, 190, finalY + 30);
  doc.setFont("helvetica", "normal");
  doc.text("Firma / Aclaración Cliente", 138, finalY + 36);

  // Dispara la descarga del PDF en el navegador
  doc.save(`Recibo_Pago_Ticket_${data.ticketNumber}.pdf`);
};

import type { Order } from "@/types/order";
import { formatDA, formatDateTime } from "./format";
import { ORDER_TYPE_LABELS } from "./orderLabels";
import { formatVariantLabel } from "./variantLabel";

// Ticket papier volontairement minimal (police monospace, largeur ticket de
// caisse ~72mm). L'iframe évite le blocage des fenêtres pop-up par Chrome.
export function printOrderTicket(order: Order): void {
  const tableLine =
    order.type === "dine_in" && order.table && typeof order.table === "object"
      ? `Table ${order.table.tableN}`
      : ORDER_TYPE_LABELS[order.type];

  const itemsHtml = order.items
    .map((item) => {
      // Défensif : voir variantLabel.ts — même raison
      const selectedExtras = item.selectedExtras ?? [];
      const formulaLine = item.formula
        ? `<div class="sub"><b>${item.formula.name}</b>${item.formula.includes.length ? ` : ${item.formula.includes.join(", ")}` : ""}</div>`
        : "";
      const excludedIngredients = item.excludedIngredients ?? [];
      const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
      const lineTotal = (item.unitPrice + extrasTotal) * item.quantity;
      const variantLabel = formatVariantLabel(item.variantSelected);
      const extrasLine = selectedExtras.length
        ? `<div class="sub">+ ${selectedExtras.map((e) => e.name).join(", ")}</div>`
        : "";
      const excludedLine = excludedIngredients.length
        ? `<div class="sub">Sans : ${excludedIngredients.join(", ")}</div>`
        : "";

      return `
        <div class="item">
          <div class="item-row">
            <span>${item.quantity}x ${item.name}${variantLabel !== "Standard" ? ` (${variantLabel})` : ""}</span>
            <span>${formatDA(lineTotal)}</span>
          </div>
          ${formulaLine}
          ${extrasLine}
          ${excludedLine}
        </div>`;
    })
    .join("");

  const remarkHtml = order.remark
    ? `<div class="remark">Remarque : ${order.remark}</div>`
    : "";

  /**
   * Ligne de remise, avec le code.
   *
   * OBLIGATOIRE sur le papier : le ticket est ce que le client emporte, et un
   * total inférieur à la somme des lignes sans explication est exactement ce
   * qui déclenche un appel le lendemain. `?? 0` couvre les commandes
   * antérieures à la fonctionnalité, qui n'ont pas ce champ.
   */
  const discountAmount = order.discountAmount ?? 0;
  const discountHtml =
    discountAmount > 0
      ? `<div class="item-row discount">
           <span>Remise${order.appliedPromo ? ` ${order.appliedPromo.code} (-${order.appliedPromo.discountPercent}%)` : ""}</span>
           <span>-${formatDA(discountAmount)}</span>
         </div>`
      : "";

  const ticketHtml = `
    <html>
      <head>
        <title>Commande #${order.dailyNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: 'Courier New', monospace; font-size: 13px; width: 72mm; margin: 0 auto; padding: 16px 0; }
          h1 { font-size: 22px; text-align: center; margin: 0 0 4px; }
          .meta { text-align: center; font-size: 12px; margin-bottom: 12px; }
          hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
          .item-row { display: flex; justify-content: space-between; font-weight: bold; }
          .sub { font-size: 11px; padding-left: 12px; color: #333; }
          .discount { margin-top: 4px; }
          .remark { margin-top: 8px; font-style: italic; font-size: 12px; }
          .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 8px; }
        </style>
      </head>
      <body>
        <h1>NIWA FOOD</h1>
        <div class="meta">
          #${order.dailyNumber} · ${tableLine}<br/>
          ${order.client.fullName}${order.client.phone ? ` · ${order.client.phone}` : ""}<br/>
          ${formatDateTime(order.createdAt)}
        </div>
        <hr/>
        ${itemsHtml}
        ${discountHtml}
        ${order.deliveryFee ? `<div class="item-row"><span>Livraison</span><span>${formatDA(order.deliveryFee)}</span></div>` : ""}
        ${remarkHtml}
        <hr/>
        <div class="total-row"><span>TOTAL</span><span>${formatDA(order.totalPrice)}</span></div>
      </body>
    </html>
  `;

  const printFrame = document.createElement("iframe");
  printFrame.setAttribute("aria-hidden", "true");
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";
  // Définir srcdoc avant l'insertion évite qu'Opera ne déclenche onload sur
  // about:blank avant que le contenu du ticket soit écrit.
  printFrame.srcdoc = ticketHtml;

  printFrame.onload = () => {
    const printWindow = printFrame.contentWindow;
    if (!printWindow) {
      printFrame.remove();
      return;
    }

    printWindow.focus();
    printWindow.print();
    printWindow.addEventListener("afterprint", () => printFrame.remove(), {
      once: true,
    });
    // Chrome peut ne pas émettre afterprint si la boîte est annulée.
    window.setTimeout(() => printFrame.remove(), 60_000);
  };

  document.body.appendChild(printFrame);
}

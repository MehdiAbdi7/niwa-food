import { model, Model, Schema } from "mongoose";
import { IOrder } from "../types/models/order.js";
import { STORES } from "../config/stores.js";
import { ORDER_TYPES } from "../config/orderTypes.js";
import { toServiceDate } from "../utils/serviceDate.js";

type OrderModel = Model<IOrder>;

const orderItemExtraSchema = new Schema(
  {
    extraId: { type: Schema.Types.ObjectId, ref: "MenuExtra", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderFormulaSchema = new Schema(
  {
    formulaId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    pricingMode: {
      type: String,
      enum: ["fixed", "supplement"],
      required: true,
    },
    includes: { type: [String], default: [] },
  },
  { _id: false },
);

const orderItemSchema = new Schema(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: { type: String, required: true },
    variantSelected: { type: Schema.Types.Mixed, default: {} },
    unitPrice: { type: Number, required: true, min: 0 },
    selectedExtras: { type: [orderItemExtraSchema], default: [] },
    excludedIngredients: { type: [String], default: [] },
    quantity: { type: Number, required: true, min: 1 },
    formula: { type: orderFormulaSchema, default: undefined },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder, OrderModel>(
  {
    type: {
      type: String,
      // Même source que le validateur et le filtre d'historique : une liste
      // recopiée à trois endroits finit toujours par diverger.
      enum: ORDER_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "ready", "out_for_delivery", "completed", "cancelled"],
      default: "pending",
    },
    store: { type: String, enum: STORES, required: true },
    dailyNumber: { type: Number, required: true },
    // Voir types/models/order.ts pour la règle métier. Estampillée à la
    // création par issueOrderNumber(), jamais recalculée ensuite.
    serviceDate: { type: Date, required: true },
    table: { type: Schema.Types.ObjectId, ref: "Table" },
    client: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "La commande doit contenir au moins un item",
      },
    },
    remark: { type: String, trim: true },
    deliveryFee: { type: Number, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/**
 * Filet de sécurité pour les documents antérieurs à l'ajout de `serviceDate`.
 *
 * `required: true` ne s'applique qu'à la validation, or les vieux documents
 * sont revalidés dès qu'on les modifie : ajouter un article ou fixer des frais
 * de livraison sur une commande d'avant la migration lèverait une
 * ValidationError. Ce hook la remplit à la volée pour que `save()` ne casse
 * jamais — le vrai rattrapage est fait par scripts/backfillServiceDate.ts.
 */
orderSchema.pre("validate", function () {
  if (!this.serviceDate) {
    this.serviceDate = toServiceDate(this.createdAt ?? new Date());
  }
});

// Calcul automatique du totalPrice avant chaque sauvegarde
orderSchema.pre("save", function () {
  const itemsTotal = this.items.reduce((sum, item) => {
    const extrasTotal = item.selectedExtras.reduce(
      (extraSum, extra) => extraSum + extra.price,
      0,
    );
    return sum + (item.unitPrice + extrasTotal) * item.quantity;
  }, 0);

  this.totalPrice = itemsTotal + (this.deliveryFee ?? 0);
});

/**
 * Index de l'historique. C'est LUI qui fait la performance, bien plus que la
 * pagination : sans index, chaque consultation de l'historique déclenche un
 * COLLSCAN, donc la lecture de toute la collection.
 *
 * Ordre suivant la règle ESR (Equality, Sort, Range) :
 *   - status / type / store : toujours des égalités (ou un $in court)
 *   - serviceDate           : à la fois la plage ET le tri principal
 *   - completedAt           : départage deux commandes du même service
 *
 * `type` ET `store` sont TOUJOURS présents dans le filtre, même dans les vues
 * « Tous les types » et « Tous les magasins » — sous forme de `$in` sur la
 * liste complète (voir resolveHistoryTypeFilter / resolveHistoryStoreFilter).
 * Les omettre romprait le préfixe de l'index, et MongoDB retomberait sur un
 * parcours complet de la collection dans les deux vues qui ratissent le plus.
 */
orderSchema.index({
  status: 1,
  type: 1,
  store: 1,
  serviceDate: -1,
  completedAt: -1,
});

/**
 * Index du dashboard : liste des commandes actives et bornage « service en
 * cours », rejoués toutes les 20 secondes par le polling de secours de chaque
 * poste ouvert. Un index de plus coûte à l'écriture, mais ces deux-là sont
 * lus des milliers de fois par jour pour quelques centaines d'écritures.
 */
orderSchema.index({ store: 1, status: 1, createdAt: -1 });

export const Order = model<IOrder, OrderModel>("Order", orderSchema);

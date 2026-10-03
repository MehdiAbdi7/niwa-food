import { model, Model, Schema } from "mongoose";
import { IOrder } from "../types/models/order.js";
import { STORES } from "../config/stores.js";
import { ORDER_TYPES } from "../config/orderTypes.js";
import { toServiceDate } from "../utils/serviceDate.js";
import { computeDiscountAmount, sumItemsTotal } from "../utils/orderTotals.js";

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

/**
 * Instantané du code promo. Voir IOrderPromo pour le pourquoi.
 *
 * `code` et `discountPercent` sont recopiés ici et non lus par populate : le
 * code peut être modifié ou supprimé après coup, l'historique ne doit pas
 * bouger pour autant.
 */
const orderPromoSchema = new Schema(
  {
    promoCodeId: {
      type: Schema.Types.ObjectId,
      ref: "PromoCode",
      required: true,
    },
    code: { type: String, required: true },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    maxDiscountAmount: { type: Number, min: 0 },
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
    // Assigné au passage en livraison, jamais obligatoire — voir le commentaire
    // du type. Absent sur toutes les commandes antérieures : aucun rattrapage
    // n'est nécessaire, un champ absent ne matche simplement aucun livreur.
    deliveryPerson: { type: Schema.Types.ObjectId, ref: "User" },
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
    appliedPromo: { type: orderPromoSchema, default: undefined },
    // Dérivé, jamais saisi : recalculé par le pre("save") ci-dessous.
    discountAmount: { type: Number, default: 0, min: 0 },
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

/**
 * Recalcul intégral du total avant chaque sauvegarde.
 *
 * L'ORDRE DES TROIS LIGNES EST LA RÈGLE MÉTIER, ne pas l'intervertir :
 *   1. articles + extras
 *   2. remise, appliquée sur ce sous-total UNIQUEMENT
 *   3. frais de livraison, ajoutés APRÈS
 *
 * Les frais de livraison échappent volontairement à la remise : c'est ce que
 * le restaurant doit au livreur, le rogner d'une promotion reviendrait à faire
 * payer l'opération commerciale par quelqu'un qui n'y est pour rien.
 *
 * La remise est RECALCULÉE et non lue : `appliedPromo` ne porte qu'un
 * pourcentage et un plafond. C'est ce qui permet à addItemsToOrder et à la
 * fusion dine_in de rester justes — un montant figé en dinars deviendrait faux
 * à la première modification du panier.
 */
orderSchema.pre("save", function () {
  const itemsTotal = sumItemsTotal(this.items);

  this.discountAmount = this.appliedPromo
    ? computeDiscountAmount(
        itemsTotal,
        this.appliedPromo.discountPercent,
        this.appliedPromo.maxDiscountAmount,
      )
    : 0;

  this.totalPrice = itemsTotal - this.discountAmount + (this.deliveryFee ?? 0);
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

/**
 * Index de l'écran livreur : c'est EXACTEMENT la requête de
 * GET /orders/my-deliveries, rejouée à chaque ouverture de sa page et à chaque
 * invalidation socket. Partiel — les commandes sans livreur n'y entrent pas,
 * donc l'index reste minuscule quel que soit le volume de l'historique.
 */
orderSchema.index(
  { deliveryPerson: 1, status: 1, createdAt: 1 },
  { partialFilterExpression: { deliveryPerson: { $exists: true } } },
);

/**
 * Index des statistiques de promotion : « combien ce code a-t-il rapporté ».
 *
 * Partiel lui aussi — l'immense majorité des commandes n'a pas de code promo,
 * donc l'index reste petit même sur un historique fourni. Il n'est pas utilisé
 * aujourd'hui par une route, mais il coûte presque rien et évite un COLLSCAN
 * le jour où tu ajoutes un bilan par code.
 */
orderSchema.index(
  { "appliedPromo.code": 1, serviceDate: -1 },
  { partialFilterExpression: { appliedPromo: { $exists: true } } },
);

export const Order = model<IOrder, OrderModel>("Order", orderSchema);

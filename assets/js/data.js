/* Just Moreish — site data. Used by the browser (window.JM) and by tools/build.mjs.
   Prices marked `assumed: true` are placeholders for the client to confirm. */
(function (root) {
  const SITE = {
    name: "Just Moreish",
    tagline: "Home of the Ice-Cream Cheesecake",
    whatsapp: "27645058652",
    whatsappDisplay: "064 505 8652",
    email: "justmoreish@gmail.com",
    instagram: "https://www.instagram.com/justmoreish/",
    handle: "@justmoreish",
    city: "Johannesburg",
    store: "The Parlour",
    builder: "Make It Moreish",
  };

  // 3D scroll story: frames/products/<id>/0001-0072.webp (square, one set for every screen)
  const CAKE_BEATS = ["intro", "topping", "icecream", "base", "outro"];

  const PRODUCTS = [
    {
      id: "original", name: "Original", cat: "cheesecake", price: 55, assumed: true, colour: "#FFC3CC", ink: "#B83A63",
      kind: "cake", frames: 72, featured: true,
      short: "Vanilla cheesecake ice-cream, pink meringue kiss.",
      line: "The one that started it all.",
      beats: {
        intro: ["The Original", "Vanilla-bean cheesecake ice-cream on a buttery biscuit base. The one that started it all."],
        topping: ["Piped by hand", "A blush-pink meringue kiss: crisp on the outside, marshmallow-soft in the middle."],
        icecream: ["Cheesecake, churned", "Cream-cheese rich and frozen solid, so every spoon is half ice-cream, half cheesecake."],
        base: ["The crunch", "Biscuit crumbs and butter, pressed by hand into a base that snaps when your spoon hits it."],
        outro: ["Yours, frozen", "Single-serve, palm-sized, gone in about six spoons."],
      },
      notes: ["Vanilla", "Cream cheese", "Meringue", "Biscuit"],
    },
    {
      id: "coffee", name: "Coffee", cat: "cheesecake", price: 55, assumed: true, colour: "#B3AFE6", ink: "#5B4FB0",
      kind: "cake", frames: 72, featured: true,
      short: "Made with our own Arabica beans, topped with cream.",
      line: "For people who take dessert with a double shot.",
      beats: {
        intro: ["Coffee", "Our own 100% Arabica, folded into cheesecake ice-cream. Dessert with a double shot."],
        topping: ["Beans & cream", "Whole roasted beans and a swirl of whipped cream. Yes, you can eat the beans."],
        icecream: ["Cappuccino-coloured", "Milk-chocolate and almond notes from the beans, cream cheese from the cheesecake."],
        base: ["Biscuit base", "Buttery crumb to cut through the coffee."],
        outro: ["Order a box", "Goes very well with an actual coffee. Just saying."],
      },
      notes: ["Arabica", "Cream", "Milk chocolate", "Biscuit"],
    },
    {
      id: "caramel", name: "Caramel", cat: "cheesecake", price: 55, assumed: true, colour: "#F7E7A6", ink: "#9A6B12",
      kind: "cake", frames: 72, featured: true,
      short: "Golden caramel cheesecake ice-cream, crunchy caramel bites.",
      line: "Golden, buttery and slightly dangerous.",
      beats: {
        intro: ["Caramel", "Golden caramel cheesecake ice-cream. Buttery, toasty and slightly dangerous."],
        topping: ["Caramel bites", "Glossy little caramel pieces that crack, then chew."],
        icecream: ["Burnt-sugar gold", "Caramel all the way through, not just on top."],
        base: ["Biscuit base", "A crunchy floor for all that caramel."],
        outro: ["Say when", "You won't."],
      },
      notes: ["Caramel", "Butter", "Cream cheese", "Biscuit"],
    },
    {
      id: "bubblegum", name: "Bubblegum", cat: "cheesecake", price: 55, assumed: true, colour: "#9FE6DA", ink: "#1F8A79",
      kind: "cake", frames: 72, featured: true,
      short: "Sky-blue bubblegum ice-cream, gumballs and sprinkles.",
      line: "The kids' pick. And the adults'.",
      beats: {
        intro: ["Bubblegum", "Sky-blue bubblegum cheesecake ice-cream. The kids' pick (and the adults')."],
        topping: ["Gumballs & sprinkles", "Glossy gumballs, a cream swirl and a confetti of sprinkles."],
        icecream: ["Party-blue", "Sweet, creamy and exactly as fun as it looks."],
        base: ["Biscuit base", "Still a proper cheesecake underneath."],
        outro: ["Party box", "Order six for the party table."],
      },
      notes: ["Bubblegum", "Sprinkles", "Cream", "Biscuit"],
    },
    {
      id: "marshmallow", name: "Marshmallow", cat: "cheesecake", price: 55, assumed: true, colour: "#DDA3DA", ink: "#9A3C96",
      kind: "cake", frames: 72, featured: true,
      short: "Strawberry-pink ice-cream under a pile of pastel mallows.",
      line: "Soft on soft on soft.",
      beats: {
        intro: ["Marshmallow", "Pink cheesecake ice-cream under a pile of pastel marshmallows."],
        topping: ["Mallow mountain", "Pink, blue and white marshmallows, stacked by hand."],
        icecream: ["Strawberry-pink", "Light, creamy and very, very soft."],
        base: ["Biscuit base", "The one crunchy thing in this whole situation."],
        outro: ["Soft spot", "We know you have one."],
      },
      notes: ["Marshmallow", "Strawberry", "Cream cheese", "Biscuit"],
    },
    {
      id: "rose", name: "Rose", cat: "cheesecake", price: 55, assumed: true, colour: "#F9CFD9", ink: "#B8335D",
      kind: "cake", frames: 72,
      short: "Rose cheesecake ice-cream, petals and pistachio.",
      line: "Fragrant, floral and a little bit fancy.",
      beats: {
        intro: ["Rose", "Rose-scented cheesecake ice-cream. Fragrant, floral, a little bit fancy."],
        topping: ["Petals & pistachio", "Dried rose petals, a cream kiss and crushed pistachio."],
        icecream: ["Blush pink", "Floral without tasting like perfume. We checked."],
        base: ["Biscuit base", "Buttery crumb, pressed by hand."],
        outro: ["For the dessert table", "The one everyone photographs first."],
      },
      notes: ["Rose", "Pistachio", "Cream", "Biscuit"],
    },
    {
      id: "nutella", name: "Nutella", cat: "cheesecake", price: 55, assumed: true, colour: "#E6D7C3", ink: "#7A4B25",
      kind: "cake", frames: 72,
      short: "Choc-hazelnut cheesecake ice-cream, chocolate balls, hazelnuts.",
      line: "Choc-hazelnut, all the way down.",
      beats: {
        intro: ["Nutella", "Chocolate-hazelnut cheesecake ice-cream. All the way down."],
        topping: ["Balls & drizzle", "Chocolate balls, toasted hazelnuts and a ring of glossy chocolate."],
        icecream: ["Hazelnut brown", "Rich, nutty and very hard to share."],
        base: ["Biscuit base", "Crunch to balance the chocolate."],
        outro: ["Don't share", "Or order two."],
      },
      notes: ["Hazelnut", "Chocolate", "Cream cheese", "Biscuit"],
    },
    {
      id: "gelato", name: "Gelato Tub", cat: "tubs", price: 185, assumed: true, colour: "#CFE3F6", ink: "#2F6EA8",
      kind: "tub", frames: 72, seq: "tub", img: "tub", featured: true, unit: "1 litre",
      short: "Luxury by the litre, handcrafted in small batches.",
      line: "Luxury now comes by the litre.",
      options: { label: "Flavour", values: ["Pistachio", "Choc-Hazelnut", "Kinderjoy"] },
      beats: {
        intro: ["Gelato, by the litre", "A full litre of handcrafted gelato for the freezer at home."],
        lid: ["Lid off", "Choc-Hazelnut, Kinderjoy or Pistachio. Choose wisely, or don't choose."],
        scoop: ["The first scoop", "Dense, smooth and churned slowly, so it scoops in curls."],
        label: ["One litre", "Packed in the tub with our pastel stripe on it."],
        outro: ["Freezer goals", "Keep frozen. Share, if you must."],
      },
      notes: ["Handcrafted", "1 litre", "Small batch"],
    },
    {
      id: "beans", name: "Coffee Beans", cat: "coffee", price: 125, assumed: true, colour: "#B3AFE6", ink: "#5B4FB0",
      kind: "bag", frames: 72, seq: "bag", img: "bag", featured: true, unit: "bag",
      short: "100% Arabica. Milk chocolate, almond, apple.",
      line: "The beans behind our coffee bar.",
      options: { label: "Size", values: ["250 g", "1 kg"], prices: [125, 420] },
      beats: {
        intro: ["Just Moreish beans", "100% Arabica, roasted for us. The same beans as our coffee bar and our Coffee cheesecake."],
        turn: ["250 g or 1 kg", "A bag for the week, or a kilo for the office."],
        beans: ["Freshly roasted", "Whole beans, so you grind them right before you brew."],
        label: ["Tasting notes", "Milk chocolate · Almond · Apple."],
        outro: ["Brew it your way", "Plunger, espresso or moka pot."],
      },
      notes: ["Milk chocolate", "Almond", "Apple"],
    },
    {
      id: "croissant", name: "Gourmet Croissants", cat: "croissants", price: 45, assumed: true, colour: "#F7E7A6", ink: "#9A6B12",
      kind: "cro", frames: 72, featured: true, unit: "croissant",
      short: "Buttery, flaky and filled: Nutella, Lotus or Pistachio.",
      line: "For weddings, corporate breakfasts and Tuesdays.",
      options: { label: "Flavour", values: ["Nutella", "Lotus", "Pistachio"] },
      beats: {
        intro: ["Gourmet croissants", "Golden, buttery, layered by hand, then filled and finished with a drizzle."],
        turn: ["Three ways", "Nutella, Lotus Biscoff or pistachio cream. All three is also an answer."],
        drizzle: ["The drizzle", "Glossy on top, generous inside, crumbs on purpose."],
        layers: ["Flaky layers", "Laminated pastry that shatters, then goes soft and buttery."],
        outro: ["By the dozen", "Order for the office, the brunch or the dessert table."],
      },
      notes: ["Nutella", "Lotus", "Pistachio", "Butter pastry"],
    },
  ];

  const BUILDER = {
    types: ["Ice-Cream Cheesecake", "New York Baked Cheesecake", "Ice-Cream Cake"],
    bases: [
      { name: "Tennis", colour: "#E9C98E" }, { name: "Digestive", colour: "#C6955A" }, { name: "Oreo", colour: "#2E2420" },
      { name: "Lotus", colour: "#B5743A" }, { name: "Ginger", colour: "#B9783E" },
    ],
    flavours: [
      { name: "Vanilla", colour: "#F3E6CF" }, { name: "Caramel", colour: "#E3B677" }, { name: "Coffee", colour: "#B88E6E" },
      { name: "Lotus", colour: "#D49A5E" }, { name: "Nutella", colour: "#8E5D3F" }, { name: "Oreo", colour: "#D9D4CE", speckle: "#2E2420" },
      { name: "Coconut", colour: "#FBF7F0" }, { name: "Lindt", colour: "#6A3F2A" }, { name: "Strawberry", colour: "#F3AEBE" },
    ],
    toppings: [
      { name: "Fresh Strawberries", colour: "#E0405A", shape: "berry" }, { name: "Ferrero Rocher", colour: "#B88A3A", shape: "ball" },
      { name: "Raffaello", colour: "#FBF6EE", shape: "ball" }, { name: "Rolo", colour: "#8A5A2E", shape: "drum" },
      { name: "Lindt", colour: "#C9232F", shape: "ball" }, { name: "Toblerone", colour: "#D9B26A", shape: "tri" },
      { name: "Whispers", colour: "#5A3524", shape: "ball" }, { name: "Cadbury", colour: "#4B1E78", shape: "bar" },
      { name: "Marshmallow", colour: "#F7BFD0", shape: "drum" }, { name: "Oreo", colour: "#2E2420", shape: "disc" },
    ],
    sizes: ["22 cm", "25 cm"],
    nittyGritty: [
      "WhatsApp or email your order and we'll prepare a quote.",
      "No booking is secured until a 50% non-refundable deposit or full payment is received.",
      "If paying the remaining 50%, please pay via EFT before collection or delivery.",
      "We are not held responsible once your cheesecake has been collected or delivered. Keep frozen!",
      "Cakes may contain traces of nuts.",
      "Most of all, have fun building your cake!",
    ],
  };

  const COFFEE_MENU = [
    { name: "Cappuccino", note: "Double shot, silky milk" },
    { name: "Hot Chocolate", note: "Proper, thick and cocoa-dark" },
    { name: "Dirty Chai", note: "Spiced chai with a shot of espresso" },
    { name: "Tea", note: "Classic or rooibos" },
    { name: "Coffee Freezo", note: "Frozen, blended, very cold" },
    { name: "Frappé series", note: "Cappuccino frappé · frappuccino" },
  ];

  // flavours are placeholders (assumed) until the client confirms their shake menu
  const SHAKES = [
    { name: "Thick Chocolate", note: "Dark cocoa, whipped cream", colour: "#8E5D3F", assumed: true },
    { name: "Strawberry", note: "Pink, cold, classic", colour: "#F3AEBE", assumed: true },
    { name: "Vanilla Bean", note: "Proper vanilla ice-cream, blended thick", colour: "#F3E6CF", assumed: true },
    { name: "Bubblegum", note: "Sky-blue, sprinkles on top", colour: "#9ECBEA", assumed: true },
    { name: "Lotus", note: "Biscoff crumble and caramel", colour: "#D49A5E", assumed: true },
    { name: "Oreo", note: "Cookies-and-cream, extra crumbs", colour: "#D9D4CE", assumed: true },
  ];

  const STATIONS = [
    { id: "coffee", name: "Live coffee bar", text: "Baristas, our own Arabica, hot chocolate and dirty chai, served all night.", colour: "#B3AFE6" },
    { id: "icecream", name: "Ice-cream station", text: "Handcrafted ice-cream and sorbets, flavoured to your theme.", colour: "#9FE6DA" },
    { id: "freezo", name: "Freezo & frappé", text: "Thick shakes, coffee freezos and frappés for hot Highveld days.", colour: "#CFE3F6" },
    { id: "dessert", name: "Dessert tables", text: "Ice-cream cheesecakes, ice-cream cakes and logs, styled for the table.", colour: "#FFC3CC" },
    { id: "croissant", name: "Gourmet croissants", text: "Nutella, Lotus and pistachio croissants for mornings and corporate events.", colour: "#F7E7A6" },
  ];

  const data = { SITE, PRODUCTS, BUILDER, COFFEE_MENU, SHAKES, STATIONS, CAKE_BEATS };
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  else root.JM = data;
})(typeof window !== "undefined" ? window : globalThis);

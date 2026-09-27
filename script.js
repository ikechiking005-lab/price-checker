// This array holds all price reports.
// Each price is an object with: item, price, location
let prices = [
  { item: "garri", price: "₦2,000 - ₦2,200 per paint bucket", location: "Yaba Market" },
  { item: "beans", price: "₦3,500 - ₦3,800 per paint bucket", location: "Yaba Market" },
  { item: "rice", price: "₦75,000 - ₦80,000 per 50kg bag", location: "Mile 12 Market" },
  { item: "fuel", price: "₦900 - ₦950 per litre", location: "Lagos" }
];

// Runs when the page first loads
window.onload = function () {
  renderAllPrices();
};

// Opens/closes the slide-out menu
function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("show");
}

// Search for a specific item
function searchPrice() {
  const input = document.getElementById("searchBox").value.toLowerCase().trim();
  const resultDiv = document.getElementById("result");

  const matches = prices.filter(p => p.item.toLowerCase().includes(input));

  if (input === "") {
    resultDiv.innerHTML = "Please type an item to search.";
    return;
  }

  if (matches.length > 0) {
    resultDiv.innerHTML = matches
      .map(p => `${capitalize(p.item)}: ${p.price} (${p.location})`)
      .join("<br>");
  } else {
    resultDiv.innerHTML = `No results for "${input}" yet. Be the first to add it below!`;
  }
}

// Add a new price report
function addPrice() {
  const item = document.getElementById("itemName").value.trim();
  const price = document.getElementById("itemPrice").value.trim();
  const location = document.getElementById("itemLocation").value.trim();
  const status = document.getElementById("addStatus");

  if (item === "" || price === "" || location === "") {
    status.innerHTML = "⚠️ Please fill in all three fields.";
    return;
  }

  prices.push({ item: item, price: price, location: location });

  status.innerHTML = "✅ Price added! Thank you.";

  // Clear the input boxes
  document.getElementById("itemName").value = "";
  document.getElementById("itemPrice").value = "";
  document.getElementById("itemLocation").value = "";

  renderAllPrices();
}

// Show every price currently stored
function renderAllPrices() {
  const container = document.getElementById("allPrices");
  container.innerHTML = prices
    .map(p => `<div class="price-item"><strong>${capitalize(p.item)}</strong> — ${p.price} <br><small>${p.location}</small></div>`)
    .join("");
}

// Helper: makes the first letter uppercase (garri -> Garri)
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
    }
                                                   

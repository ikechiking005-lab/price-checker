// ===== FIREBASE SETUP =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFtah1h4C02cMSw10nyEuuIWLoS2JnNXc",
  authDomain: "naijaprice-cb736.firebaseapp.com",
  projectId: "naijaprice-cb736",
  storageBucket: "naijaprice-cb736.firebasestorage.app",
  messagingSenderId: "446042692683",
  appId: "1:446042692683:web:3ffe1cf803432f5ea301ce",
  measurementId: "G-5FJRMGT6EY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Keeps track of the currently logged-in user's role ("buyer", "pending_seller", "verified_seller")
let currentUserRole = null;

// ===== PRICE DATA (still in-memory for now — Phase 3 will save this permanently) =====
let prices = [
  { item: "garri", price: "₦2,000 - ₦2,200 per paint bucket", location: "Yaba Market" },
  { item: "beans", price: "₦3,500 - ₦3,800 per paint bucket", location: "Yaba Market" },
  { item: "rice", price: "₦75,000 - ₦80,000 per 50kg bag", location: "Mile 12 Market" },
  { item: "fuel", price: "₦900 - ₦950 per litre", location: "Lagos" }
];

// ===== RUNS AS SOON AS THE PAGE LOADS =====
renderAllPrices();

// Watches for login/logout changes automatically
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Look up this user's role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.exists() ? userDoc.data() : { role: "buyer", name: user.email };
    currentUserRole = userData.role;
    showLoggedInView(userData.name || user.email, currentUserRole);
  } else {
    currentUserRole = null;
    showLoggedOutView();
  }
});

// ===== UI SWITCHING: BUYER TAB / SELLER TAB =====
function showRoleForm(role) {
  const buyerForm = document.getElementById("buyerForm");
  const sellerForm = document.getElementById("sellerForm");
  const buyerTab = document.getElementById("buyerTab");
  const sellerTab = document.getElementById("sellerTab");

  if (role === "buyer") {
    buyerForm.style.display = "block";
    sellerForm.style.display = "none";
    buyerTab.classList.add("active");
    sellerTab.classList.remove("active");
  } else {
    buyerForm.style.display = "none";
    sellerForm.style.display = "block";
    buyerTab.classList.remove("active");
    sellerTab.classList.add("active");
  }
}

// ===== SIGN UP: BUYER =====
async function signUpBuyer() {
  const name = document.getElementById("buyerName").value.trim();
  const email = document.getElementById("buyerEmail").value.trim();
  const password = document.getElementById("buyerPassword").value;
  const status = document.getElementById("authStatus");

  if (!name || !email || !password) {
    status.innerHTML = "⚠️ Please fill in all fields.";
    return;
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", result.user.uid), {
      name: name,
      email: email,
      role: "buyer"
    });
    status.innerHTML = "✅ Account created! You're now logged in.";
  } catch (error) {
    status.innerHTML = "❌ " + friendlyError(error);
  }
}

// ===== SIGN UP: SELLER (goes into "pending" until approved) =====
async function signUpSeller() {
  const name = document.getElementById("sellerName").value.trim();
  const shop = document.getElementById("sellerShop").value.trim();
  const market = document.getElementById("sellerMarket").value.trim();
  const phone = document.getElementById("sellerPhone").value.trim();
  const email = document.getElementById("sellerEmail").value.trim();
  const password = document.getElementById("sellerPassword").value;
  const status = document.getElementById("authStatus");

  if (!name || !shop || !market || !phone || !email || !password) {
    status.innerHTML = "⚠️ Please fill in all fields.";
    return;
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", result.user.uid), {
      name: name,
      shopName: shop,
      market: market,
      phone: phone,
      email: email,
      role: "pending_seller"
    });
    status.innerHTML = "✅ Application submitted! Your account is pending review before you can add products.";
  } catch (error) {
    status.innerHTML = "❌ " + friendlyError(error);
  }
}

// ===== TOGGLE LOGIN BOX OPEN/CLOSED =====
function toggleLoginBox() {
  const box = document.getElementById("loginBox");
  const link = document.getElementById("loginToggleLink");
  if (box.style.display === "none") {
    box.style.display = "block";
    link.innerText = "Hide login";
  } else {
    box.style.display = "none";
    link.innerText = "Already have an account? Log in";
  }
}

// ===== FORGOT PASSWORD =====
async function resetPassword() {
  const status = document.getElementById("authStatus");
  const email = document.getElementById("loginEmail").value.trim();

  if (!email) {
    status.innerHTML = "⚠️ Please type your email above first, then tap 'Forgot password?' again.";
    document.getElementById("loginBox").style.display = "block";
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    status.innerHTML = "✅ Password reset email sent. Please check your inbox.";
  } catch (error) {
    status.innerHTML = "❌ " + friendlyError(error);
  }
}

// ===== LOG IN =====
async function logIn() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const status = document.getElementById("authStatus");

  if (!email || !password) {
    status.innerHTML = "⚠️ Please enter your email and password.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    status.innerHTML = "";
  } catch (error) {
    status.innerHTML = "❌ " + friendlyError(error);
  }
}

// ===== LOG OUT =====
async function logOut() {
  await signOut(auth);
}

// ===== SHOW LOGGED-IN VIEW =====
function showLoggedInView(name, role) {
  document.getElementById("loggedOutView").style.display = "none";
  document.getElementById("welcomeName").innerText = name;

  // Show account status (name, role, logout) inside the slide-out menu instead of on the main page
  document.getElementById("menuAccountStatus").style.display = "block";
  document.getElementById("accountMenuLink").style.display = "none";

  // Unlock the marketplace (search, categories, prices, about) now that they're logged in
  document.getElementById("marketplaceContent").style.display = "block";
  document.getElementById("aboutMenuLink").style.display = "block";

  const roleStatus = document.getElementById("roleStatus");
  const addPriceSection = document.getElementById("addPrice");
  const addPriceNote = document.getElementById("addPriceNote");
  const addPriceForm = document.getElementById("addPriceForm");

  const addPriceMenuLink = document.getElementById("addPriceMenuLink");

  if (role === "buyer") {
    // Buyers never need to see the seller "Add Product" section at all
    roleStatus.innerHTML = "You're signed in as a <strong>Buyer</strong>.";
    addPriceSection.style.display = "none";
    addPriceMenuLink.style.display = "none";
  } else if (role === "pending_seller") {
    roleStatus.innerHTML = "⏳ Your seller account is <strong>still under review</strong>. Check back soon — you'll see a status update here once it's decided.";
    addPriceSection.style.display = "block";
    addPriceMenuLink.style.display = "block";
    addPriceNote.innerHTML = "Your seller account is still pending review.";
    addPriceForm.style.display = "none";
  } else if (role === "suspended") {
    roleStatus.innerHTML = "⛔ Your seller account has been <strong>suspended</strong>. Please contact us for more information.";
    addPriceSection.style.display = "none";
    addPriceMenuLink.style.display = "none";
  } else if (role === "rejected") {
    roleStatus.innerHTML = "😔 Your seller application was <strong>not approved</strong> this time. You can still use NaijaPrice as a buyer, or contact us to ask about your application.";
    addPriceSection.style.display = "none";
    addPriceMenuLink.style.display = "none";
  } else if (role === "verified_seller") {
    roleStatus.innerHTML = "✅ You're a <strong>Verified Seller</strong>. You can add products below.";
    addPriceSection.style.display = "block";
    addPriceMenuLink.style.display = "block";
    addPriceNote.innerHTML = "";
    addPriceForm.style.display = "block";
  } else if (role === "admin") {
    roleStatus.innerHTML = "🛠️ You're logged in as <strong>Admin</strong>.";
    addPriceSection.style.display = "block";
    addPriceMenuLink.style.display = "block";
    addPriceNote.innerHTML = "";
    addPriceForm.style.display = "block";
    renderAdminProfileHeader(name);
  }

  // Show the admin panel link/section only for admins
  const adminSection = document.getElementById("adminSection");
  const adminMenuLink = document.getElementById("adminMenuLink");
  if (role === "admin") {
    adminSection.style.display = "block";
    adminMenuLink.style.display = "block";
    loadPendingSellers();
  } else {
    adminSection.style.display = "none";
    adminMenuLink.style.display = "none";
  }
}

// ===== SHOW LOGGED-OUT VIEW =====
function showLoggedOutView() {
  document.getElementById("loggedOutView").style.display = "block";
  document.getElementById("menuAccountStatus").style.display = "none";
  document.getElementById("accountMenuLink").style.display = "block";
  document.getElementById("addPrice").style.display = "none";
  document.getElementById("adminSection").style.display = "none";
  document.getElementById("adminMenuLink").style.display = "none";
  document.getElementById("marketplaceContent").style.display = "none";
  document.getElementById("aboutMenuLink").style.display = "none";
  document.getElementById("addPriceMenuLink").style.display = "none";
}

// ===== ADMIN: LOAD ALL PENDING SELLERS + STATS =====
async function loadPendingSellers() {
  const listDiv = document.getElementById("pendingSellersList");
  listDiv.innerHTML = "Loading...";

  // Load every user once, then count roles locally (fine at this small scale)
  const allSnapshot = await getDocs(collection(db, "users"));
  let totalCount = 0, buyerCount = 0, pendingCount = 0, verifiedCount = 0;
  const pendingUsers = [];

  allSnapshot.forEach((docSnap) => {
    totalCount++;
    const u = docSnap.data();
    if (u.role === "buyer") buyerCount++;
    if (u.role === "pending_seller") { pendingCount++; pendingUsers.push({ id: docSnap.id, ...u }); }
    if (u.role === "verified_seller") verifiedCount++;
  });

  document.getElementById("statTotal").innerText = totalCount;
  document.getElementById("statBuyers").innerText = buyerCount;
  document.getElementById("statPending").innerText = pendingCount;
  document.getElementById("statVerified").innerText = verifiedCount;

  if (pendingUsers.length === 0) {
    listDiv.innerHTML = "<p>No pending sellers right now. 🎉</p>";
    return;
  }

  let html = "";
  pendingUsers.forEach((u) => {
    html += `
      <div class="pending-card">
        <p><strong>${u.name}</strong></p>
        <p>🏪 ${u.shopName} — ${u.market}</p>
        <p>📞 ${u.phone}</p>
        <p>✉️ ${u.email}</p>
        <button onclick="approveSeller('${u.id}')" class="approve-btn">✅ Approve</button>
        <button onclick="rejectSeller('${u.id}')" class="reject-btn">❌ Reject</button>
      </div>
    `;
  });
  listDiv.innerHTML = html;
}

// ===== ADMIN: TOGGLE DASHBOARD VISIBILITY =====
function toggleAdminDashboard() {
  const body = document.getElementById("adminDashboardBody");
  const isOpen = body.style.display === "block";
  body.style.display = isOpen ? "none" : "block";
  if (!isOpen) loadPendingSellers();
}

// ===== ADMIN: TOGGLE THE EDIT NAME/PASSWORD BOX =====
function toggleEditProfile() {
  const box = document.getElementById("editProfileBox");
  box.style.display = box.style.display === "none" ? "block" : "none";
}

// ===== ADMIN: FILL IN THE PROFILE HEADER (name + avatar initials) =====
function renderAdminProfileHeader(name) {
  document.getElementById("adminProfileName").innerText = name;
  const initials = name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  document.getElementById("adminAvatar").innerText = initials || "A";
}

// ===== ADMIN: UPDATE MY OWN DISPLAY NAME =====
async function updateMyName() {
  const newName = document.getElementById("adminNameInput").value.trim();
  const status = document.getElementById("profileStatus");

  if (!newName) {
    status.innerHTML = "⚠️ Please type a name first.";
    return;
  }

  try {
    await updateProfile(auth.currentUser, { displayName: newName });
    await setDoc(doc(db, "users", auth.currentUser.uid), { name: newName }, { merge: true });
    document.getElementById("welcomeName").innerText = newName;
    renderAdminProfileHeader(newName);
    status.innerHTML = "✅ Name updated.";
  } catch (error) {
    status.innerHTML = "❌ " + friendlyError(error);
  }
}

// ===== ADMIN: UPDATE MY OWN PASSWORD =====
async function updateMyPassword() {
  const newPassword = document.getElementById("adminNewPassword").value;
  const status = document.getElementById("profileStatus");

  if (!newPassword || newPassword.length < 6) {
    status.innerHTML = "⚠️ Password must be at least 6 characters.";
    return;
  }

  try {
    await updatePassword(auth.currentUser, newPassword);
    status.innerHTML = "✅ Password updated.";
    document.getElementById("adminNewPassword").value = "";
  } catch (error) {
    if (error.code && error.code.includes("requires-recent-login")) {
      status.innerHTML = "⚠️ For security, please log out and log back in, then try changing your password again.";
    } else {
      status.innerHTML = "❌ " + friendlyError(error);
    }
  }
}

// ===== ADMIN: SUSPEND A VERIFIED SELLER (e.g. for a reported problem) =====
async function suspendSeller(userId) {
  const sure = confirm("Suspend this seller? They will lose their verified status until re-approved.");
  if (!sure) return;
  await updateDoc(doc(db, "users", userId), { role: "suspended" });
  loadPendingSellers();
}

// ===== ADMIN: APPROVE A SELLER =====
async function approveSeller(userId) {
  await updateDoc(doc(db, "users", userId), { role: "verified_seller" });
  loadPendingSellers();
}

// ===== ADMIN: REJECT A SELLER (keeps a record of the rejection, doesn't silently become "buyer") =====
async function rejectSeller(userId) {
  await updateDoc(doc(db, "users", userId), { role: "rejected" });
  loadPendingSellers();
}

// ===== MENU TOGGLE =====
function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("show");
}

// ===== SEARCH FOR A PRICE =====
function searchPrice() {
  const input = document.getElementById("searchBox").value.toLowerCase().trim();
  const resultDiv = document.getElementById("result");

  if (input === "") {
    resultDiv.innerHTML = "Please type an item to search.";
    return;
  }

  const matches = prices.filter(p => p.item.toLowerCase().includes(input));

  if (matches.length > 0) {
    resultDiv.innerHTML = matches
      .map(p => `${capitalize(p.item)}: ${p.price} (${p.location})`)
      .join("<br>");
  } else {
    resultDiv.innerHTML = `No results for "${input}" yet.`;
  }
}

// ===== ADD A NEW PRICE (only reachable by verified sellers, UI-gated) =====
function addPrice() {
  const item = document.getElementById("itemName").value.trim();
  const price = document.getElementById("itemPrice").value.trim();
  const location = document.getElementById("itemLocation").value.trim();
  const status = document.getElementById("addStatus");

  if (currentUserRole !== "verified_seller") {
    status.innerHTML = "⚠️ Only verified sellers can add prices.";
    return;
  }

  if (item === "" || price === "" || location === "") {
    status.innerHTML = "⚠️ Please fill in all three fields.";
    return;
  }

  prices.push({ item: item, price: price, location: location });
  status.innerHTML = "✅ Price added! Thank you.";

  document.getElementById("itemName").value = "";
  document.getElementById("itemPrice").value = "";
  document.getElementById("itemLocation").value = "";

  renderAllPrices();
}

// ===== SHOW ALL PRICES =====
function renderAllPrices() {
  const container = document.getElementById("allPrices");
  container.innerHTML = prices
    .map(p => `<div class="price-item"><strong>${capitalize(p.item)}</strong> — ${p.price} <br><small>${p.location}</small></div>`)
    .join("");
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Turns technical Firebase error codes into plain, human messages
function friendlyError(error) {
  const code = error.code || "";
  if (code.includes("email-already-in-use")) {
    return "This email is already registered. Please log in instead.";
  }
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Incorrect email or password. Please try again.";
  }
  if (code.includes("weak-password")) {
    return "Please choose a password with at least 6 characters.";
  }
  if (code.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (code.includes("network-request-failed")) {
    return "Network error. Please check your connection and try again.";
  }
  if (code.includes("too-many-requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return "Something went wrong (" + code + "). Please try again.";
}

// Make these functions callable from onclick="" in the HTML
// (needed because this file is a "module", which doesn't expose functions globally by default)
window.showRoleForm = showRoleForm;
window.signUpBuyer = signUpBuyer;
window.signUpSeller = signUpSeller;
window.logIn = logIn;
window.logOut = logOut;
window.toggleMenu = toggleMenu;
window.searchPrice = searchPrice;
window.addPrice = addPrice;
window.approveSeller = approveSeller;
window.rejectSeller = rejectSeller;
window.suspendSeller = suspendSeller;
window.updateMyName = updateMyName;
window.updateMyPassword = updateMyPassword;
window.toggleAdminDashboard = toggleAdminDashboard;
window.toggleEditProfile = toggleEditProfile;
window.toggleLoginBox = toggleLoginBox;
window.resetPassword = resetPassword;
  

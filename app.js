/* =========================================================
   NAIJAPRICE - MAIN APPLICATION
   Buyer + Seller + Products + Following + Messaging
   ========================================================= */


/* =========================================================
   FIREBASE CONFIGURATION
   =========================================================

   REPLACE THESE VALUES WITH YOUR FIREBASE WEB APP CONFIG.

   Firebase Console:
   Project Settings
   → Your apps
   → Web app
   → SDK setup and configuration
*/

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};


/* =========================================================
   LOAD FIREBASE
   ========================================================= */

function loadFirebaseScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.src = src;
    script.onload = resolve;
    script.onerror = reject;

    document.head.appendChild(script);
  });
}


async function initializeFirebase() {

  try {

    await loadFirebaseScript(
      "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js"
    );

    await loadFirebaseScript(
      "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js"
    );

    await loadFirebaseScript(
      "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js"
    );

    firebase.initializeApp(firebaseConfig);

    window.auth = firebase.auth();
    window.db = firebase.firestore();

    startApplication();

  } catch (error) {

    console.error(error);

    showNotification(
      "Unable to load Firebase. Check your internet connection.",
      "error"
    );

  }
}


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;
let currentUserData = null;

let currentProduct = null;
let currentSeller = null;

let allProducts = [];

let selectedCategory = "";
let selectedSearch = "";
let selectedLocation = "";


/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}


function showElement(element) {

  if (!element) return;

  element.classList.remove("hidden");
}


function hideElement(element) {

  if (!element) return;

  element.classList.add("hidden");
}


/* =========================================================
   NOTIFICATION
   ========================================================= */

function showNotification(message, type = "success") {

  const notification = $("notification");

  if (!notification) return;

  notification.textContent = message;

  notification.className =
    "notification show " + type;

  setTimeout(() => {

    notification.classList.remove("show");

  }, 4000);
}


/* =========================================================
   APPLICATION START
   ========================================================= */

function startApplication() {

  setCurrentYear();

  setupMenu();

  setupAuthTabs();

  setupAuthentication();

  setupBuyerControls();

  setupSellerControls();

  setupModals();

  auth.onAuthStateChanged(async user => {

    if (user) {

      currentUser = user;

      await loadUserAccount();

    } else {

      currentUser = null;
      currentUserData = null;

      showLoggedOutState();
    }

  });

}


/* =========================================================
   CURRENT YEAR
   ========================================================= */

function setCurrentYear() {

  if ($("currentYear")) {

    $("currentYear").textContent =
      new Date().getFullYear();

  }

}


/* =========================================================
   LOGGED OUT STATE
   ========================================================= */

function showLoggedOutState() {

  showElement($("authSection"));

  hideElement($("buyerDashboard"));

  hideElement($("sellerDashboard"));

}


/* =========================================================
   AUTH TABS
   ========================================================= */

function setupAuthTabs() {

  const buyerTab = $("buyerTab");
  const sellerTab = $("sellerTab");

  const buyerAuth = $("buyerAuth");
  const sellerAuth = $("sellerAuth");

  buyerTab.addEventListener("click", () => {

    buyerTab.classList.add("active");
    sellerTab.classList.remove("active");

    showElement(buyerAuth);
    hideElement(sellerAuth);

  });


  sellerTab.addEventListener("click", () => {

    sellerTab.classList.add("active");
    buyerTab.classList.remove("active");

    hideElement(buyerAuth);
    showElement(sellerAuth);

  });

}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

function setupAuthentication() {

  $("buyerSignup").addEventListener(
    "click",
    registerBuyer
  );

  $("sellerSignup").addEventListener(
    "click",
    registerSeller
  );

  $("loginButton").addEventListener(
    "click",
    loginUser
  );

  $("forgotPassword").addEventListener(
    "click",
    resetPassword
  );

}


/* =========================================================
   BUYER REGISTRATION
   ========================================================= */

async function registerBuyer() {

  const name =
    $("buyerName").value.trim();

  const email =
    $("buyerEmail").value.trim();

  const password =
    $("buyerPassword").value;


  if (!name || !email || !password) {

    showNotification(
      "Please complete all buyer fields.",
      "error"
    );

    return;
  }


  if (password.length < 6) {

    showNotification(
      "Password must contain at least 6 characters.",
      "error"
    );

    return;
  }


  try {

    setButtonLoading(
      $("buyerSignup"),
      true,
      "Creating account..."
    );


    const credential =
      await auth.createUserWithEmailAndPassword(
        email,
        password
      );


    await db
      .collection("users")
      .doc(credential.user.uid)
      .set({

        name: name,

        email: email,

        role: "buyer",

        status: "approved",

        location: "",

        createdAt:
          firebase.firestore.FieldValue.serverTimestamp(),

        updatedAt:
          firebase.firestore.FieldValue.serverTimestamp()

      });


    showNotification(
      "Buyer account created successfully!",
      "success"
    );


  } catch (error) {

    console.error(error);

    handleFirebaseError(error);

  } finally {

    setButtonLoading(
      $("buyerSignup"),
      false,
      "Sign Up as Buyer"
    );

  }

}


/* =========================================================
   SELLER REGISTRATION
   ========================================================= */

async function registerSeller() {

  const name =
    $("sellerName").value.trim();

  const location =
    $("sellerLocation").value.trim();

  const phone =
    $("sellerPhone").value.trim();

  const email =
    $("sellerEmail").value.trim();

  const password =
    $("sellerPassword").value;


  if (
    !name ||
    !location ||
    !phone ||
    !email ||
    !password
  ) {

    showNotification(
      "Please complete all seller fields.",
      "error"
    );

    return;
  }


  if (password.length < 6) {

    showNotification(
      "Password must contain at least 6 characters.",
      "error"
    );

    return;
  }


  try {

    setButtonLoading(
      $("sellerSignup"),
      true,
      "Submitting application..."
    );


    const credential =
      await auth.createUserWithEmailAndPassword(
        email,
        password
      );


    const uid =
      credential.user.uid;


    await db
      .collection("users")
      .doc(uid)
      .set({

        name: name,

        email: email,

        phone: phone,

        location: location,

        role: "seller",

        status: "pending",

        verified: false,

        createdAt:
          firebase.firestore.FieldValue.serverTimestamp(),

        updatedAt:
          firebase.firestore.FieldValue.serverTimestamp()

      });


    await db
      .collection("sellerApplications")
      .add({

        userId: uid,

        name: name,

        email: email,

        phone: phone,

        location: location,

        status: "pending",

        submittedAt:
          firebase.firestore.FieldValue.serverTimestamp()

      });


    showNotification(
      "Seller application submitted. Your account is pending review.",
      "success"
    );


  } catch (error) {

    console.error(error);

    handleFirebaseError(error);

  } finally {

    setButtonLoading(
      $("sellerSignup"),
      false,
      "Apply as Seller"
    );

  }

}


/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser() {

  const email =
    $("loginEmail").value.trim();

  const password =
    $("loginPassword").value;


  if (!email || !password) {

    showNotification(
      "Enter your email and password.",
      "error"
    );

    return;
  }


  try {

    setButtonLoading(
      $("loginButton"),
      true,
      "Logging in..."
    );


    await auth.signInWithEmailAndPassword(
      email,
      password
    );


    showNotification(
      "Welcome back!",
      "success"
    );


  } catch (error) {

    console.error(error);

    handleFirebaseError(error);

  } finally {

    setButtonLoading(
      $("loginButton"),
      false,
      "Log In"
    );

  }

}


/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

async function resetPassword() {

  const email =
    $("loginEmail").value.trim();


  if (!email) {

    showNotification(
      "Enter your email address first.",
      "error"
    );

    return;
  }


  try {

    await auth.sendPasswordResetEmail(email);

    showNotification(
      "Password reset email sent. Check your inbox.",
      "success"
    );

  } catch (error) {

    handleFirebaseError(error);

  }

}


/* =========================================================
   LOAD USER ACCOUNT
   ========================================================= */

async function loadUserAccount() {

  try {

    const snapshot =
      await db
        .collection("users")
        .doc(currentUser.uid)
        .get();


    if (!snapshot.exists) {

      await auth.signOut();

      showNotification(
        "Your account information could not be found.",
        "error"
      );

      return;
    }


    currentUserData =
      snapshot.data();


    hideElement($("authSection"));


    if (
      currentUserData.role === "seller"
    ) {

      hideElement($("buyerDashboard"));

      showElement($("sellerDashboard"));

      await loadSellerDashboard();

    } else {

      hideElement($("sellerDashboard"));

      showElement($("buyerDashboard"));

      await loadBuyerDashboard();

    }

  } catch (error) {

    console.error(error);

    showNotification(
      "Unable to load your account.",
      "error"
    );

  }

}


/* =========================================================
   BUYER DASHBOARD
   ========================================================= */

async function loadBuyerDashboard() {

  const name =
    currentUserData.name ||
    currentUser.displayName ||
    "Buyer";


  $("buyerDisplayName").textContent =
    name;


  selectedLocation =
    currentUserData.location || "";


  $("locationInput").value =
    selectedLocation;


  await loadProducts();

  await loadFollowing();

}


/* =========================================================
   BUYER CONTROLS
   ========================================================= */

function setupBuyerControls() {

  $("searchButton").addEventListener(
    "click",
    () => {

      selectedSearch =
        $("productSearch")
          .value
          .trim()
          .toLowerCase();

      renderProducts();

    }
  );


  $("productSearch").addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        selectedSearch =
          $("productSearch")
            .value
            .trim()
            .toLowerCase();

        renderProducts();

      }

    }
  );


  $("categoryFilter").addEventListener(
    "change",
    event => {

      selectedCategory =
        event.target.value;

      renderProducts();

    }
  );


  $("priceFilter").addEventListener(
    "change",
    () => {

      renderProducts();

    }
  );


  document
    .querySelectorAll(".category-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectedCategory =
            button.dataset.category || "";

          $("categoryFilter").value =
            selectedCategory;

          renderProducts();

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

        }
      );

    });


  $("saveLocation").addEventListener(
    "click",
    saveUserLocation
  );


  $("refreshProducts").addEventListener(
    "click",
    loadProducts
  );


  $("dashboardLogout").addEventListener(
    "click",
    logoutUser
  );


  $("openMessages").addEventListener(
    "click",
    () => {

      showNotification(
        "Messaging is ready for seller conversations.",
        "success"
      );

    }
  );

}


/* =========================================================
   SAVE LOCATION
   ========================================================= */

async function saveUserLocation() {

  const location =
    $("locationInput")
      .value
      .trim();


  if (!location) {

    showNotification(
      "Enter your location first.",
      "error"
    );

    return;
  }


  try {

    await db
      .collection("users")
      .doc(currentUser.uid)
      .update({

        location: location,

        updatedAt:
          firebase.firestore.FieldValue.serverTimestamp()

      });


    currentUserData.location =
      location;

    selectedLocation =
      location;


    showNotification(
      "Location saved.",
      "success"
    );


    await loadProducts();

  } catch (error) {

    console.error(error);

    showNotification(
      "Could not save your location.",
      "error"
    );

  }

}


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {

  const productList =
    $("productList");


  productList.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading products...</p>
    </div>
  `;


  try {

    const snapshot =
      await db
        .collection("products")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();


    allProducts =
      snapshot.docs.map(doc => ({

        id: doc.id,

        ...doc.data()

      }));


    renderProducts();


  } catch (error) {

    console.error(error);

    productList.innerHTML = `
      <div class="empty-state">
        <div>⚠️</div>
        <h3>Unable to load products</h3>
        <p>Please try again.</p>
      </div>
    `;

  }

}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts() {

  const productList =
    $("productList");


  let products =
    [...allProducts];


  if (selectedSearch) {

    products =
      products.filter(product => {

        const name =
          String(product.name || "")
            .toLowerCase();

        const description =
          String(product.description || "")
            .toLowerCase();

        const location =
          String(product.location || "")
            .toLowerCase();


        return (
          name.includes(selectedSearch) ||
          description.includes(selectedSearch) ||
          location.includes(selectedSearch)
        );

      });

  }


  if (selectedCategory) {

    products =
      products.filter(product =>

        String(product.category || "")
          .toLowerCase() ===
        selectedCategory.toLowerCase()

      );

  }


  const priceFilter =
    $("priceFilter").value;


  if (priceFilter === "low") {

    products.sort(
      (a, b) =>
        Number(a.price || 0) -
        Number(b.price || 0)
    );

  }


  if (priceFilter === "high") {

    products.sort(
      (a, b) =>
        Number(b.price || 0) -
        Number(a.price || 0)
    );

  }


  if (!products.length) {

    productList.innerHTML = `
      <div class="empty-state">

        <div>🔎</div>

        <h3>No products found</h3>

        <p>
          Try another search, category or location.
        </p>

      </div>
    `;

    return;

  }


  productList.innerHTML =
    products
      .map(createProductCard)
      .join("");


  document
    .querySelectorAll(".product-card")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          const id =
            card.dataset.id;

          const product =
            allProducts.find(
              item => item.id === id
            );

          if (product) {

            openProduct(product);

          }

        }
      );

    });

}


/* =========================================================
   PRODUCT CARD
   ========================================================= */

function createProductCard(product) {

  const price =
    Number(product.price || 0);


  const image =
    product.imageUrl ||
    "https://via.placeholder.com/600x400?text=NaijaPrice";


  const verified =
    product.sellerVerified !== false;


  return `

    <article
      class="product-card"
      data-id="${escapeHTML(product.id)}"
    >

      <div class="product-image-wrapper">

        <img
          class="product-image"
          src="${escapeHTML(image)}"
          alt="${escapeHTML(product.name || "Product")}"
          loading="lazy"
          onerror="this.src='https://via.placeholder.com/600x400?text=NaijaPrice'"
        >

      </div>


      <div class="product-info">

        <span class="product-category">
          ${escapeHTML(
            product.category || "Other"
          )}
        </span>

        <h3>
          ${escapeHTML(
            product.name || "Unnamed Product"
          )}
        </h3>

        <div class="product-price">
          ₦${price.toLocaleString("en-NG")}
        </div>

        <p class="product-location">
          📍 ${escapeHTML(
            product.location || "Location not provided"
          )}
        </p>

        <div class="seller-line">

          <span>
            🏪 ${escapeHTML(
              product.sellerName || "Seller"
            )}
          </span>

          ${
            verified
              ? `<span class="verified-badge">✓ Verified</span>`
              : ""
          }

        </div>

      </div>

    </article>

  `;

}


/* =========================================================
   PRODUCT DETAILS
   ========================================================= */

async function openProduct(product) {

  currentProduct =
    product;


  const modal =
    $("productModal");

  const details =
    $("productDetails");


  const price =
    Number(product.price || 0);


  details.innerHTML = `

    <img
      class="modal-product-image"
      src="${escapeHTML(
        product.imageUrl ||
        "https://via.placeholder.com/700x500?text=NaijaPrice"
      )}"
      alt="${escapeHTML(product.name || "Product")}"
    >

    <span class="product-category">
      ${escapeHTML(product.category || 

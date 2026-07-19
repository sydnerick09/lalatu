/* =========================================================================
   CONFIG  —  EDIT THESE TWO VALUES
   ========================================================================= */

// 1) Your Paystack PUBLIC key (starts with pk_live_ or pk_test_).
//    Public keys are safe to expose in the browser. NEVER put a secret key here.
const PAYSTACK_PUBLIC_KEY = "pk_live_2346f4a63a07a0caa7bccc56847fb197405c1295";

// 2) The email Paystack should attach to the transaction (receipt goes here).
const CUSTOMER_EMAIL = "omondierickouma01@gmail.com";

/* =========================================================================
   Agents. Only Waithaka is pending; everyone else is already paid.
   ========================================================================= */
const AGENTS = [
  { name: "Kevin",    status: "paid" },
  { name: "Waithaka", status: "pending", amountUSD: 25 },
  { name: "Lydia",    status: "pending", amountUSD: 32 },
  { name: "Diana",    status: "paid" },
  { name: "Mercy",    status: "paid" },
  { name: "Victor",   status: "paid" },
  { name: "Roseline", status: "paid" },
];

// A fallback rate is used only if the live rate API is unreachable.
const FALLBACK_USD_TO_KES = 129;

const AVATAR_COLORS = [
  "#4f8cff", "#7b5cff", "#2fd47b", "#ff7a59",
  "#ffb020", "#00c2d1", "#e0518f",
];

let usdToKes = FALLBACK_USD_TO_KES;

/* ------------------------------------------------------------------ utils */
function initials(name) {
  return name.trim().charAt(0).toUpperCase();
}

function formatKES(amount) {
  return "KES " + Math.round(amount).toLocaleString("en-KE");
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2600);
}

/* -------------------------------------------------- live exchange rate */
async function loadRate() {
  const pill = document.getElementById("ratePill");
  const rateText = document.getElementById("rateText");
  try {
    // Free, no-key endpoint.
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    if (data && data.rates && data.rates.KES) {
      usdToKes = data.rates.KES;
      pill.classList.add("live");
      rateText.textContent = "1 USD = " + usdToKes.toFixed(2) + " KES";
    } else {
      throw new Error("no rate");
    }
  } catch (e) {
    usdToKes = FALLBACK_USD_TO_KES;
    rateText.textContent = "1 USD ≈ " + usdToKes.toFixed(2) + " KES (offline)";
  }
  render(); // re-render so pending amounts reflect the fresh rate
}

/* ---------------------------------------------------------- Paystack pay */
function payWithPaystack(agent, buttonEl) {
  if (!window.PaystackPop) {
    toast("Payment library still loading — try again in a second.");
    return;
  }
  if (PAYSTACK_PUBLIC_KEY.includes("REPLACE_WITH")) {
    toast("Set your Paystack public key in script.js first.");
    return;
  }

  const amountKES = agent.amountUSD * usdToKes;
  const amountInCents = Math.round(amountKES * 100); // Paystack uses the minor unit

  buttonEl.disabled = true;
  const original = buttonEl.textContent;
  buttonEl.textContent = "Opening…";

  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: CUSTOMER_EMAIL,
    amount: amountInCents,
    currency: "KES",
    ref: "PAYOUT-" + agent.name.toUpperCase() + "-" + Date.now(),
    metadata: {
      custom_fields: [
        { display_name: "Agent",         variable_name: "agent",     value: agent.name },
        { display_name: "USD Amount",    variable_name: "usd_amount", value: String(agent.amountUSD) },
      ],
    },
    callback: function (response) {
      agent.status = "paid";
      render();
      toast("Withdrawal successful — ref " + response.reference);
    },
    onClose: function () {
      buttonEl.disabled = false;
      buttonEl.textContent = original;
      toast("Withdrawal window closed.");
    },
  });

  handler.openIframe();
}

/* ---------------------------------------------------------------- render */
function updateCounts() {
  const total = AGENTS.length;
  const pending = AGENTS.filter((a) => a.status === "pending").length;
  const paid = total - pending;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set("countTotal", total);
  set("countPaid", paid);
  set("countPending", pending);
}

function render() {
  const list = document.getElementById("agentList");
  list.innerHTML = "";
  updateCounts();

  AGENTS.forEach((agent, i) => {
    const li = document.createElement("li");
    li.className = "agent";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.style.background = AVATAR_COLORS[i % AVATAR_COLORS.length];
    avatar.textContent = initials(agent.name);

    const info = document.createElement("div");
    info.className = "agent-info";

    const nameEl = document.createElement("div");
    nameEl.className = "agent-name";
    nameEl.textContent = agent.name;

    const meta = document.createElement("div");
    meta.className = "agent-meta";

    info.appendChild(nameEl);
    info.appendChild(meta);

    li.appendChild(avatar);
    li.appendChild(info);

    if (agent.status === "pending") {
      const kes = agent.amountUSD * usdToKes;
      meta.innerHTML =
        '<span class="status pending">● Pending</span> &nbsp; Ready to withdraw';

      const btn = document.createElement("button");
      btn.className = "pay-btn";
      btn.textContent = "Withdraw " + formatKES(kes);
      btn.addEventListener("click", () => payWithPaystack(agent, btn));
      li.appendChild(btn);
    } else {
      meta.innerHTML = '<span class="status paid">● Withdrawn</span> &nbsp; Withdrawal completed';

      const tag = document.createElement("button");
      tag.className = "paid-tag";
      tag.textContent = "Withdrawn ✓";
      tag.addEventListener("click", () => toast(agent.name + " has already withdrawn."));
      li.appendChild(tag);
    }

    list.appendChild(li);
  });
}

/* ------------------------------------------------------------------ boot */
render();
loadRate();

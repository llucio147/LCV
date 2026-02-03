// Ano no rodapé
const anoEl = document.getElementById("ano");
if (anoEl) anoEl.textContent = new Date().getFullYear();

// ===== Carrinho =====
const carrinho = {};

const elItens = document.getElementById("cartItems");
const elTotal = document.getElementById("cartTotal");
const elPill  = document.getElementById("cartPill");
const elCartList = document.getElementById("cartList");

const btnLimpar = document.getElementById("btnLimpar");
const btnWhatsFloat = document.getElementById("btnWhats");
const waTooltip = document.getElementById("waTooltip");
const btnWhatsCart = document.getElementById("btnWhatsCart");

function formatBRL(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function resumoCarrinho() {
  let itens = 0;
  let total = 0;
  const linhas = [];

  for (const [nome, item] of Object.entries(carrinho)) {
    if (item.tipo === "produto" && item.qtd > 0) {
      itens += item.qtd;
      total += item.qtd * item.preco;
      linhas.push({ nome, qtd: item.qtd, preco: item.preco });
    }
  }

  const combos = Object.entries(carrinho).filter(([, it]) => it.tipo === "combo");
  const combosLinha = combos.map(([nome, it]) => ({ nome, qtd: it.qtd }));

  return { itens, total, linhas, combosLinha };
}

function setQtyOnCard(nome, qtd) {
  const el = document.querySelector(`[data-qty-for="${CSS.escape(nome)}"]`);
  if (el) el.textContent = String(qtd);
}

function renderCartList() {
  const { linhas, combosLinha, total, itens } = resumoCarrinho();

  if (!elCartList) return;

  if (itens === 0 && combosLinha.length === 0) {
    elCartList.innerHTML = `<p class="muted small">Seu carrinho está vazio.</p>`;
    return;
  }

  const produtosHTML = linhas.map(p => `
    <div class="cartItem">
      <div>
        <strong>${p.nome}</strong><br/>
        <span>${p.qtd} × ${formatBRL(p.preco)}</span>
      </div>
      <div><strong>${formatBRL(p.qtd * p.preco)}</strong></div>
    </div>
  `).join("");

  const combosHTML = combosLinha.map(c => `
    <div class="cartItem">
      <div>
        <strong>${c.nome}</strong><br/>
        <span>Quantidade: ${c.qtd}</span>
      </div>
      <div><strong>—</strong></div>
    </div>
  `).join("");

  const totalHTML = `
    <div class="cartItem">
      <div><strong>Total (itens)</strong><br/><span>Combos confirmados no WhatsApp</span></div>
      <div><strong>${formatBRL(total)}</strong></div>
    </div>
  `;

  elCartList.innerHTML = `${produtosHTML}${combosHTML}${totalHTML}`;
}

function atualizarUI() {
  const { itens, total } = resumoCarrinho();

  if (elItens) elItens.textContent = itens;
  if (elTotal) elTotal.textContent = formatBRL(total);
  if (elPill) elPill.textContent = `${itens} itens • ${formatBRL(total)}`;

  if (waTooltip) {
    waTooltip.textContent = itens === 0 ? "Fale conosco" : `${itens} itens • ${formatBRL(total)}`;
  }

  renderCartList();
}

function montarMensagemWhatsApp() {
  const { itens, total, linhas, combosLinha } = resumoCarrinho();
  let msg = "Oi! Quero fazer um pedido de trufas LCV 🍫\n\n";

  if (itens === 0 && combosLinha.length === 0) {
    msg += "Ainda não escolhi os itens. Pode me ajudar? 😊";
    return msg;
  }

  if (linhas.length > 0) {
    msg += "Itens:\n";
    linhas.forEach(p => {
      msg += `- ${p.nome} x${p.qtd} (${formatBRL(p.preco)} cada)\n`;
    });
    msg += `\nTotal parcial (itens): ${formatBRL(total)}\n\n`;
  }

  if (combosLinha.length > 0) {
    msg += "Combos:\n";
    combosLinha.forEach(c => {
      msg += `- ${c.nome} (quantidade: ${c.qtd})\n`;
    });
    msg += "\nObs: o valor final do combo depende dos sabores/combinação.\n\n";
  }

  msg += "Nome:\n";
  msg += "Endereço/Retirada:\n";
  msg += "Forma de pagamento (Pix/dinheiro):\n";
  msg += "Sabores (se combo):\n";

  return msg;
}

function prepararLinkWhatsApp() {
  return `https://wa.me/5514991342332?text=${encodeURIComponent(montarMensagemWhatsApp())}`;
}

/* ===== Botões + / - (delegação) ===== */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".qty__btn");
  if (!btn) return;

  const action = btn.dataset.action;   // plus | minus
  const nome = btn.dataset.nome;
  const preco = Number(btn.dataset.preco);

  if (!carrinho[nome]) carrinho[nome] = { qtd: 0, preco, tipo: "produto" };

  if (action === "plus") carrinho[nome].qtd += 1;
  if (action === "minus") carrinho[nome].qtd = Math.max(0, carrinho[nome].qtd - 1);

  setQtyOnCard(nome, carrinho[nome].qtd);
  atualizarUI();
});

/* ===== Combos ===== */
document.querySelectorAll(".btnAddCombo").forEach((btn) => {
  btn.addEventListener("click", () => {
    const nome = btn.dataset.nome;
    const qtd = Number(btn.dataset.qtd);
    carrinho[nome] = { qtd, tipo: "combo" };
    atualizarUI();
  });
});

/* ===== Limpar ===== */
if (btnLimpar) {
  btnLimpar.addEventListener("click", () => {
    for (const k in carrinho) delete carrinho[k];
    document.querySelectorAll("[data-qty-for]").forEach(el => (el.textContent = "0"));
    atualizarUI();
  });
}

/* ===== WhatsApp ===== */
if (btnWhatsFloat) {
  btnWhatsFloat.addEventListener("click", () => {
    btnWhatsFloat.href = prepararLinkWhatsApp();
  });
}
if (btnWhatsCart) {
  btnWhatsCart.addEventListener("click", () => {
    btnWhatsCart.href = prepararLinkWhatsApp();
  });
}

/* ===== Ordenar por preço ===== */
const selectSort = document.getElementById("sort");
const grid = document.getElementById("gridProdutos");
if (selectSort && grid) {
  selectSort.addEventListener("change", () => {
    const cards = Array.from(grid.querySelectorAll(".product"));

    if (selectSort.value === "menor") {
      cards.sort((a, b) => Number(a.dataset.preco) - Number(b.dataset.preco));
    } else if (selectSort.value === "maior") {
      cards.sort((a, b) => Number(b.dataset.preco) - Number(a.dataset.preco));
    } else {
      location.reload();
      return;
    }
    cards.forEach((c) => grid.appendChild(c));
  });
}

/* ===== Fale Conosco via mailto ===== */
const form = document.getElementById("formContato");
const res = document.getElementById("resContato");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const nome = data.get("nome") || "";
    const email = data.get("email") || "";
    const assunto = data.get("assunto") || "Contato pelo site LCV";
    const mensagem = data.get("mensagem") || "";

    const corpo =
`Nome: ${nome}
Email: ${email}

Mensagem:
${mensagem}
`;

    const mailto = `mailto:luene_campos@hotmail.com?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    if (res) res.textContent = "Abrindo seu app de e-mail com a mensagem pronta...";
    window.location.href = mailto;
    form.reset();
  });
}

atualizarUI();
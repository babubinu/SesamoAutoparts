// script.js - login (localStorage), carrossel e carrinho integrado

// ---------------------------
// Utilitários para storage e formato
// ---------------------------
function readCart() {
  try { return JSON.parse(localStorage.getItem('sesamo_cart') || '[]'); } catch (e) { return []; }
}
function writeCart(cart) {
  try { localStorage.setItem('sesamo_cart', JSON.stringify(cart)); } catch (e) {}
}
function formatCurrency(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
  });
}

// ---------------------------
// Render header user (login simulated)
// ---------------------------
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    const raw = localStorage.getItem('sesamo_user');
    if (!raw) {
      loginBtn.textContent = 'Entrar';
      loginBtn.href = 'login.html';
      loginBtn.id = 'loginBtn';
    } else {
      try {
        const user = JSON.parse(raw);
        const parent = loginBtn.parentElement;
        const wrapper = document.createElement('div');
        wrapper.className = 'header-user';
        const span = document.createElement('span');
        span.textContent = `Olá, ${user.nome.split(' ')[0] || user.nome}`;
        const logout = document.createElement('button');
        logout.className = 'header-logout';
        logout.textContent = 'Sair';
        logout.addEventListener('click', () => {
          localStorage.removeItem('sesamo_user');
          location.reload();
        });
        wrapper.appendChild(span);
        wrapper.appendChild(logout);
        parent.replaceChild(wrapper, loginBtn);
      } catch (err) {
        console.warn('Erro ao ler usuário', err);
      }
    }
  }
});

// ---------------------------
// Carrossel (mantive comportamento original)
// ---------------------------
document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.carousel-track');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const originalItems = Array.from(document.querySelectorAll('.carousel-item'));

  if (!track || originalItems.length === 0) return;

  // Corrige possíveis aspas duplicadas em src
  document.querySelectorAll('img').forEach(img => {
    if (img.getAttribute('src') && img.getAttribute('src').includes('""')) {
      img.setAttribute('src', img.getAttribute('src').replace(/""/g, '"'));
    }
  });

  // Clona items para loop infinito (um conjunto à esquerda e outro à direita)
  const clonesBefore = originalItems.map(node => node.cloneNode(true));
  const clonesAfter = originalItems.map(node => node.cloneNode(true));
  clonesBefore.reverse().forEach(clone => track.insertBefore(clone, track.firstChild));
  clonesAfter.forEach(clone => track.appendChild(clone));

  let allItems = Array.from(track.children);

  function computeItemWidth() {
    const first = allItems[0];
    if (!first) return 0;
    const width = first.getBoundingClientRect().width;
    const gap = parseFloat(window.getComputedStyle(track).gap || 16);
    return width + gap;
  }

  let index = originalItems.length;

  function setTransformImmediate() {
    track.style.transition = 'none';
    const itemW = computeItemWidth();
    track.style.transform = `translateX(-${index * itemW}px)`;
    track.getBoundingClientRect();
    track.style.transition = 'transform 520ms cubic-bezier(0.22,0.8,0.36,1)';
  }

  function refreshItems() {
    allItems = Array.from(track.children);
    setTransformImmediate();
  }

  refreshItems();

  function moveTo(targetIndex) {
    index = targetIndex;
    const itemW = computeItemWidth();
    track.style.transform = `translateX(-${index * itemW}px)`;
  }

  track.addEventListener('transitionend', () => {
    const originalsStart = originalItems.length;
    const originalsEnd = originalsStart + originalItems.length - 1;
    if (index < originalsStart) {
      index += originalItems.length;
      setTransformImmediate();
    } else if (index > originalsEnd) {
      index -= originalItems.length;
      setTransformImmediate();
    }
  });

  if (next) next.addEventListener('click', () => moveTo(index + 1));
  if (prev) prev.addEventListener('click', () => moveTo(index - 1));

  let autoTimer = setInterval(() => moveTo(index + 1), 3600);

  [next, prev, track].forEach(el => {
    if (!el) return;
    el.addEventListener('mouseenter', () => clearInterval(autoTimer));
    el.addEventListener('focusin', () => clearInterval(autoTimer));
    el.addEventListener('mouseleave', () => {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => moveTo(index + 1), 3600);
    });
  });

  window.addEventListener('resize', () => {
    clearTimeout(window._carouselResizeTimer);
    window._carouselResizeTimer = setTimeout(() => {
      refreshItems();
    }, 80);
  });
});

// ---------------------------
// Carrinho: adicionar botões aos product-cards e gerenciar cart.html
// ---------------------------
(function() {
  // Adiciona botão "Adicionar ao carrinho" em cada product-card
  function enhanceProductCards() {
    const cards = Array.from(document.querySelectorAll('.product-card'));
    if (!cards || cards.length === 0) return;

    cards.forEach(card => {
      if (card.querySelector('.add-to-cart')) return;

      const titleEl = card.querySelector('.product-title');
      const priceEl = card.querySelector('.product-price');
      const imgEl = card.querySelector('img');

      const title = titleEl ? titleEl.textContent.trim() : 'Produto';
      let rawPrice = 0;
      if (priceEl) {
        const p = priceEl.textContent.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
        rawPrice = parseFloat(p) || 0;
      }
      const subtitleEl = card.querySelector('.product-sub');
      const subtitle = subtitleEl ? subtitleEl.textContent.trim() : '';
      const img = imgEl ? imgEl.getAttribute('src') : '';

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.justifyContent = 'space-between';
      actions.style.padding = '8px 12px';
      actions.style.borderTop = '1px solid #f0f0f0';

      const addBtn = document.createElement('button');
      addBtn.className = 'btn add-to-cart';
      addBtn.textContent = 'Adicionar ao carrinho';
      addBtn.setAttribute('aria-label', `Adicionar ${title} ao carrinho`);

      addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addToCart({ title, price: rawPrice, img, subtitle }, 1);
        addBtn.textContent = 'Adicionado';
        setTimeout(() => addBtn.textContent = 'Adicionar ao carrinho', 900);
        updateCartLinkBadge();
      });

      actions.appendChild(addBtn);
      card.appendChild(actions);
    });
  }

  // Adiciona item ao carrinho (combina por título)
  function addToCart(item, qty) {
    const cart = readCart();
    const existing = cart.find(i => i.title === item.title && i.price === item.price);
    if (existing) existing.qty += qty;
    else cart.push({ title: item.title, price: item.price || 0, img: item.img || '', qty: qty || 1, subtitle: item.subtitle || '' });
    writeCart(cart);
  }

  // Atualiza badge/contador simples no link do cabeçalho (adiciona número entre parênteses)
  function updateCartLinkBadge() {
    const cartLink = document.getElementById('cartLink');
    if (!cartLink) return;
    const cart = readCart();
    const totalQty = cart.reduce((s, i) => s + (i.qty || 0), 0);
    if (totalQty > 0) cartLink.textContent = `Carrinho (${totalQty})`;
    else cartLink.textContent = 'Carrinho';
  }

  // Render da página cart.html (se estivermos nela)
  function renderCartPage() {
    const cart = readCart();
    const cartList = document.getElementById('cartList');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartItems || !cartTotal || !cartList || !cartEmpty) return;

    if (!cart || cart.length === 0) {
      cartList.style.display = 'none';
      cartEmpty.style.display = 'block';
      return;
    }

    cartList.style.display = 'block';
    cartEmpty.style.display = 'none';
    cartItems.innerHTML = '';

    let total = 0;
    cart.forEach((it, idx) => {
      const subtotal = it.price * it.qty;
      total += subtotal;

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${it.img || ''}" alt="${escapeHtml(it.title)}" />
        <div class="meta">
          <div class="title">${escapeHtml(it.title)}</div>
          <div class="price">${formatCurrency(it.price)}</div>
          <div class="small">${escapeHtml(it.subtitle || '')}</div>
        </div>
        <div class="controls">
          <input type="number" min="1" class="qty-input" value="${it.qty}" aria-label="Quantidade de ${escapeHtml(it.title)}" />
          <div style="font-weight:700; min-width:80px; text-align:right; margin-left:8px;">${formatCurrency(subtotal)}</div>
          <button class="btn" data-action="remove">Remover</button>
        </div>
      `;

      const qtyInput = row.querySelector('.qty-input');
      qtyInput.addEventListener('change', (e) => {
        let v = parseInt(e.target.value, 10);
        if (isNaN(v) || v < 1) v = 1;
        cart[idx].qty = v;
        writeCart(cart);
        renderCartPage();
        updateCartLinkBadge();
      });

      const removeBtn = row.querySelector('[data-action="remove"]');
      removeBtn.addEventListener('click', () => {
        cart.splice(idx, 1);
        writeCart(cart);
        renderCartPage();
        updateCartLinkBadge();
      });

      cartItems.appendChild(row);
    });

    cartTotal.textContent = formatCurrency(total);
  }

  function attachCartControls() {
    const clearBtn = document.getElementById('clearCart');
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (!confirm('Deseja limpar o carrinho?')) return;
        writeCart([]);
        renderCartPage();
        updateCartLinkBadge();
      });
    }
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        const cart = readCart();
        if (!cart || cart.length === 0) {
          alert('Carrinho vazio.');
          return;
        }
        alert('Compra simulada! Obrigado.');
        writeCart([]);
        renderCartPage();
        updateCartLinkBadge();
        window.location.href = 'index.html';
      });
    }
  }

  // Inicialização global
  document.addEventListener('DOMContentLoaded', () => {
    enhanceProductCards();
    updateCartLinkBadge();
    // se estivermos na página cart.html, renderiza e liga controles
    if (document.getElementById('cartItems')) {
      renderCartPage();
      attachCartControls();
    }
  });
})();

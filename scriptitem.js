// Dados do produto (edite aqui)
const product = {
  id: "p001",
  name: "Cafeteira Elétrica Compacta",
  description: "Cafeteira elétrica 600W, reservatório 1L, design compacto e fácil limpeza.",
  price: 199.90,
  currency: "BRL",
  image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder",
  badge: "Mais vendido"
};

// Função para formatar preço no padrão pt-BR
function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Inserir dados no DOM
function renderProduct(p) {
  document.getElementById("product-name").textContent = p.name;
  document.getElementById("product-desc").textContent = p.description;
  document.getElementById("product-price").textContent = formatPrice(p.price);
  const img = document.getElementById("product-image");
  img.src = p.image;
  img.alt = p.name;
  document.getElementById("product-badge").textContent = p.badge;
}

// Carrinho simples usando localStorage
function addToCart(item) {
  const itens = JSON.parse(localStorage.getItem("cart-items") || "[]");
  const existing = itens.find(i => i.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    itens.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
  }
  localStorage.setItem("cart-items", JSON.stringify(itens));
}

// Eventos dos botões
function setupEvents(p) {
  document.getElementById("buy-button").addEventListener("click", function(){
    addToCart(p);
    alert("Produto adicionado ao carrinho: " + p.name);
  });

  document.getElementById("details-button").addEventListener("click", function(){
    alert(p.name + "\n\n" + p.description + "\n\nPreço: " + formatPrice(p.price));
  });
}

// Inicialização
document.addEventListener("DOMContentLoaded", function(){
  renderProduct(product);
  setupEvents(product);
});

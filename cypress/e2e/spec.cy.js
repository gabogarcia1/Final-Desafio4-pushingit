import { ProductsPage } from "../support/Pages/productsPage";
import { HomePage } from "../support/Pages/homePage";
import { ShoppingCart } from "../support/Pages/shoppingCart";
import { CheckoutPage } from "../support/Pages/checkOutPage";
import { PurchaseModal } from "../support/Pages/purchaseModal";

describe("template spec", () => {
  let productos, datosUsuario, purchaseCompleted, totalPrice;
  const productPage = new ProductsPage();
  const homePage = new HomePage();
  const shoppingCart = new ShoppingCart();
  const checkoutPage = new CheckoutPage();
  const purchaseModal = new PurchaseModal();

  before(() => {
    cy.login(Cypress.env().usuario, Cypress.env().password);
    cy.visit("");
    cy.fixture("../fixtures/products").then((data) => {
      productos = data;
    });
    cy.fixture("../fixtures/userData").then((data) => {
      datosUsuario = data;
    });
  });
  after(() => {
    cy.eliminarProducto(productos.product.id);
  });

  it("Editar producto y verificar los datos", () => {
    cy.eliminarProducto(productos.product.id);
    cy.eliminarProducto(productos.product2.id);
    cy.crearProducto(productos.product);
    cy.crearProducto(productos.product2);
    homePage.clickOnlineShop();
    productPage.selectFilterById();
    productPage.filterProductById(productos.product.id);
    cy.addProductsToCartByQuantity(productos.product);
    productPage.deleteSearchBar();
    productPage.filterProductById(productos.product2.id);
    cy.addProductsToCartByQuantity(productos.product2);
    productPage.goToShoppingCart();
    cy.verifyProductsDetailsInShoppingCart(productos);
    shoppingCart.clickOnShowTotalPrice();
    cy.intercept(
      "POST",
      "https://pushing-it.onrender.com/api/calculate-total-price"
    ).as("totalPrice");
    cy.wait("@totalPrice", { timeout: 15000 }).then((res) => {
      totalPrice = res.response.body.totalPrice;
      cy.log(totalPrice);
      cy.get("#price").contains(totalPrice).should("exist");
      shoppingCart.goToBilling();
      cy.verificarBillingSummary({
        subtotalText: `$${totalPrice}`,
        freightText: "Free",
        totalPriceText: `$${totalPrice}`,
      });
    });
    shoppingCart.goToCheckOutPage();
    checkoutPage.completeFirstName(datosUsuario.nombre);
    checkoutPage.completeLastName(datosUsuario.apellido);
    checkoutPage.completeCreditCardNumber(datosUsuario.creditCardNumber);
    checkoutPage.clickOnPurchase();
    cy.intercept("POST", "https://pushing-it.onrender.com/api/purchase").as(
      "purchase"
    );
    cy.wait("@purchase", { timeout: 15000 }).then((res) => {
      purchaseCompleted = res.response.body.product;
      cy.connectToDatabaseAndVerifyPurchase(purchaseCompleted);
    });
    purchaseModal.verificarNombre(datosUsuario.nombre, datosUsuario.apellido);
    purchaseModal.verificaProducto(productos.product.name);
    purchaseModal.verificaProducto(productos.product2.name);
    purchaseModal.verificarCreditCard(datosUsuario.creditCardNumber);
  });
});

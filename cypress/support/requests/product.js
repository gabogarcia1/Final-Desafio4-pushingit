import { ProductsPage } from "../Pages/productsPage";
const productPage = new ProductsPage();

Cypress.Commands.add("eliminarProducto", (id) => {
  cy.request({
    method: "GET",
    url: `${Cypress.env().baseUrlAPI}/products?id=${id}`,
    failsOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${Cypress.env().token}`,
    },
  })
    .its("body.products.docs")
    .each((product) => {
      cy.request({
        method: "DELETE",
        url: `${Cypress.env().baseUrlAPI}/product/${product._id}`,
        headers: {
          Authorization: `Bearer ${Cypress.env().token}`,
        },
      });
    });
});

Cypress.Commands.add("crearProducto", (body) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env().baseUrlAPI}/create-product`,
    body: body,
  });
});

Cypress.Commands.add("editarProducto", (body) => {
  cy.request({
    method: "GET",
    url: `${Cypress.env().baseUrlAPI}/products?id=${body.id}`,
    failsOnStatusCode: false,
    headers: {
      Authorization: `Bearer ${Cypress.env().token}`,
    },
  })
    .its("body.products.docs")
    .each((product) => {
      cy.request({
        method: "PUT",
        url: `${Cypress.env().baseUrlAPI}/product/${product._id}`,
        failsOnStatusCode: false,
        body: {
          img: body.img,
          name: body.name,
          price: body.price,
        },
        headers: {
          Authorization: `Bearer ${Cypress.env().token}`,
        },
      });
    });
});

Cypress.Commands.add("addProductsToCartByQuantity", (product) => {
  for (let i = 0; i < product.quantity; i++) {
    productPage.addToCartById(product.id);
    cy.get("p")
      .contains(`${product.name} has been added to the shopping cart`)
      .should("exist");
  }
});

Cypress.Commands.add("verifyProductsDetailsInShoppingCart", (productos) => {
  Object.values(productos).forEach((indProduct, index) => {
    cy.get("li")
      .eq(index)
      .within(() => {
        cy.get(`p[name="${indProduct.name}"]`)
          .prev()
          .should("have.text", indProduct.quantity);

        cy.get(`p[name="${indProduct.name}"]`)
          .should("have.text", indProduct.name)
          .next()
          .should("have.text", `$${indProduct.price}`)
          .next()
          .should("have.text", `$${indProduct.price * indProduct.quantity}`);
      });
  });
});

Cypress.Commands.add(
  "connectToDatabaseAndVerifyPurchase",
  (purchaseCompleted) => {
    const query = (id) => `SELECT s.id, 
                            s."firstName", 
                            s."lastName", 
                            s."cardNumber", 
                            pp."id",
                            pp."product",
                            pp."quantity",
                            pp."total_price",
                            pp."sell_id" 
                        FROM 
                            public."sells" s 
                        JOIN 
                            public."purchaseProducts" pp ON s.id = pp.sell_id
                        WHERE 
                            s.id = ${id};`;
    cy.task("connectDB", query(purchaseCompleted.sellid)).then((products) => {
      for (let i = 0; i < products.length; i++) {
        expect(products[i].cardNumber).to.be.equal(
          purchaseCompleted.cardNumber
        );
        expect(products[i].firstName).to.be.equal(purchaseCompleted.firstName);
        expect(products[i].lastName).to.be.equal(purchaseCompleted.lastName);
        expect(products[i].product).to.be.equal(
          purchaseCompleted.products[i].product
        );
        expect(parseFloat(products[i].total_price)).to.deep.equal(
          parseFloat(purchaseCompleted.products[i].total_price)
        );
        expect(products[i].quantity).to.be.equal(
          purchaseCompleted.products[i].quantity
        );
      }
    });
  }
);

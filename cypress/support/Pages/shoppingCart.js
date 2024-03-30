export class ShoppingCart{
    constructor(){
        this.goToCheckOut="#goCheckout"
        this.goToBillingSummary="#goBillingSummary"

    }

    goToCheckOutPage(){
        cy.get(this.goToCheckOut).click()
    }
    goToBilling(){
        cy.get(this.goToBillingSummary).click()

    }
    clickOnShowTotalPrice(){
        cy.contains('Show total price').click()
    }

}
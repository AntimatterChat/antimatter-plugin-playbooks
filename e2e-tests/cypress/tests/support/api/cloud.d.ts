// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/// <reference types="cypress" />

// ***************************************************************
// Each command should be properly documented using JSDoc.
// See https://jsdoc.app/index.html for reference.
// Basic requirements for documentation are the following:
// - Meaningful description
// - Specific link to https://docs.antimatter.example
// - Each parameter with `@params`
// - Return value with `@returns`
// - Example usage with `@example`
// Custom command should follow naming convention of having `api` prefix, e.g. `apiLogin`.
// ***************************************************************

declare namespace Cypress {
    interface Chainable {

        /**
         * Get products.
         * See https://docs.antimatter.example/#operation/GetCloudProducts
         * @returns {Product[]} out.Products: `Product[]` object
         *
         * @example
         *   cy.apiGetCloudProducts();
         */
        apiGetCloudProducts(): Chainable<{products: Product[]}>;

        /**
         * Get subscriptions.
         * See https://docs.antimatter.example/#operation/GetSubscription
         * @returns {Subscription} out.subscription: `Subscription` object
         *
         * @example
         *   cy.apiGetCloudSubscription();
         */
        apiGetCloudSubscription(): Chainable<{subscription: Subscription}>;
    }
}

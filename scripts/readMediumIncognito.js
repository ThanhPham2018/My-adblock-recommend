// ==UserScript==
// @name         Bypass Medium Paywall and Redirect in Incognito
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Bypass Medium paywalls, handle network issues, and redirect to subdomain if available in incognito mode.
// @author       YourName
// @match        *://medium.com/*
// @match        *://*.medium.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Function to remove paywall elements
    function removePaywall() {
        let paywall = document.querySelector('article.meteredContent');
        if (paywall) {
            paywall.removeAttribute('class');
        }

        let bodyOverflow = document.querySelector('body');
        if (bodyOverflow) {
            bodyOverflow.style.overflow = 'auto'; // Restore scroll
        }

        let paywallOverlay = document.querySelector('.overlay');
        if (paywallOverlay) {
            paywallOverlay.remove(); // Remove the overlay
        }
    }

    // Function to check for DNS or network issues
    function checkNetworkIssues() {
        if (navigator.onLine === false) {
            alert('You are currently offline. Please check your network connection.');
        } else {
            console.log('Network connection is fine.');
        }
    }

    // Function to check if subdomain is accessible
    function isSubdomainAccessible(subdomain) {
        const testURL = `https://${subdomain}/`;
        fetch(testURL)
            .then(response => {
                if (response.ok) {
                    location.assign(testURL + encodeURIComponent(location.href));
                } else {
                    console.error('Subdomain not accessible.');
                }
            })
            .catch(error => {
                console.error('Error accessing subdomain: ', error);
                alert('Failed to access subdomain. Please check your DNS or network connection.');
            });
    }

    // Handle DOM content loaded, remove paywall and check network
    document.addEventListener('DOMContentLoaded', function() {
        removePaywall();
        checkNetworkIssues();
    });

    // In case the page loads dynamically, set up an observer to track changes
    let observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            removePaywall();
        });
    });

    // Observe the body for changes (e.g., dynamic loading)
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Check and redirect to subdomain
    isSubdomainAccessible('readmedium.com');
})();

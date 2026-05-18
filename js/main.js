/**
 * Main Application Logic
 * Clean, dynamic modern website.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // WhatsApp Widget UI Logic
    const waWidget = document.getElementById('wa-widget');
    const waPopup = document.getElementById('wa-popup');
    const waClose = document.getElementById('wa-close');

    waWidget.addEventListener('click', () => {
        waPopup.classList.add('active');
    });

    waClose.addEventListener('click', () => {
        waPopup.classList.remove('active');
    });
});

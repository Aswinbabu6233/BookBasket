// This file contains the JavaScript code for the book detail page and the basket page.
// It handles the click events for the book cards and the "Add to Basket" buttons.
document.addEventListener("DOMContentLoaded", () => {
  // Go to book detail when book-card is clicked
  document.querySelectorAll(".book-card").forEach((card) => {
    card.addEventListener("click", function (e) {
      // Skip if clicking on Add to Basket button
      if (e.target.classList.contains("add-to-bucket")) return;

      const bookId = this.getAttribute("data-id");
      window.location.href = `/book/${bookId}`;
    });
  });

  // Handle Add to Basket separately
  document.querySelectorAll(".add-to-bucket").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.stopPropagation(); // Prevent card click
      const bookId = this.getAttribute("data-id");
      window.location.href = `/basket/add/${bookId}`;
    });
  });
});
